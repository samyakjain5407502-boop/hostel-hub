'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { en } from './en';
import { hi } from './hi';
import { hinglish } from './hinglish';

export type Lang = 'en' | 'hi' | 'hinglish';

export const LANGS: Lang[] = ['en', 'hi', 'hinglish'];

export const LANG_LABELS: Record<Lang, { label: string; native: string; flag: string; htmlLang: string }> = {
  en: { label: 'English', native: 'English', flag: '🇬🇧', htmlLang: 'en' },
  hi: { label: 'Hindi', native: 'हिंदी', flag: '🇮🇳', htmlLang: 'hi' },
  hinglish: { label: 'Hinglish', native: 'Hinglish', flag: '🇮🇳', htmlLang: 'en-IN' }
};

/**
 * One dictionary file per locale. Each locale used to be split into six modules
 * (en.ts ... en6.ts) and spread together here; those parts are now consolidated
 * into a single file per locale.
 * English defines the canonical key set — `Dict` forces every locale to
 * implement all of it, so a missing Hindi label fails the type-check.
 */
const enAll = en;
const hiAll = hi;
const hinglishAll = hinglish;

export type TKey = keyof typeof enAll;
export type Dict = Record<TKey, string>;
export type TVars = Record<string, string | number>;

const ENTRIES: Record<Lang, Dict> = { en: enAll, hi: hiAll, hinglish: hinglishAll };

const STORAGE_KEY = 'hostelhub.locale';

export interface LangCtx {
  lang: Lang;
  setLang: (lang: Lang, persist?: boolean) => void;
  /** Translate a key, optionally interpolating `{placeholders}`. */
  t: (key: TKey, vars?: TVars) => string;
  /**
   * Translate *stored* strings (seed data, notifications, reward history).
   * Dictionary keys resolve to a localised label; anything else — e.g. a
   * complaint title typed by a student — passes through verbatim.
   */
  tr: (value: string | null | undefined, vars?: TVars) => string;
  /** Format a number using the active locale (Hindi groups with Indian digits). */
  n: (value: number) => string;
}

const Ctx = createContext<LangCtx | null>(null);

/** Replaces `{token}` placeholders; unknown tokens are left intact for debugging. */
function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Restore the saved locale after mount, then keep <html> in sync.
  useEffect(() => {
    let restored: Lang = 'en';
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (LANGS as string[]).includes(saved)) restored = saved as Lang;
    } catch {
      /* storage unavailable (private mode) — stay on English */
    }
    setLangState(restored);
    applyHtmlLang(restored);
  }, []);

  const setLang = useCallback((next: Lang, persist = true) => {
    setLangState(next);
    applyHtmlLang(next);
    if (!persist) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / privacy errors */
    }
  }, []);

  const t = useCallback(
    (key: TKey, vars?: TVars) => {
      const dict = ENTRIES[lang];
      let value = dict[key];
      if (value === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n] missing "${String(key)}" in locale "${lang}"`);
        }
        value = enAll[key];
      }
      return interpolate(value ?? String(key), vars);
    },
    [lang]
  );

  const n = useCallback((value: number) => new Intl.NumberFormat(LANG_LABELS[lang].htmlLang).format(value), [lang]);

  const tr = useCallback(
    (value: string | null | undefined, vars?: TVars) => {
      if (value === null || value === undefined) return '';
      const dict = ENTRIES[lang] as Record<string, string | undefined>;
      const hit = dict[value] ?? enAll[value as TKey];
      return interpolate(hit ?? value, vars);
    },
    [lang]
  );

  const ctx = useMemo<LangCtx>(() => ({ lang, setLang, t, tr, n }), [lang, setLang, t, tr, n]);

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

function applyHtmlLang(lang: Lang) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.setAttribute('lang', LANG_LABELS[lang].htmlLang);
  // All three locales read left-to-right; kept explicit so RTL can be added later.
  el.setAttribute('dir', 'ltr');
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used within <LanguageProvider>.');
  return ctx;
}

export { enAll as enDict, hiAll as hiDict, hinglishAll as hinglishDict };