'use client';

import { motion } from 'framer-motion';
import {
  BedDouble,
  Languages,
  Leaf,
  QrCode,
  Trophy,
  Wrench,
  type LucideIcon
} from 'lucide-react';
import { useLang, type TKey } from '@/i18n';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type ArtKind = 'bars' | 'ring' | 'beds' | 'locale' | 'sla' | 'qr';

const CARDS: { icon: LucideIcon; titleKey: TKey; descKey: TKey; span: string; art: ArtKind; wide?: boolean }[] = [
  { icon: Leaf, titleKey: 'landing.bento.b1t', descKey: 'landing.bento.b1d', span: 'lg:col-span-2', art: 'bars' },
  { icon: Trophy, titleKey: 'landing.bento.b2t', descKey: 'landing.bento.b2d', span: 'lg:col-span-1', art: 'ring' },
  { icon: BedDouble, titleKey: 'landing.bento.b3t', descKey: 'landing.bento.b3d', span: 'lg:col-span-1', art: 'beds' },
  { icon: Languages, titleKey: 'landing.bento.b4t', descKey: 'landing.bento.b4d', span: 'lg:col-span-1', art: 'locale' },
  { icon: Wrench, titleKey: 'landing.bento.b5t', descKey: 'landing.bento.b5d', span: 'lg:col-span-1', art: 'sla' },
  { icon: QrCode, titleKey: 'landing.bento.b6t', descKey: 'landing.bento.b6d', span: 'lg:col-span-3', art: 'qr', wide: true }
];

/**
 * Capability bento.
 * Six engineered promises laid out 2-1 / 1-1-1 / full-bleed, each with a small
 * hand-built visual (bars, ring, bed matrix, locale chips, SLA rail, code block)
 * so the grid carries information density without a single stock illustration.
 * Nothing here is decorative noise: every glyph is `aria-hidden` and the copy
 * is translatable.
 */
export function Capabilities() {
  const { t } = useLang();

  return (
    <section id="features" className="scroll-mt-24 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 sm:py-24">
        <header className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
            {t('landing.nav.features')}
          </p>
          <h2 className="mt-3 text-balance font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{t('landing.bento.sub')}</p>
        </header>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {CARDS.map(({ icon: Icon, titleKey, descKey, span, art, wide }, i) => (
            <motion.article
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
              whileHover={{ y: -5 }}
              className={cn(
                'group flex flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-panel-hover',
                wide && 'sm:col-span-2 lg:flex-row lg:items-center lg:gap-8',
                span
              )}
            >
              <div className={cn('flex min-w-0 flex-col', wide && 'lg:max-w-xl')}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-300 group-hover:-rotate-6">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-base font-extrabold tracking-tight text-slate-900">
                  {t(titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(descKey)}</p>
              </div>

              <Art kind={art} wide={wide} />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export { Capabilities as Features };

/** Micro-visuals — hand-built, decorative, and deliberately tiny. */
function Art({ kind, wide }: { kind: ArtKind; wide?: boolean }) {
  const wrap = cn('mt-6 shrink-0', wide && 'lg:mt-0 lg:ml-auto lg:w-52');

  if (kind === 'bars') {
    return (
      <div aria-hidden="true" className={cn(wrap, 'flex h-16 items-end gap-1.5')}>
        {[38, 52, 46, 68, 60, 84, 96].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={cn(
              'flex-1 rounded-t-md transition-colors duration-300',
              i === 6 ? 'bg-gradient-to-t from-violet-600 to-brand-400' : 'bg-brand-500/25 group-hover:bg-brand-500/40'
            )}
          />
        ))}
      </div>
    );
  }

  if (kind === 'ring') {
    return (
      <div aria-hidden="true" className={cn(wrap, 'flex items-center gap-3')}>
        <span
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
          style={{ background: 'conic-gradient(#6366f1 0% 72%, rgba(148,163,184,0.35) 72% 100%)' }}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white font-display text-xs font-black text-slate-900">
            72%
          </span>
        </span>
        <span className="flex flex-col gap-1.5">
          {[70, 46, 30].map((w, i) => (
            <span key={i} style={{ width: `${w}px` }} className="h-2 rounded-full bg-slate-200" />
          ))}
        </span>
      </div>
    );
  }

  if (kind === 'beds') {
    return (
      <div aria-hidden="true" className={cn(wrap, 'grid w-fit grid-cols-4 gap-1.5')}>
        {[1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0].map((filled, i) => (
          <span
            key={i}
            className={cn('h-5 w-5 rounded-md', filled ? 'bg-brand-500/70' : 'border border-slate-200 bg-slate-50')}
          />
        ))}
      </div>
    );
  }

  if (kind === 'locale') {
    return (
      <div aria-hidden="true" className={cn(wrap, 'flex flex-wrap items-center gap-1.5')}>
        {['EN', 'हिं', 'HI'].map((code, i) => (
          <span
            key={code}
            className={cn(
              'rounded-lg px-2 py-1 text-[11px] font-bold',
              i === 0 ? 'bg-brand-600 text-white shadow-btn' : 'border border-slate-200 bg-white text-slate-600'
            )}
          >
            {code}
          </span>
        ))}
      </div>
    );
  }

  if (kind === 'sla') {
    return (
      <div aria-hidden="true" className={cn(wrap, 'flex items-center gap-1.5')}>
        {[0, 1, 2, 3].map((step) => (
          <span key={step} className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                step < 2 ? 'bg-success-500' : step === 2 ? 'bg-brand-500' : 'bg-slate-200'
              )}
            />
            {step < 3 && <span className="h-px w-6 bg-slate-200" />}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn(wrap, 'rounded-2xl border border-slate-200 bg-slate-50 p-2.5')}>
      <div className="grid grid-cols-7 gap-1">
        {[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1].map((filled, i) => (
          <span key={i} className={cn('h-2.5 w-2.5 rounded-[3px]', filled ? 'bg-slate-600' : 'bg-transparent')} />
        ))}
      </div>
    </div>
  );
}
