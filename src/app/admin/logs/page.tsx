'use client';

/**
 * Super-Admin → System Logs (3-portal architecture → /admin/logs).
 * Demo journal of portal-level events (logins, approvals, plate scans).
 * In production this would stream from your logging pipeline
 * (e.g. Supabase `audit_logs`, Vercel log drains, CloudWatch).
 */

import { motion } from 'framer-motion';
import { ScrollText, ShieldCheck, UserPlus, Building2, ScanLine } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollegeRegistry } from '@/lib/college-registry';

interface LogRow {
  id: string;
  at: number;
  kind: 'auth' | 'college' | 'operator' | 'scan';
  message: string;
}

export default function AdminLogsPage() {
  const { colleges, ready } = useCollegeRegistry();

  /** Demo rows — a read-only recent-activity feed, newest first. */
  const logs: LogRow[] = React.useMemo(() => {
    const rows: LogRow[] = [
      { id: 'l1', at: Date.now() - 12 * 60_000, kind: 'auth', message: 'Operator OPS-2001 signed in to the mess counter console' },
      { id: 'l2', at: Date.now() - 40 * 60_000, kind: 'scan', message: 'Plate HH-8241 verified at counter 2' },
      { id: 'l3', at: Date.now() - 2 * 3600_000, kind: 'auth', message: 'Student STU-23045 signed in via OTP (mock mode)' },
      { id: 'l4', at: Date.now() - 3 * 3600_000, kind: 'operator', message: 'Operator request submitted from Arts & Science College' },
      { id: 'l5', at: Date.now() - 5 * 3600_000, kind: 'auth', message: 'Admin FAC-1001 passed 2FA and opened the management portal' },
      { id: 'l6', at: Date.now() - 26 * 3600_000, kind: 'college', message: 'Directory sync: 5 colleges seeded as approved' }
    ];
    if (ready) {
      colleges
        .filter((c) => c.source === 'manual')
        .slice(0, 5)
        .forEach((c, i) => {
          rows.push({
            id: `college-${c.id}`,
            at: c.addedAt || Date.now() - (6 + i) * 3600_000,
            kind: 'college',
            message: `College "${c.name}" added manually by ${c.addedBy ?? 'a student'} (${c.status})`
          });
        });
    }
    return rows.sort((a, b) => b.at - a.at);
  }, [colleges, ready]);

  const KIND_META = {
    auth: { icon: ShieldCheck, label: 'auth', tone: 'sky' as const },
    college: { icon: Building2, label: 'college', tone: 'amber' as const },
    operator: { icon: UserPlus, label: 'operator', tone: 'violet' as const },
    scan: { icon: ScanLine, label: 'scan', tone: 'success' as const }
  };

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <ScrollText className="h-7 w-7 text-slate-700" aria-hidden="true" /> System Logs
        </h1>
        <p className="mt-1 text-slate-500">Recent activity across all three portals — sign-ins, approvals, scans.</p>
      </motion.div>

      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader title="Recent activity" sub={`${logs.length} event(s), newest first`} icon={<ScrollText className="h-5 w-5" />} />
        <ul className="mt-4 w-full max-w-full space-y-1.5">
          {logs.map((log) => {
            const meta = KIND_META[log.kind];
            const Icon = meta.icon;
            return (
              <li key={log.id} className="flex w-full max-w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{log.message}</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <span className="hidden shrink-0 text-[11px] text-slate-400 sm:block">{new Date(log.at).toLocaleString()}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
