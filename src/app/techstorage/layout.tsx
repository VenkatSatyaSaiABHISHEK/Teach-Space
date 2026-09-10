import React from 'react';
import { TechStorageLayout } from '@/components/techstorage/TechStorageLayout';

export const metadata = {
  title: 'TechStorage — API-Powered Storage | TechSpace',
  description: 'Give your projects secure, API-powered storage backed by your physical TechSpace storage.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TechStorageLayout>{children}</TechStorageLayout>;
}
