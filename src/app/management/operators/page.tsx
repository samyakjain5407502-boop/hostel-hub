'use client';

/**
 * Management Desk → Operator onboarding (4-tier architecture → /management/operators).
 * Adds and manages mess & hostel staff members (in production this writes to the
 * operators table and emails credentials).
 */

import { motion } from 'framer-motion';
import { UserCog, Check, Clock3, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface OperatorRequest {
  id: string;
  name: string;
  college: string;
  requestedAt: number;
}

/** Demo queue — replace with the operators table when the backend lands. */
const SEED_REQUESTS: OperatorRequest[] = [
  { id: 'REQ-101', name: 'Ramesh Yadav', college: 'College of Engineering', requestedAt: Date.now() - 26 * 3600_000 },
  { id: 'REQ-102', name: 'Priya Kulkarni', college: 'Arts & Science College', requestedAt: Date.now() - 5 * 3600_000 }
];

export default function ManagementOperatorsPage() {
  const toast = useToast();
  const [requests, setRequests] = React.useState<OperatorRequest[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem('hostelhub.operator-requests.v1');
      setRequests(raw ? (JSON.parse(raw) as OperatorRequest[]) : SEED_REQUESTS);
    } catch {
      setRequests(SEED_REQUESTS);
    }
    setReady(true);
  }, []);

  function persist(next: OperatorRequest[]) {
    setRequests(next);
    try {
      window.localStorage.setItem('hostelhub.operator-requests.v1', JSON.stringify(next));
    } catch {
      /* quota errors are non-fatal in demo */
    }
  }

  function approve(id: string) {
    const found = requests.find((r) => r.id === id);
    persist(requests.filter((r) => r.id !== id));
    toast.push({
      title: `${found?.name ?? id} approved`,
      body: `Operator credentials issued for ${found?.college ?? 'the hostel'}.`,
      tone: 'success'
    });
  }

  function reject(id: string) {
    const found = requests.find((r) => r.id === id);
    persist(requests.filter((r) => r.id !== id));
    toast.push({ title: `${found?.name ?? id}'s request rejected`, tone: 'warning' });
  }

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <UserCog className="h-7 w-7 text-violet-600" aria-hidden="true" /> Operator Onboarding
        </h1>
        <p className="mt-1 text-slate-500">Review mess counter staff and issue operator credentials.</p>
      </motion.div>

      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader
          title="Pending requests"
          sub={ready ? `${requests.length} mess operator application(s)` : 'Loading…'}
          icon={<Clock3 className="h-5 w-5" />}
        />
        {ready && requests.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            No pending operator requests — all counter staff are onboarded.
          </p>
        )}
        <ul className="mt-4 w-full max-w-full space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="flex w-full max-w-full flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                <UserCog className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{r.name}</span>
                <span className="block text-[11px] text-slate-500">
                  {r.college} · requested {new Date(r.requestedAt).toLocaleDateString()}
                </span>
              </span>
              <Badge tone="sky">mess operator</Badge>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => approve(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
