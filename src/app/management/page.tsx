'use client';

import { motion } from 'framer-motion';
import { BedDouble, ClipboardList, Grid3x3, Receipt, TrendingUp, UserPlus, Users } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { StatTile } from '@/components/portal/stat';
import { Progress } from '@/components/ui/progress';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';

/**
 * Management desk overview — a single glance at the whole hostel desk:
 * what's waiting, what's empty, what's unpaid. Every tile links to the
 * surface where the operator can actually act on the number.
 */
export default function ManagementHome() {
  const db = useDb();
  const { t, n } = useLang();

  const pending = db.applications.filter((a) => a.status === 'Waiting for Admin Approval');
  const vacant = db.beds.filter((b) => b.status === 'Vacant').length;
  const unpaid = db.invoices.filter((i) => !i.paid);
  const occupancy = db.beds.length ? Math.round((db.beds.filter((b) => b.status === 'Booked').length / db.beds.length) * 100) : 0;
  const dues = unpaid.reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('mgmt.title')}</h1>
        <p className="mt-1 text-slate-600">{t('mgmt.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<ClipboardList className="h-4 w-4" />} label={t('mgmt.pending')} value={pending.length} sub={t('mgmt.pendingSub')} tone="amber" href="/management/admissions" />
        <StatTile icon={<BedDouble className="h-4 w-4" />} label={t('mgmt.vacant')} value={vacant} sub={t('mgmt.vacantSub')} tone="success" href="/management/inventory" />
        <StatTile icon={<Receipt className="h-4 w-4" />} label={t('mgmt.unpaid')} value={unpaid.length} sub={`₹${n(dues)} ${t('mgmt.dues')}`} tone="rose" href="/management/invoices" />
        <StatTile icon={<TrendingUp className="h-4 w-4" />} label={t('mgmt.occupancy')} value={`${occupancy}%`} sub={t('mgmt.occupancySub')} tone="brand" href="/management/inventory" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <CardHeader
            title={t('mgmt.queueTitle')}
            sub={t('mgmt.queueSub')}
            icon={<Users className="h-5 w-5" />}
            action={<a href="/management/admissions" className="text-xs font-semibold text-brand-600 hover:text-brand-700">{t('common.viewAll')} →</a>}
          />
          <ul className="mt-3 divide-y">
            {pending.slice(0, 5).map((app) => (
              <li key={app.id} className="flex items-center gap-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
                  {app.studentName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{app.studentName}</p>
                  <p className="font-mono text-[11px] text-slate-500">{app.studentId}</p>
                </div>
                <Badge tone={app.verified ? 'success' : 'amber'} dot>{app.verified ? t('admissions.verifiedYes') : t('admissions.verifiedNo')}</Badge>
              </li>
            ))}
            {pending.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">{t('mgmt.queueEmpty')}</li>
            )}
          </ul>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <CardHeader title={t('mgmt.duesTitle')} sub={t('mgmt.duesSub')} icon={<Receipt className="h-5 w-5" />} action={<Badge tone="rose" dot>{t('mgmt.live')}</Badge>} />
            <p className="mt-4 text-3xl font-black text-slate-900">₹{n(dues)}</p>
            <div className="mt-3">
              <Progress
                value={db.invoices.filter((i) => i.paid).length}
                max={db.invoices.length || 1}
                tone="success"
                label={t('invoices.paid')}
              />
            </div>
            <ul className="mt-4 space-y-2">
              {unpaid.slice(0, 3).map((inv) => (
                <li key={inv.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs">
                  <span className="font-mono font-bold text-slate-700">{inv.id}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-600">{inv.studentName}</span>
                  <span className="font-bold text-slate-900">₹{n(inv.total)}</span>
                </li>
              ))}
              {unpaid.length === 0 && <li className="text-xs text-slate-500">{t('mgmt.duesEmpty')}</li>}
            </ul>
          </Card>

          <Card className="p-5">
            <CardHeader title={t('mgmt.quick')} sub={t('mgmt.quickSub')} icon={<Grid3x3 className="h-5 w-5" />} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { href: '/management/admissions', icon: ClipboardList, label: t('nav.mgmtAdmissions') },
                { href: '/management/walkin', icon: UserPlus, label: t('nav.mgmtWalkin') },
                { href: '/management/inventory', icon: Grid3x3, label: t('nav.mgmtInventory') },
                { href: '/management/invoices', icon: Receipt, label: t('nav.mgmtInvoices') }
              ].map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft active:scale-[0.98]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-110">
                    <a.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold text-slate-800">{a.label}</span>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
