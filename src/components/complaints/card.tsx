'use client';

import { CalendarClock, ThumbsUp } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { cn, timeAgo, formatSla } from '@/lib/utils';
import type { Category, ComplaintStatus, Priority } from '@/types';

export const CATEGORIES: Category[] = ['Mess/Food Quality', 'Room Maintenance', 'Electrical', 'Plumbing', 'Hygiene/Cleaning', 'Wi-Fi'];
export const PRIORITIES: Priority[] = ['Urgent', 'Normal'];
export const STATUS_FLOW: ComplaintStatus[] = ['Submitted', 'In Review', 'Technician Assigned', 'Resolved'];

export const STATUS_TONE: Record<ComplaintStatus, 'sky' | 'amber' | 'brand' | 'success' | 'white'> = {
  Submitted: 'sky',
  'In Review': 'amber',
  'Technician Assigned': 'brand',
  Resolved: 'success',
  Closed: 'white'
};

export function statusKey(s: ComplaintStatus): string {
  return `complaints.status.${s}`;
}

export function ComplaintCard({ id }: { id: string }) {
  const db = useDb();
  const { t } = useLang();
  const c = db.complaints.find((x) => x.id === id);
  if (!c) return null;
  const closed = c.status === 'Closed' || c.status === 'Resolved';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[c.status]} dot>{t(statusKey(c.status) as never)}</Badge>
          <Badge tone={c.priority === 'Urgent' ? 'rose' : 'slate'}>{c.priority}</Badge>
          <Badge tone="white">{c.category}</Badge>
          <span className="text-[11px] text-slate-400">#{c.id}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> {timeAgo(c.updatedAt)}</span>
      </div>

      <h3 className="mt-2 text-base font-bold text-slate-800">{c.title}</h3>
      <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{c.description}</p>

      {c.photo && <img src={c.photo} alt="" className="mt-2 max-h-28 rounded-xl border border-slate-200 object-cover" />}
      {c.feedback && <p className="mt-2 rounded-lg bg-success-50 px-2.5 py-1.5 text-xs font-medium text-success-700">💬 {c.feedback}</p>}

      {!closed && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">{STATUS_FLOW.map((st) => <TimelineStep key={st} st={st} status={c.status} />)}</ul>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        {c.assignee && <span className="text-[11px] font-medium text-slate-500">👷 {c.assignee}</span>}
        <span className={cn('text-[11px] font-medium', closed ? 'text-slate-400' : 'text-amber-600')}>
          {t('complaints.sla')} {closed ? 'Cleared' : formatSla(c.slaSeconds ?? 0)}
        </span>
        <button onClick={() => db.upvoteComplaint(c.id)} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-brand-300">
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" /> {c.votes}
        </button>
      </div>
    </article>
  );
}

function TimelineStep({ st, status }: { st: ComplaintStatus; status: ComplaintStatus }) {
  const { t } = useLang();
  const flowIdx = Math.max(0, STATUS_FLOW.indexOf(status));
  const done = flowIdx >= STA_POS[st];
  return (
    <li className="flex items-center gap-1.5 text-[11px]">
      <span className={cn('grid h-4 w-4 place-items-center rounded-full border', done ? 'border-success-300 bg-success-100 text-[9px] text-success-700' : 'border-slate-300 bg-white')}>
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'text-success-600' : 'text-slate-400'}>{t(statusKey(st) as never)}</span>
    </li>
  );
}

const STA_POS: Record<ComplaintStatus, number> = { Submitted: 0, 'In Review': 1, 'Technician Assigned': 2, Resolved: 3, Closed: 3 };