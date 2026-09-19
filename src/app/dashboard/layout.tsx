'use client';

import { PortalShell } from '@/components/portal/shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="student">{children}</PortalShell>;
}