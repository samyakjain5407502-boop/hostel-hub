'use client';
import { motion } from 'framer-motion';
import { BedDouble, Check, UserPlus, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useDb } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useLang } from '@/i18n';

export default function AdmissionsPage() {
  const db = useDb();
  const { t, tr } = useLang();
  const decided = db.applications.filter((a) => a.status !== 'Waiting for Admin Approval');
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('admissions.title')}</h1>
        <p className="mt-1 text-slate-500">{t('admissions.sub')}</p>
      </motion.div>
      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <WaitList />
        <div className="space-y-4 xl:col-span-2">
          <WalkInCard />
          <BookingsCard />
        </div>
      </div>
      {decided.length > 0 && (
        <ul className="mt-6 divide-y rounded-2xl border border-slate-200 bg-white">
          {decided.map((app) => (
            <li key={app.id} className="flex items-center gap-2 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{app.studentName}</span>
              <Badge tone={app.status === 'Approved' ? 'success' : 'rose'}>{tr('tag.' + app.status)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WaitList() {
  const db = useDb();
  const { t } = useLang();
  const toast = useToast();
  const [bedFor, setBedFor] = React.useState<Record<string, string>>({});
  const waiting = db.applications.filter((a) => a.status === 'Waiting for Admin Approval');
  return (
    <div className="space-y-4 xl:col-span-3">
      <h2 className="text-sm font-bold text-slate-700">{t('admissions.waiting')} ({waiting.length})</h2>
      {waiting.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">All clear.</p>
      )}
      {waiting.map((app) => {
        const branch = db.branches.find((b) => b.id === app.branchId);
        const vacant = db.beds.filter((b) => b.branchId === app.branchId && b.status === 'Vacant');
        const sel = bedFor[app.id] ?? '';
        return (
          <Card key={app.id}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">{app.studentName.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{app.studentName}</p>
                <p className="font-mono text-[11px] text-slate-400">{app.id} / {app.studentId}</p>
              </div>
              <Badge tone={app.verified ? 'success' : 'amber'} dot>{app.verified ? t('admissions.verifiedYes') : t('admissions.verifiedNo')}</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">{branch?.name}</p>
            <div className="mt-3">
              <Label>Assign bed</Label>
              <select value={sel} onChange={(e) => setBedFor((p) => ({ ...p, [app.id]: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500">
                <option value="">No bed</option>
                {vacant.map((b) => (
                  <option key={b.id} value={b.id}>Room {b.roomNo} Bed {b.bedNo} Rs{b.monthlyFee}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => { db.decideApplication(app.id, 'Approved', sel || null); toast.push({ title: t('admissions.approvedToast', { name: app.studentName }), tone: 'success' }); }}>
                <Check className="h-4 w-4" aria-hidden="true" /> {t('admissions.approve')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { db.decideApplication(app.id, 'Rejected', null); toast.push({ title: t('admissions.rejectedToast'), tone: 'warning' }); }}>
                <X className="h-4 w-4" aria-hidden="true" /> {t('admissions.reject')}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function WalkInCard() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const [name, setName] = React.useState('');
  const [sid, setSid] = React.useState('');
  const [branch, setBranch] = React.useState('');
  const [room, setRoom] = React.useState('101');
  const [bed, setBed] = React.useState('1');
  const [fee, setFee] = React.useState('7200');
  const branchId = branch || db.branches[0]?.id || '';
  return (
    <Card>
      <CardHeader icon={<UserPlus className="h-5 w-5" />} title={t('admissions.walkIn')} sub={t('admissions.walkInSub')} />
      <div className="mt-4 grid gap-3">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Mehta" /></div>
        <div><Label>ID</Label><Input value={sid} onChange={(e) => setSid(e.target.value)} placeholder="STU-24510" /></div>
        <div>
          <Label>Branch</Label>
          <select value={branchId} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500">
            {db.branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div><Label>Room</Label><Input value={room} onChange={(e) => setRoom(e.target.value)} /></div>
          <div><Label>Bed</Label><Input value={bed} onChange={(e) => setBed(e.target.value)} /></div>
          <div><Label>Fee</Label><Input value={fee} onChange={(e) => setFee(e.target.value)} /></div>
        </div>
        <Button disabled={!name.trim() || !sid.trim()} onClick={() => { db.onboardWalkIn({ studentName: name.trim(), studentId: sid.trim(), branchId, roomNo: room.trim(), bedNo: Number(bed) || 1, monthlyFee: Number(fee) || 0 }); toast.push({ title: t('admissions.admitted', { name: name.trim(), room: room.trim(), bed: Number(bed) || 1 }), tone: 'success' }); setName(''); setSid(''); }}>
          <BedDouble className="h-4 w-4" aria-hidden="true" /> {t('admissions.admit')}
        </Button>
      </div>
    </Card>
  );
}

function BookingsCard() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  return (
    <Card>
      <CardHeader icon={<BedDouble className="h-5 w-5" />} title={t('admissions.bookings')} />
      <ul className="mt-3 space-y-2">
        {db.bookings.slice(0, 6).map((bk) => (
          <li key={bk.id} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-xs', bk.status === 'Held' ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50/60')}>
            <span className="font-mono font-bold text-slate-700">{bk.id}</span>
            <span className="min-w-0 flex-1 truncate text-slate-500">{bk.bedId}</span>
            <Badge tone={bk.status === 'Held' ? 'amber' : bk.status === 'Confirmed' ? 'success' : 'rose'}>{bk.status}</Badge>
            {bk.status === 'Held' && (
              <button onClick={() => { db.confirmArrival(bk.id); toast.push({ title: t('admissions.arrivalDone'), tone: 'success' }); }} className="rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-brand-700">
                {t('admissions.confirmArrival')}
              </button>
            )}
          </li>
        ))}
        {db.bookings.length === 0 && <li className="text-xs text-slate-400">None.</li>}
      </ul>
    </Card>
  );
}