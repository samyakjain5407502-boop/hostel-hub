'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useLang, type TKey } from '@/i18n';
import { cn } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FAQ: [TKey, TKey][] = [
  ['landing.faq.q1', 'landing.faq.a1'],
  ['landing.faq.q2', 'landing.faq.a2'],
  ['landing.faq.q3', 'landing.faq.a3'],
  ['landing.faq.q4', 'landing.faq.a4'],
  ['landing.faq.q5', 'landing.faq.a5']
];

/**
 * FAQ accordion.
 * Custom rather than Radix because the libraries in this project don't ship an
 * accordion: a real `<button aria-expanded>` per row, `role="region"` panels and
 * a height animation that is skipped entirely when the user prefers reduced
 * motion.
 */
export function Faq() {
  const { t } = useLang();
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState<number>(0);

  const duration = reduced ? 0 : 0.3;

  return (
    /* `id="faq"` is the anchor target for the navbar / footer "Help & FAQs"
       links — `scroll-mt-24` keeps the first question clear of the sticky
       glass header when the browser jumps here. */
    <section id="faq" className="scroll-mt-24 bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-5 py-20 sm:px-6 sm:py-24">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {t('landing.faq.title')}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">{t('landing.faq.sub')}</p>
        </header>

        <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-panel">
          {FAQ.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <h3>
                  <button
                    type="button"
                    id={`faq-trigger-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="tap-safe flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-50 sm:px-6"
                  >
                    <span className="text-sm font-bold text-slate-900 sm:text-base">{t(q)}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300',
                        isOpen && 'rotate-180 text-brand-600'
                      )}
                    />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">{t(a)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
