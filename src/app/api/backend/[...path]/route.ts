import { NextRequest, NextResponse } from 'next/server';

function getTargetBaseUrl(req: NextRequest): string {
  // Check if client passed custom target via header
  const customTarget = req.headers.get('x-vssa-target-url');
  let base = customTarget || process.env.NEXT_PUBLIC_API_URL || 'https://cloud.vssa.site';

  base = base.trim().replace(/\/+$/, '');

  // Auto-upgrade remote domain from http to https (e.g. cloud.vssa.site)
  if (base.startsWith('http://') && !base.includes('localhost') && !base.includes('127.0.0.1') && !base.match(/^http:\/\/\d+\.\d+\.\d+\.\d+/)) {
    base = base.replace('http://', 'https://');
  }

  return base;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

interface UpstreamFetchOptions {
  method: string;
  headers: Record<string, string>;
  body?: BodyInit | null;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Resilient upstream fetch with automatic retry on transient socket drops,
 * Cloudflare tunnel hiccups, and Raspberry Pi drive spin-up (502/504) delays.
 */
async function fetchWithUpstreamRetry(
  targetUrl: string,
  options: UpstreamFetchOptions
): Promise<Response> {
  const {
    method,
    headers,
    body,
    timeoutMs = 35000,
    maxRetries = 2,
  } = options;

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const fetchOpts: RequestInit = {
        method,
        headers: {
          ...headers,
          Connection: 'keep-alive',
        },
        cache: 'no-store',
        signal: controller.signal,
      };

      if (body) {
        fetchOpts.body = body;
        // @ts-expect-error duplex required for streaming in Node fetch
        fetchOpts.duplex = 'half';
      }

      const res = await fetch(targetUrl, fetchOpts);
      clearTimeout(timeoutId);

      // Auto-retry once or twice on 502/504/530 if upstream server is waking up or tunnel reconnecting
      // (e.g. Raspberry Pi NTFS external drive spin-up delay or Cloudflare tunnel reconnect)
      if ((res.status === 502 || res.status === 504 || res.status === 530) && attempt <= maxRetries) {
        console.warn(
          `[Proxy ${method}] ${targetUrl} returned HTTP ${res.status} (attempt ${attempt}/${maxRetries + 1}). Retrying in ${attempt * 700}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, attempt * 700));
        continue;
      }

      return res;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Proxy ${method}] Attempt ${attempt}/${maxRetries + 1} failed for ${targetUrl}: ${errMsg}`
      );

      if (attempt <= maxRetries) {
        const backoff = attempt * 700;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }

  throw lastError || new Error(`Upstream request to ${targetUrl} failed after ${maxRetries + 1} attempts`);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetBase = getTargetBaseUrl(req);
  const pathStr = (path || []).join('/');

  const searchParams = req.nextUrl.search;
  const targetUrl = `${targetBase}/${pathStr}${searchParams}`;

  const isDownloadOrStream = pathStr.includes('download') || pathStr.endsWith('presentation');
  const timeoutMs = isDownloadOrStream ? 120000 : 35000;

  try {
    const upstreamHeaders: Record<string, string> = {
      Accept: req.headers.get('accept') || 'application/json',
    };

    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    let upstreamRes: Response;
    try {
      upstreamRes = await fetchWithUpstreamRetry(targetUrl, {
        method: 'GET',
        headers: upstreamHeaders,
        timeoutMs,
        maxRetries: 2,
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
      console.error(`[Proxy GET failed] ${targetUrl}: ${msg}`);
      return NextResponse.json(
        { detail: `Cannot connect to Raspberry Pi server at ${targetBase}: ${msg}` },
        { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // If upstream returns 502/504/530 (such as Cloudflare HTML/text error page) or 5xx with text/html, convert to clean JSON response
    const rawContentType = upstreamRes.headers.get('content-type') || '';
    if (!upstreamRes.ok && (upstreamRes.status === 502 || upstreamRes.status === 504 || upstreamRes.status === 530 || rawContentType.includes('text/html'))) {
      console.warn(`[Proxy GET] Upstream error HTTP ${upstreamRes.status} for ${targetUrl}`);
      const cleanMsg =
        upstreamRes.status === 502
          ? `Storage server at ${targetBase} is busy or waking up (HTTP 502 Bad Gateway). Please retry in a few moments.`
          : upstreamRes.status === 504
          ? `Storage server at ${targetBase} timed out (HTTP 504 Gateway Timeout).`
          : upstreamRes.status === 530
          ? `Raspberry Pi Cloudflare Tunnel is reconnecting (HTTP 530 / Error 1033). Please verify the device is powered on.`
          : `Storage server returned HTTP ${upstreamRes.status}`;

      return NextResponse.json(
        { detail: cleanMsg, status: upstreamRes.status },
        { status: upstreamRes.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    const searchPath = req.nextUrl.searchParams.get('path') || '';
    const isExplicitDownload = req.nextUrl.searchParams.get('download') === 'true';
    let contentType = upstreamRes.headers.get('content-type') || 'application/json';

    // Helper to detect mime type by extension
    const getMimeType = (fileOrPath: string): string | null => {
      const ext = fileOrPath.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf':
          return 'application/pdf';
        case 'png':
          return 'image/png';
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        case 'svg':
          return 'image/svg+xml';
        case 'mp4':
          return 'video/mp4';
        case 'webm':
          return 'video/webm';
        case 'mov':
          return 'video/quicktime';
        case 'txt':
        case 'log':
          return 'text/plain; charset=utf-8';
        case 'md':
          return 'text/markdown; charset=utf-8';
        case 'json':
          return 'application/json';
        default:
          return null;
      }
    };

    if (pathStr.endsWith('presentation')) {
      contentType = 'application/pdf';
    } else {
      const detected = getMimeType(searchPath);
      if (detected) {
        contentType = detected;
      }
    }

    responseHeaders.set('Content-Type', contentType);

    if (isExplicitDownload) {
      const fileName = searchPath.split('/').pop() || 'download';
      responseHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    } else {
      // By default serve inline so browser viewers/iframes/media NEVER trigger unwanted auto-downloads
      responseHeaders.set('Content-Disposition', 'inline');
    }

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const acceptRanges = upstreamRes.headers.get('accept-ranges');
    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    }

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    const etag = upstreamRes.headers.get('etag');
    if (etag) {
      responseHeaders.set('ETag', etag);
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy connection failed';
    console.error(`[Proxy GET error] ${targetUrl}: ${message}`);
    return NextResponse.json(
      { detail: `Cannot connect to Raspberry Pi server at ${targetBase}: ${message}` },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetBase = getTargetBaseUrl(req);
  const pathStr = (path || []).join('/');

  const searchParams = req.nextUrl.search;
  const targetUrl = `${targetBase}/${pathStr}${searchParams}`;

  const isUpload = pathStr.includes('upload');
  const timeoutMs = isUpload ? 120000 : 40000;

  try {
    const contentType = req.headers.get('content-type') || '';
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    // Buffer the body into a reusable ArrayBuffer so it can be re-sent safely if
    // the socket resets or the Raspberry Pi takes a few seconds to spin up.
    let bodyBuffer: BodyInit | null = null;
    try {
      const rawArrayBuffer = await req.arrayBuffer();
      if (rawArrayBuffer && rawArrayBuffer.byteLength > 0) {
        bodyBuffer = rawArrayBuffer;
      }
    } catch {
      bodyBuffer = null;
    }

    let upstreamRes: Response;
    try {
      upstreamRes = await fetchWithUpstreamRetry(targetUrl, {
        method: 'POST',
        headers,
        body: bodyBuffer,
        timeoutMs,
        maxRetries: 2,
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
      console.error(`[Proxy POST failed] ${targetUrl}: ${msg}`);
      return NextResponse.json(
        { detail: `Cannot connect to Raspberry Pi server at ${targetBase}: ${msg}` },
        { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const resContentType = upstreamRes.headers.get('content-type') || 'application/json';

    if (!upstreamRes.ok && (upstreamRes.status === 502 || upstreamRes.status === 504 || upstreamRes.status === 530 || resContentType.includes('text/html'))) {
      console.warn(`[Proxy POST] Upstream failed with HTTP ${upstreamRes.status} for ${targetUrl}`);
      const cleanMsg =
        upstreamRes.status === 502
          ? `Storage server at ${targetBase} is busy or waking up (HTTP 502 Bad Gateway). Please try again.`
          : upstreamRes.status === 504
          ? `Storage server at ${targetBase} timed out (HTTP 504 Gateway Timeout).`
          : upstreamRes.status === 530
          ? `Raspberry Pi Cloudflare Tunnel is reconnecting (HTTP 530 / Error 1033). Please verify the device is powered on.`
          : `Storage server returned HTTP ${upstreamRes.status}`;

      return NextResponse.json(
        { detail: cleanMsg, status: upstreamRes.status },
        { status: upstreamRes.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': resContentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy connection failed';
    console.error(`[Proxy POST error] ${targetUrl}: ${message}`);
    return NextResponse.json(
      { detail: `Cannot connect to Raspberry Pi server at ${targetBase}: ${message}` },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetBase = getTargetBaseUrl(req);
  const pathStr = (path || []).join('/');

  const searchParams = req.nextUrl.search;
  const targetUrl = `${targetBase}/${pathStr}${searchParams}`;

  try {
    let upstreamRes: Response;
    try {
      upstreamRes = await fetchWithUpstreamRetry(targetUrl, {
        method: 'DELETE',
        headers: {
          Accept: req.headers.get('accept') || 'application/json',
        },
        timeoutMs: 35000,
        maxRetries: 2,
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Network error';
      console.error(`[Proxy DELETE failed] ${targetUrl}: ${msg}`);
      return NextResponse.json(
        { detail: `Cannot connect to Raspberry Pi server at ${targetBase}: ${msg}` },
        { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/json';

    if (!upstreamRes.ok && (upstreamRes.status === 502 || upstreamRes.status === 504 || upstreamRes.status === 530 || contentType.includes('text/html'))) {
      console.warn(`[Proxy DELETE] Upstream failed with HTTP ${upstreamRes.status} for ${targetUrl}`);
      const cleanMsg =
        upstreamRes.status === 502
          ? `Storage server at ${targetBase} is busy or waking up (HTTP 502 Bad Gateway). Please try again.`
          : upstreamRes.status === 504
          ? `Storage server at ${targetBase} timed out (HTTP 504 Gateway Timeout).`
          : upstreamRes.status === 530
          ? `Raspberry Pi Cloudflare Tunnel is reconnecting (HTTP 530 / Error 1033). Please verify the device is powered on.`
          : `Storage server returned HTTP ${upstreamRes.status}`;

      return NextResponse.json(
        { detail: cleanMsg, status: upstreamRes.status },
        { status: upstreamRes.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy connection failed';
    console.error(`[Proxy DELETE error] ${targetUrl}: ${message}`);
    return NextResponse.json(
      { detail: `Cannot connect to Raspberry Pi server at ${targetBase}: ${message}` },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
