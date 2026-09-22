'use client';

/**
 * Management Desk → Gate Pass verification (4-tier architecture → /management/gatepass).
 * Wardens check student entries/exits and approve or decline exit requests.
 */

import { motion } from 'framer-motion';
import { Users, QrCode, Clock, CheckCircle, X } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDb } from '@/lib/store';
import { useLang, type LangCtx } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { PassCode } from '@/components/gatepass/pass-code';
import { cn, timeAgo } from '@/lib/utils';
import type { GatePass } from '@/types';

export default function ManagementGatePassPage() {
  const db = useDb();
  const { t, tr, n } = useLang();
  const toast = useToast();
  const [filter, setFilter] = React.useState<'all' | 'active'>('active');

  const passes = filter === 'active'
    ? db.gatepasses.filter((g) => g.status !== 'Returned' && g.status !== 'Rejected')
    : db.gatepasses;

  const outNow = passes.filter((g) => g.status === 'Out').length;
  const pending = passes.filter((g) => g.status === 'Requested').length;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('gate.title')}</h1>
        <p className="mt-1 text-slate-500">{t('gate.adminSub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <CardHeader title={t('gate.live')} icon={<Users className="h-5 w-5" />} />
          <p className="mt-1 text-3xl font-black text-rose-700">{outNow}</p>
          <p className="text-xs text-slate-400">students currently out</p>
        </Card>
        <Card className="p-4">
          <CardHeader title="Pending approval" icon={<Clock className="h-5 w-5" />} />
          <p className="mt-1 text-3xl font-black text-slate-900">{pending}</p>
          <p className="text-xs text-slate-400">awaiting warden decision</p>
        </Card>
        <Card className="p-4">
          <CardHeader title="Scanner ready" icon={<QrCode className="h-5 w-5" />} />
          <p className="mt-1 text-3xl font-black text-slate-900">{passes.length}</p>
          <p className="text-xs text-slate-400">total active passes</p>
        </Card>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="text-sm text-slate-500">Show:</span>
        <Badge tone={filter === 'active' ? 'brand' : 'slate'} dot onClick={() => setFilter('active')} className="cursor-pointer">Active</Badge>
        <Badge tone={filter === 'all' ? 'brand' : 'slate'} dot onClick={() => setFilter('all')} className="cursor-pointer">All</Badge>
      </div>

      <Card className="mt-4 p-5">
        <CardHeader title="All gate passes" sub="Approve requests, track who is out, pull everyone back in" icon={<QrCode className="h-5 w-5" />} />
        {passes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No passes to show.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {passes.map((g) => <AdminPassRow key={g.id} pass={g} t={t} tr={tr} n={n} />)}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AdminPassRow({
  pass, t, tr, n
}: {
  pass: GatePass;
  t: LangCtx['t'];
  /** Resolves the i18n keys stored on the pass (status + reason) to labels. */
  tr: LangCtx['tr'];
  n: (v: number) => string;
}) {
  const db = useDb();
  const toast = useToast();
  const statusKey = `gate.status.${pass.status}`;
  /* The pass stores an expected-return timestamp rather than an hour count, so
     the return window is derived from the two stamps that are on the record. */
  const hours = Math.round((pass.expectedReturn - pass.outAt) / 3_600_000);
  const Tone = (() => {
    switch (pass.status) {
      case 'Approved': case 'Out': return 'rose';
      case 'Returned': return 'success';
      case 'Requested': return 'amber';
      case 'Rejected': return 'rose';
      default: return 'slate';
    }
  })();

  return (
    <li className="flex flex-wrap items-start gap-3 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-800">{pass.studentName}</span>
          <Badge tone={Tone}>{tr(statusKey)}</Badge>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {pass.destination} · {tr(pass.reason)} · {hours}hr return window · requested {timeAgo(pass.outAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {pass.status === 'Requested' && (
          <>
            <Button size="sm" variant="success" onClick={() => {
              db.setGatePassStatus(pass.id, 'Approved');
              toast.push({ title: `${pass.studentName} approved`, tone: 'success' });
            }}>{t('gate.approve')}</Button>
            <Button size="sm" variant="danger" onClick={() => {
              db.setGatePassStatus(pass.id, 'Rejected');
              toast.push({ title: `${pass.studentName} — request rejected`, tone: 'warning' });
            }}>{t('gate.reject')}</Button>
          </>
        )}
        {(pass.status === 'Approved' || pass.status === 'Out') && (
          <Button size="sm" variant="outline" onClick={() => {
            db.setGatePassStatus(pass.id, 'Out');
            toast.push({ title: `${pass.studentName} — checked out`, tone: 'info' });
          }}>{t('gate.markOut')}</Button>
        )}
        {pass.status === 'Out' && (
          <Button size="sm" variant="primary" onClick={() => {
            db.setGatePassStatus(pass.id, 'Returned');
            toast.push({ title: `${pass.studentName} — checked back in`, tone: 'success' });
          }}>{t('gate.markReturned')}</Button>
        )}
        {pass.status !== 'Rejected' && <PassCode code={pass.code} />}
      </div>
    </li>
  );
}
