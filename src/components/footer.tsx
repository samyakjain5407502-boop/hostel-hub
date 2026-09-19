'use client';

import { Mail, Phone, MapPin, ArrowUp } from 'lucide-react';
import * as React from 'react';
import { LogoMark } from '@/components/brand';
import { useLang } from '@/i18n';

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <LogoMark />
              <span className="font-display text-lg font-extrabold text-slate-900">Hostel<span className="text-brand-600">Hub</span></span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{t('app.tagline')}.</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">{t('footer.tagline2')}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('footer.contact')}</h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-500" aria-hidden="true" /> Samyakthora@gmail.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-500" aria-hidden="true" /> +91 9098088466</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-500" aria-hidden="true" /> {t('footer.campus')}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('footer.platform')}</h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
              <li><a href="/dashboard/mess" className="hover:text-brand-600">{t('footer.messPlanning')}</a></li>
              <li><a href="/dashboard/rewards" className="hover:text-brand-600">{t('footer.rewards')}</a></li>
              <li><a href="/dashboard/complaints" className="hover:text-brand-600">{t('footer.complaintCenter')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('footer.learning')}</h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-brand-600">{t('footer.docs')}</a></li>
              <li><a href="#" className="hover:text-brand-600">{t('footer.privacy')}</a></li>
              <li><a href="#" className="hover:text-brand-600">{t('footer.ecoGuide')}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-400">© 2026 HostelHub · {t('app.institute')}. {t('footer.rights')}</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> {t('footer.backToTop')}
          </button>
        </div>
      </div>
    </footer>
  );
}