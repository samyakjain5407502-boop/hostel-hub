'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Topbar } from '@/components/portal/topbar';
import { Sidebar } from '@/components/portal/sidebar';
import { Footer } from '@/components/footer';
import { getClientSession } from '@/lib/client-session';
import { PORTAL_AUTH } from '@/lib/portals';
import { SkeletonCard } from '@/components/ui/skeleton';
import type { Role } from '@/types';

export function PortalShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sessionName, setSessionName] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    getClientSession().then((s) => {
      if (s && s.role === role) setSessionName(s.user.name);
      else window.location.href = PORTAL_AUTH[role];
    });
  }, [role]);

  /* Any navigation closes the slide-over drawer (link taps inside it too). */
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* The full-screen drawer owns the screen — lock the page behind it. */
  React.useEffect(() => {
    document.body.classList.toggle('scroll-locked', menuOpen);
    return () => document.body.classList.remove('scroll-locked');
  }, [menuOpen]);

  if (!sessionName) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </main>
    );
  }

  return (
    /* `overflow-x-clip` (not `hidden`) keeps the sticky top bar working while
       still guaranteeing the shell can never scroll sideways. */
    <div className="min-h-dvh w-full max-w-full overflow-x-clip">
      <Topbar role={role} name={sessionName} onMenuClick={() => setMenuOpen(true)} />
      <div className="mx-auto flex w-full max-w-7xl items-start gap-3 px-4 sm:px-6">
        <Sidebar role={role} pathname={pathname} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main id="main" className="min-h-[72dvh] w-full min-w-0 flex-1 py-5 sm:py-6">
          <div key={pathname} className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}