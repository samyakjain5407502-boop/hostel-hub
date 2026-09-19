'use client';

import { Gift, Leaf, Medal, Trophy } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatTile } from '@/components/portal/stat';
import { GiftModal } from '@/components/gift-modal';
import { useDb } from '@/lib/store';
import { PERK_LIST } from '@/lib/store-core';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn, timeAgo } from '@/lib/utils';

export default function RewardsPage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const [giftOpen, setGiftOpen] = React.useState(false);

  const eco = db.rewards.filter((r) => r.kind === 'eco' && r.points > 0).reduce((a, b) => a + b.points, 0);
  const disc = db.rewards.filter((r) => r.kind === 'discipline' && r.points > 0).reduce((a, b) => a + b.points, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('rewards.title')}</h1>
          <p className="mt-1 text-slate-500">{t('rewards.leaderboardBanner')}.</p>
        </div>
        <Button variant="warden" onClick={() => (!db.gifts.scratchLeft ? toast.push({ title: 'All out for the week', tone: 'warning' }) : setGiftOpen(true))}>
          <Gift className="h-4 w-4" aria-hidden="true" /> {t('rewards.openGift')}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile icon={<Leaf className="h-4 w-4" />} label={t('rewards.eco')} value={`${eco} ${t('common.points')}`} sub="Opt-out + ratings" tone="success" />
        <StatTile icon={<Medal className="h-4 w-4" />} label={t('rewards.discipline')} value={`${disc} ${t('common.points')}`} sub="Verified reports" tone="brand" />
        <StatTile icon={<Gift className="h-4 w-4" />} label="Gift Box" value={`${db.gifts.scratchLeft}`} sub={t('rewards.giftsLeft').toLowerCase()} tone="violet" />
      </div>

      <Card className="mt-6 p-5">
        <CardHeader title="Perk Store" sub="Spend credits or unlock via gifts" icon={<Gift className="h-5 w-5" />} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERK_LIST.map((perk) => {
            const rarityTone = perk.rarity === 'epic' ? 'violet' : perk.rarity === 'rare' ? 'brand' : 'slate';
            const locked = perk.costCredits > 0;
            return (
              <div key={perk.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl" aria-hidden="true">{perk.emoji}</span>
                  <Badge tone={rarityTone}>{perk.rarity.toUpperCase()}</Badge>
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-800">{perk.titleKey}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{perk.descKey}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  {locked ? <span className="text-[11px] font-semibold text-slate-400">{perk.costCredits} credits</span> : <Badge tone="success">Free perk</Badge>}
                  <button
                    onClick={() => { db.claimPerk(perk.id); toast.push({ title: `${perk.titleKey} claimed`, tone: 'success' }); }}
                    className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    {t('rewards.claim')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <CardHeader title={t('rewards.history')} sub="Your point activity" icon={<Trophy className="h-5 w-5" />} />
        <ul className="mt-3 divide-y">
          {db.rewards.slice(0, 8).map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className={cn('grid h-9 w-9 place-items-center rounded-xl', r.kind === 'eco' ? 'bg-success-50 text-success-600' : 'bg-brand-50 text-brand-600')}><Gift className="h-4.5 w-4.5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">{r.label}</p>
                <p className="text-[11px] text-slate-400">{r.meta} · {timeAgo(r.at)}</p>
              </div>
              <span className={cn('text-sm font-bold', r.points >= 0 ? 'text-success-600' : 'text-rose-600')}>{r.points >= 0 ? '+' : ''}{r.points}</span>
            </li>
          ))}
        </ul>
      </Card>

      <GiftModal open={giftOpen} onOpenChange={setGiftOpen} studentName="Aarav" />
    </div>
  );
}