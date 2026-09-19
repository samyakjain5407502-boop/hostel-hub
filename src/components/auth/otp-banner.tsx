'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock3, Copy, ShieldCheck, Smartphone } from 'lucide-react';
import * as React from 'react';
import { useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { OTP_TTL_MS } from '@/lib/otp';

/**
 * On-screen OTP banner.
 * ------------------------------------------------------------------
 * Mock mode has no SMS gateway, so the freshly generated code is surfaced
 * here (plus a toast) — the user types back exactly what was minted seconds
 * ago. In live mode this component is not rendered: the code only ever
 * exists on the server and inside the student's SMS inbox.
 */
export function OtpBanner({ code, mobile, secondsLeft, attemptsLeft }: {
  /** Freshly generated code — never a constant. */
  code: string;
  /** Already-masked mobile, e.g. `+91 ••••• 1223`. */
  mobile: string;
  secondsLeft: number;
  attemptsLeft: number;
}) {
  const { t } = useLang();
  const [copied, setCopied] = React.useState(false);
  const expired = secondsLeft <= 0;

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!code) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* Clipboard blocked (insecure context / permissions) — the code is on screen anyway. */
    }
  }

  const pct = Math.max(0, Math.min(100, (secondsLeft / (OTP_TTL_MS / 1000)) * 100));

  return (
    <AnimatePresence initial={false}>
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-full overflow-hidden rounded-2xl border border-brand-500/40 bg-slate-900 p-4 text-white shadow-soft"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> {t('auth.otp.mockBadge')}
          </span>
          <p className="min-w-0 truncate text-sm font-semibold">{t('auth.otp.generated')}</p>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{t('auth.otp.mockNote')}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <div className="flex gap-1.5" aria-label={t('auth.otp.generated')}>
            {code.split('').map((digit, i) => (
              <span
                key={`${digit}-${i}`}
                className="grid h-10 w-8 place-items-center rounded-xl bg-white/10 font-mono text-lg font-black text-white ring-1 ring-white/15 sm:h-11 sm:w-9 sm:text-xl"
              >
                {digit}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? t('auth.otp.copied') : t('auth.otp.copy')}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> {t('auth.otp.sentTo', { mobile })}
          </span>
          <span className={cn('inline-flex items-center gap-1.5 font-semibold', expired ? 'text-rose-300' : 'text-emerald-300')}>
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {expired ? t('auth.otp.expired') : t('auth.otp.expiresIn', { s: secondsLeft })}
          </span>
        </div>

        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', expired ? 'bg-rose-400' : 'bg-gradient-to-r from-brand-400 to-emerald-400')}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-2 text-[11px] text-slate-400">{t('auth.otp.attemptsLeft', { n: attemptsLeft })}</p>
      </motion.div>
    </AnimatePresence>
  );
}
