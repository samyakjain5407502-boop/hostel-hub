'use client';

import { useLang } from '@/i18n';

export function FinalCta() {
  const { t } = useLang();
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 text-center">
      <h2 className="text-3xl font-extrabold text-slate-900">{t('landing.cta.title')}</h2>
      <p className="mt-2 text-slate-500">{t('landing.cta.sub')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/auth/student" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-700">
          {t('nav.studentPortal')} →
        </a>
        <a href="/auth" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700">
          {t('landing.hero.allPortals')}
        </a>
      </div>
    </section>
  );
}