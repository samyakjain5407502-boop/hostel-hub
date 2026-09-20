import { PortalShell } from '@/components/portal/shell';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="management">{children}</PortalShell>;
}
