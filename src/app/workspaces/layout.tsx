import React from 'react';
import { WorkspaceLayout } from '@/components/workspaces/WorkspaceLayout';

export const metadata = {
  title: 'Project Workspaces — TechSpace',
  description: 'Turn your project files on physical TechSpace drives into interactive showcases.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
