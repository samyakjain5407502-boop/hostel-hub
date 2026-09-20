'use client';

import { motion } from 'framer-motion';
import { BedDouble, Sparkles, UserPlus } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { playChime, buzz } from '@/lib/celebration';

/**
 * Walk-in admission desk — one screen, zero friction. A student shows up at
 * the warden's office, the desk types three fields, a bed is created and a
 * token booking is confirmed on the spot.
 */
export default function WalkInPage() {
  const db = useDb();
  const toast = useToast();
  const { t, n } = useLang();
  const [name, setName] = React.useState('');
  const [sid, setSid] = React.useState('');
  const [branch, setBranch] = React.useState('');
  const [room, setRoom] = React.useState('101');
  const [bed, setBed] = React.useState('1');
  const [fee, setFee] = React.useState('7200');
  const branchId = branch || db.branches[0]?.id || '';

  const recent = db.bookings.filter((b) => b.status === 'Confirmed').slice(0, 8);

  function admit() {
    if (!name.trim() || !sid.trim()) return;
    const created = db.onboardWalkIn({
      studentName: name.trim(), studentId: sid.trim(), branchId,
      roomNo: room.trim(), bedNo: Number(bed) || 1, monthlyFee: Number(fee) || 0
    });
    playChime(); buzz();
    toast.push({
      title: t('admissions.admitted', { name: name.trim(), room: room.trim(), bed: Number(bed) || 1 }),
      body: `${created.id} · ${t('walkin.bedCreated')}`,
      tone: 'success'
    });
    setName(''); setSid('');
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('walkin.title')}</h1>
        <p className="mt-1 text-slate-600">{t('walkin.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <CardHeader icon={<UserPlus className="h-5 w-5" />} title={t('admissions.walkIn')} sub={t('walkin.formSub')} action={<Badge tone="brand" dot>{t('mgmt.live')}</Badge>} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>{t('walkin.name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Mehta" />
            </div>
            <div>
              <Label>{t('walkin.id')}</Label>
              <Input value={sid} onChange={(e) => setSid(e.target.value)} placeholder="STU-24510" />
            </div>
            <div>
              <Label>{t('walkin.branch')}</Label>
              <select value={branchId} onChange={(e) => setBranch(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                {db.branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:col-span-2">
              <div><Label>{t('inventory.room')}</Label><Input value={room} onChange={(e) => setRoom(e.target.value)} /></div>
              <div><Label>{t('inventory.bed')}</Label><Input value={bed} onChange={(e) => setBed(e.target.value)} /></div>
              <div><Label>{t('walkin.fee')}</Label><Input value={fee} onChange={(e) => setFee(e.target.value)} /></div>
            </div>
            <div className="sm:col-span-2">
              <Button className="w-full" disabled={!name.trim() || !sid.trim()} onClick={admit}>
                <BedDouble className="h-4 w-4" aria-hidden="true" /> {t('admissions.admit')}
              </Button>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" /> {t('walkin.hint')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <CardHeader icon={<BedDouble className="h-5 w-5" />} title={t('walkin.recent')} sub={t('walkin.recentSub')} />
          <ul className="mt-4 space-y-2">
            {recent.map((bk) => (
              <li key={bk.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs">
                <span className="font-mono font-bold text-slate-800">{bk.id}</span>
                <span className="min-w-0 flex-1 truncate text-slate-600">{bk.bedId}</span>
                <span className="font-bold text-success-600">₹{n(bk.tokenAmount)}</span>
                <Badge tone="success" dot>{bk.status}</Badge>
              </li>
            ))}
            {recent.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">{t('walkin.none')}</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
