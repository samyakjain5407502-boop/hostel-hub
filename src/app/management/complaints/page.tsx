/**
 * Management Desk → Complaint Triage (4-tier architecture → /management/complaints).
 * Warden/manager reviews student complaints, assigns staff and watches SLA timers.
 */
'use client';

import { Search, Users, CalendarClock, ArrowRight } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/field';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn, timeAgo, formatSla } from '@/lib/utils';
import { STATUS_TONE, statusKey } from '@/components/complaints/card';
import type { Complaint, ComplaintStatus } from '@/types';

const NEXT_STATUS: Record<ComplaintStatus, ComplaintStatus> = {
  Submitted: 'In Review',
  'In Review': 'Technician Assigned',
  'Technician Assigned': 'Resolved',
  Resolved: 'Closed',
  Closed: 'Closed'
};

const TECHS = ['R. Sharma (Electrician)', 'IT Cell — D. Bhatt', 'Housekeeping — Ganesh', 'Plumbing — S. Khan'];

export default function ManagementComplaints() {
  const db = useDb();
  const { t } = useLang();
  const [q, setQ] = React.useState('');

  const list = db.complaints.filter((c) => !q || (c.title + c.id + c.category + c.assignee).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
        <Users className="h-7 w-7 text-brand-600" aria-hidden="true" /> {t('nav.complaintsAdmin')}
      </h1>
      <p className="mt-1 text-slate-500">Assign staff, advance statuses and watch SLA timers.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder={t('common.search')} />
        </div>
        <Badge tone="rose" dot>{db.complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status)).length} open</Badge>
      </div>

      <Card className="mt-5 overflow-x-auto" padded={false}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2.5 pl-4 pr-3">Ticket</th>
              <th className="px-3">Status</th>
              <th className="px-3">Priority</th>
              <th className="px-3">Assignee</th>
              <th className="px-3">SLA</th>
              <th className="px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((c) => (
              <Row key={c.id} complaint={c} />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Row({ complaint: c }: { complaint: Complaint }) {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const closed = c.status === 'Closed' || c.status === 'Resolved';

  function advance() {
    const next = NEXT_STATUS[c.status];
    if (next === c.status || c.status === 'Closed') return;
    db.setComplaintStatus(c.id, next);
    toast.push({ title: `${c.id} → ${next}`, body: next === 'Resolved' ? `+20 discipline pts to ${c.author}` : undefined, tone: next === 'Resolved' ? 'reward' : 'info' });
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="py-3 pl-4 pr-3">
        <p className="font-semibold text-slate-800">{c.title}</p>
        <p className="text-[11px] text-slate-400">#{c.id} · {c.category} · {c.author} · {timeAgo(c.createdAt)}</p>
      </td>
      <td className="px-3"><Badge tone={STATUS_TONE[c.status]} dot>{t(statusKey(c.status) as never)}</Badge></td>
      <td className="px-3"><Badge tone={c.priority === 'Urgent' ? 'rose' : 'slate'}>{c.priority}</Badge></td>
      <td className="px-3">
        <select
          value={c.assignee ?? ''}
          onChange={(e) => { db.setComplaintStatus(c.id, c.status, e.target.value || null); toast.push({ title: `${c.id} assigned`, tone: 'info' }); }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
          aria-label={`Assign ${c.id}`}
        >
          <option value="">Unassigned</option>
          {TECHS.map((tech) => <option key={tech} value={tech} selected={c.assignee === tech}>{tech}</option>)}
        </select>
      </td>
      <td className="px-3">
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', closed ? 'text-slate-400' : 'text-amber-600')}>
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> {closed ? 'Cleared' : formatSla(c.slaSeconds ?? 0)}
        </span>
      </td>
      <td className="px-3 text-right">
        <button
          onClick={advance}
          disabled={c.status === 'Closed'}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {c.status === 'Closed' ? 'Closed' : NEXT_STATUS[c.status]}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}