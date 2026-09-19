'use client';

import { PortalShell } from '@/components/portal/shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="admin">{children}</PortalShell>;
}