'use client';

import { motion } from 'framer-motion';
import { Sparkles, PartyPopper } from 'lucide-react';
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useDb, PerkInline } from '@/lib/store';
import { useLang } from '@/i18n';
import { ConfettiBurst } from '@/components/confetti';
import { buzz, playChime } from '@/lib/celebration';

export function GiftModal({
  open, onOpenChange, studentName = 'you'
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentName?: string;
}) {
  const db = useDb();
  const { t } = useLang();
  const [result, setResult] = React.useState<{ perk: PerkInline; points: number } | null>(null);

  React.useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  async function scratch() {
    if (db.gifts.scratchLeft <= 0) return;
    const r = db.scratchGift();
    if (!r) return;
    // Small delay so the lid animation reads before the reveal.
    setResult(r);
    playChime();
    buzz();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxW="max-w-md" className="p-0 overflow-hidden">
        <div className="relative px-5 py-6 text-center">
          {result && <ConfettiBurst count={120} />}

          <div className="mx-auto mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </div>

          {!result ? (
            /* ------- sealed gift box ------- */
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">{t('rewards.openGift')}</DialogTitle>
              <p className="mt-1 text-sm text-slate-500">
                {db.gifts.scratchLeft} {t('rewards.giftsLeft').toLowerCase()}
              </p>

              <motion.div
                initial={{ scale: 0.85, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.94 }}
                className="mt-5 cursor-pointer select-none"
              >
                <button onClick={scratch} disabled={db.gifts.scratchLeft <= 0} className="group" aria-label="Open gift box">
                  <div className="relative animate-glow-pulse">
                    <div className="text-[5rem] leading-none">{db.gifts.scratchLeft > 0 ? '🎁' : '🗑️'}</div>
                    <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-amber-400 text-[11px] font-black text-white">!</span>
                  </div>
                </button>
              </motion.div>

              <p className="mt-3 text-xs font-medium text-slate-400">Tap the box to scratch &amp; reveal your reward</p>
            </div>
          ) : (
            /* ------- revealed reward ------- */
            <div>
              <span className="sr-only">Reward unlocked</span>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">✨ Reward Unlocked</p>
              <motion.div
                initial={{ y: 14, scale: 0.7, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="mt-2 text-[4.5rem] leading-none"
              >
                {result.perk.emoji}
              </motion.div>
              <h3 className="mt-1.5 text-xl font-extrabold text-slate-900">{result.perk.titleKey}</h3>
              <p className="mt-1 text-sm text-slate-500">{result.perk.descKey}</p>

              <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-sm font-bold text-success-700">
                <PartyPopper className="h-4 w-4" aria-hidden="true" /> +{result.points} {t('common.points')}
              </div>

              <p className="mt-2 text-xs text-slate-400">Congrats, {studentName}! Your gift is saved to your wallet.</p>
            </div>
          )}

          <div className="mt-5 flex justify-center gap-2">
            {result ? (
              <DialogClose className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-700">
                Awesome 🎉
              </DialogClose>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}