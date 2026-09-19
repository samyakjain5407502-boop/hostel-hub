'use client';

import { Plus, Search, LifeBuoy } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { ComplaintCard, STATUS_FLOW } from '@/components/complaints/card';
import { NewComplaint } from '@/components/complaints/new-complaint';

type Filter = 'All' | (typeof STATUS_FLOW)[number] | 'Closed';

export default function ComplaintsPage() {
  const db = useDb();
  const { t } = useLang();
  const [openNew, setOpenNew] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('All');

  const list = db.complaints.filter(
    (c) =>
      (filter === 'All' || c.status === filter) &&
      (!q || (c.title + ' ' + c.id + ' ' + c.category).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            <LifeBuoy className="h-7 w-7 text-brand-600" aria-hidden="true" /> {t('complaints.title')}
          </h1>
          <p className="mt-1 text-slate-500">Track every ticket from submitted to resolved.</p>
        </div>
        <Button variant="primary" onClick={() => setOpenNew(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" /> {t('complaints.new')}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder={t('common.search')} />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {(['All', ...STATUS_FLOW, 'Closed'] as Filter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn('rounded-xl border px-3 py-1.5 text-xs font-semibold transition', filter === s ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100')}
              aria-pressed={filter === s}
            >
              {s === 'All' ? t('common.viewAll') : s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {list.map((c) => <ComplaintCard key={c.id} id={c.id} />)}
        {list.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">{t('common.noData')}</p>}
      </div>

      <NewComplaint open={openNew} onOpenChange={setOpenNew} />
    </div>
  );
}