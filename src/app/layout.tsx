import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechSpace — Your storage. Your cloud.",
  description: "High-performance personal cloud storage system powered by Raspberry Pi.",
  keywords: ["personal cloud", "Raspberry Pi", "cloud storage", "TechSpace", "private storage"],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased light">
      <body className="h-full bg-[#fafafa] text-neutral-900 selection:bg-neutral-200">
        {children}
      </body>
    </html>
  );
}
