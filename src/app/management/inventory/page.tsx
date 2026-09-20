'use client';

import { motion } from 'framer-motion';
import { BedDouble, Grid3x3, Lock, LockOpen, Users } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatTile } from '@/components/portal/stat';
import { useDb } from '@/lib/store';
import { useLang, type TKey } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { BedStatus, RoomBed } from '@/types';

/* Status → colour recipes live outside the component so the render tree stays
   about layout rather than long ternaries. */
const STATUS_TONE: Record<BedStatus, BadgeTone> = {
  Vacant: 'white',
  Locked: 'amber',
  Booked: 'brand'
};

const STATUS_CELL: Record<BedStatus, string> = {
  Vacant: 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:bg-brand-50',
  Locked: 'border-amber-300 bg-amber-50 text-amber-700',
  Booked: 'border-brand-300 bg-brand-100 text-brand-800'
};

interface RoomGroup {
  key: string;
  roomNo: string;
  branchId: string;
  config: string;
  beds: RoomBed[];
}

export default function InventoryPage() {
  const db = useDb();
  const toast = useToast();
  const { t, n } = useLang();
  const [branchId, setBranchId] = React.useState<string>('all');

  const visible = React.useMemo(
    () => (branchId === 'all' ? db.beds : db.beds.filter((b) => b.branchId === branchId)),
    [db.beds, branchId]
  );

  /* Rooms are the visual unit; the beds inside a room sit side by side. */
  const rooms = React.useMemo(() => groupByRoom(visible), [visible]);

  const total = visible.length;
  const booked = visible.filter((b) => b.status === 'Booked').length;
  const locked = visible.filter((b) => b.status === 'Locked').length;
  const vacant = visible.filter((b) => b.status === 'Vacant').length;
  const occupancy = total ? Math.round((booked / total) * 100) : 0;

  /** Lock / release a bed — a Locked bed is one held for a token booking. */
  function setStatus(bed: RoomBed, next: BedStatus) {
    const updated = db.setBedStatus(bed.id, next);
    if (!updated) return;
    toast.push({
      title: next === 'Locked' ? t('inventory.lockedBed') : t('inventory.releasedBed'),
      body: `${t('inventory.room')} ${bed.roomNo} · ${t('inventory.bed')} ${bed.bedNo}`,
      tone: next === 'Locked' ? 'info' : 'success'
    });
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('inventory.title')}</h1>
        <p className="mt-1 text-slate-500">{t('inventory.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<Grid3x3 className="h-4 w-4" />} label={t('inventory.occupancy')} value={`${occupancy}%`} sub={`${booked} / ${total} ${t('inventory.beds')}`} tone="brand" />
        <StatTile icon={<Users className="h-4 w-4" />} label={t('inventory.Booked')} value={booked} sub={t('inventory.beds')} tone="violet" />
        <StatTile icon={<Lock className="h-4 w-4" />} label={t('inventory.Locked')} value={locked} sub={t('inventory.beds')} tone="amber" />
        <StatTile icon={<BedDouble className="h-4 w-4" />} label={t('inventory.Vacant')} value={vacant} sub={t('inventory.beds')} tone="success" />
      </div>

      {/* Branch switcher — one rail per property so a warden only sees their wing. */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setBranchId('all')}
          aria-pressed={branchId === 'all'}
          className={cn(
            'shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
            branchId === 'all' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
          )}
        >
          {t('market.all')}
        </button>
        {db.branches.map((b) => (
          <button
            key={b.id}
            onClick={() => setBranchId(b.id)}
            aria-pressed={branchId === b.id}
            className={cn(
              'shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition',
              branchId === b.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            {b.name}
          </button>
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader
          title={t('inventory.title')}
          sub={t('inventory.filterBranch')}
          icon={<Grid3x3 className="h-5 w-5" />}
          action={<Badge tone="success" dot>{t('common.live')}</Badge>}
        />

        <div className="mt-4">
          <Progress value={booked} max={total || 1} tone="brand" label={t('inventory.occupancy')} size="sm" />
        </div>

        <ul className="mt-5 space-y-3">
          {rooms.map((room) => (
            <li key={room.key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <BedDouble className="h-4 w-4 text-brand-500" aria-hidden="true" />
                  {t('inventory.room')} {room.roomNo}
                  <Badge tone="slate">{room.config}</Badge>
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {branchName(db.branches, room.branchId)} · ₹{n(room.beds[0]?.monthlyFee ?? 0)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {room.beds.map((bed) => (
                  <div key={bed.id} className={cn('rounded-xl border px-3 py-2.5 transition', STATUS_CELL[bed.status])}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">
                        {t('inventory.bed')} {bed.bedNo}
                      </span>
                      <Badge tone={STATUS_TONE[bed.status]} dot>
                        {t(`inventory.${bed.status}` as TKey)}
                      </Badge>
                    </div>

                    {bed.status !== 'Booked' && (
                      <button
                        onClick={() => setStatus(bed, bed.status === 'Locked' ? 'Vacant' : 'Locked')}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white"
                      >
                        {bed.status === 'Locked' ? (
                          <>
                            <LockOpen className="h-3 w-3" aria-hidden="true" /> {t('inventory.unlock')}
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" aria-hidden="true" /> {t('inventory.lock')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
/** Group beds into rooms, preserving the branch → room order from the store. */
function groupByRoom(beds: RoomBed[]): RoomGroup[] {
  const map = new Map<string, RoomGroup>();
  for (const bed of beds) {
    const key = `${bed.branchId}::${bed.roomNo}`;
    const existing = map.get(key);
    if (existing) existing.beds.push(bed);
    else map.set(key, { key, roomNo: bed.roomNo, branchId: bed.branchId, config: bed.config, beds: [bed] });
  }
  return [...map.values()].map((room) => ({ ...room, beds: [...room.beds].sort((a, b) => a.bedNo - b.bedNo) }));
}

function branchName(branches: { id: string; name: string }[], id: string): string {
  return branches.find((b) => b.id === id)?.name ?? id;
}