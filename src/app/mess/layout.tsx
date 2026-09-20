import { PortalShell } from '@/components/portal/shell';

export default function MessOperatorLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="operator">{children}</PortalShell>;
}
