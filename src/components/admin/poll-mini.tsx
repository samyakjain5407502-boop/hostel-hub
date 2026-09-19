'use client';

import { Utensils } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { useDb } from '@/lib/store';

export function AdminPollMini() {
  const db = useDb();
  const total = db.poll.options.reduce((a, b) => a + b.votes, 0);
  return (
    <Card className="p-5">
      <CardHeader title="Poll results" sub="Weekend special voting" icon={<Utensils className="h-5 w-5" />} action={<a href="/admin/menu" className="text-xs font-semibold text-brand-600">Analytics →</a>} />
      <div className="mt-3 space-y-2">
        {db.poll.options.map((o) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          return (
            <div key={o.id} className="flex items-center gap-2 text-xs">
              <span className="basis-40 truncate text-slate-600">{o.emoji} {o.dish}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-11 text-right font-bold text-slate-600">{o.votes}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}