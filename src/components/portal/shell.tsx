'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Topbar } from '@/components/portal/topbar';
import { Sidebar } from '@/components/portal/sidebar';
import { Footer } from '@/components/footer';
import { getClientSession } from '@/lib/client-session';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { Role } from '@/types';

export function PortalShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sessionName, setSessionName] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    getClientSession().then((s) => {
      if (s && s.role === role) setSessionName(s.user.name);
      else window.location.href = role === 'admin' ? '/auth/admin' : '/auth/student';
    });
  }, [role]);

  if (!sessionName) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh">
      <Topbar role={role} name={sessionName} onMenuClick={() => setMenuOpen(true)} />
      <div className="mx-auto flex max-w-7xl gap-2 px-4">
        <Sidebar role={role} pathname={pathname} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-h-[72dvh] w-full min-w-0 flex-1 py-6">
          <div key={pathname}>{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}