'use client';

/**
 * Super-Admin → Colleges & Hostels (3-portal architecture → /admin/colleges).
 * Approves colleges that students added manually at sign-in and manages the
 * directory used by the student portal's "Select College" dropdown.
 */

import { motion } from 'framer-motion';
import { Building2, Check, Clock3, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCollegeRegistry } from '@/lib/college-registry';
import { useToast } from '@/components/ui/toast';

export default function AdminCollegesPage() {
  const { colleges, pending, approved, ready, approve, remove } = useCollegeRegistry();
  const toast = useToast();

  function onApprove(id: string, name: string) {
    approve(id);
    toast.push({ title: `${name} approved`, body: 'Students can now select it at sign-in.', tone: 'success' });
  }

  function onRemove(id: string, name: string) {
    remove(id);
    toast.push({ title: `${name} removed from the directory`, tone: 'warning' });
  }

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Building2 className="h-7 w-7 text-brand-600" aria-hidden="true" /> Colleges &amp; Hostels
        </h1>
        <p className="mt-1 text-slate-500">Approve manually added colleges and manage the sign-in directory.</p>
      </motion.div>

      {/* Approval queue */}
      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader
          title="Approval queue"
          sub={ready ? `${pending.length} college(s) added manually by students` : 'Loading…'}
          icon={<Clock3 className="h-5 w-5" />}
        />
        {ready && pending.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            Nothing waiting — every manually added college has been reviewed. 🎉
          </p>
        )}
        <ul className="mt-4 w-full max-w-full space-y-2">
          {pending.map((c) => (
            <li key={c.id} className="flex w-full max-w-full flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{c.name}</span>
                <span className="block text-[11px] text-slate-500">
                  Added by {c.addedBy ?? 'student'} · {new Date(c.addedAt).toLocaleString()}
                </span>
              </span>
              <Badge tone="amber">pending</Badge>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(c.id, c.name)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(c.id, c.name)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Approved directory */}
      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader title="Approved directory" sub={ready ? `${approved.length} colleges live at sign-in` : 'Loading…'} icon={<Check className="h-5 w-5" />} />
        <ul className="mt-4 grid w-full max-w-full gap-2 sm:grid-cols-2">
          {approved.map((c) => (
            <li key={c.id} className="flex w-full max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{c.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-slate-400">{c.id}</span>
              {c.source === 'manual' && <Badge tone="sky">manual</Badge>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
