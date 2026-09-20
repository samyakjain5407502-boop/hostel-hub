'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { en } from './en';
import { en2 } from './en2';
import { en3 } from './en3';
import { en4 } from './en4';
import { en5 } from './en5';
import { en6 } from './en6';
import { hi } from './hi';
import { hi2 } from './hi2';
import { hi3 } from './hi3';
import { hi4 } from './hi4';
import { hi5 } from './hi5';
import { hi6 } from './hi6';
import { hinglish } from './hinglish';
import { hinglish2 } from './hinglish2';
import { hinglish3 } from './hinglish3';
import { hinglish4 } from './hinglish4';
import { hinglish5 } from './hinglish5';
import { hinglish6 } from './hinglish6';

export type Lang = 'en' | 'hi' | 'hinglish';

export const LANGS: Lang[] = ['en', 'hi', 'hinglish'];

export const LANG_LABELS: Record<Lang, { label: string; native: string; flag: string; htmlLang: string }> = {
  en: { label: 'English', native: 'English', flag: 'ðŸ‡¬ðŸ‡§', htmlLang: 'en' },
  hi: { label: 'Hindi', native: 'à¤¹à¤¿à¤‚à¤¦à¥€', flag: 'ðŸ‡®ðŸ‡³', htmlLang: 'hi' },
  hinglish: { label: 'Hinglish', native: 'Hinglish', flag: 'ðŸ‡®ðŸ‡³', htmlLang: 'en-IN' }
};

/**
 * Dictionaries are split per locale into a few modules purely to keep each
 * file reviewable; they are flattened here into the single source of truth.
 * English defines the canonical key set â€” `Dict` forces every locale to
 * implement all of it, so a missing Hindi label fails the type-check.
 */
const enAll = { ...en, ...en2, ...en3, ...en4, ...en5, ...en6 };
const hiAll = { ...hi, ...hi2, ...hi3, ...hi4, ...hi5, ...hi6 };
const hinglishAll = { ...hinglish, ...hinglish2, ...hinglish3, ...hinglish4, ...hinglish5, ...hinglish6 };

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
   * Dictionary keys resolve to a localised label; anything else â€” e.g. a
   * complaint title typed by a student â€” passes through verbatim.
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
      /* storage unavailable (private mode) â€” stay on English */
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