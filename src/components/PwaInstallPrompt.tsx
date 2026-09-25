'use client';

import { Download, X } from 'lucide-react';
import * as React from 'react';
import { useLang } from '@/i18n';

/**
 * PWA install banner (Phase 3).
 * ─────────────────────────────────────────────────────────────
 * Chrome / Edge / Samsung Internet fire `beforeinstallprompt` when the site is
 * installable. We capture it, then offer a single, dismissible bottom banner on
 * phones — a mess check-in that opens straight into the app is the whole point
 * of installing HostelHub, so the prompt is worded around that job rather than
 * around "installing an app".
 *
 * Behaviour:
 *   • only shown on small screens (≤767px) and never inside `standalone` mode;
 *   • a dismissal is remembered in `localStorage`, so we ask exactly once;
 *   • `appinstalled` (or a resolved prompt) hides it for good;
 *   • while it is on screen the toast stack is nudged up (see globals.css
 *     `.pwa-install-open`) so notifications never cover the button.
 */
const DISMISS_KEY = 'hostelhub.pwa.dismissed';
const MOBILE_QUERY = '(max-width: 767px)';

/** Chrome's install event is not in the TS DOM lib yet — model the bits we use. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    /* private mode / quota — the banner simply reappears next visit */
  }
}

export function PwaInstallPrompt() {
  const { t } = useLang();
  const deferred = React.useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    /* Already installed, or already dismissed on this device? Stay quiet. */
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      return;
    }
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    function onBeforeInstall(event: Event) {
      /* Keep Chrome's mini-infobar away — we show our own banner. */
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      setVisible(window.matchMedia(MOBILE_QUERY).matches);
    }
    function onInstalled() {
      deferred.current = null;
      setVisible(false);
      rememberDismissal();
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  /* Reserve the bottom edge while the banner is up. */
  React.useEffect(() => {
    document.body.classList.toggle('pwa-install-open', visible);
    return () => document.body.classList.remove('pwa-install-open');
  }, [visible]);

  function dismiss() {
    setVisible(false);
    deferred.current = null;
    rememberDismissal();
  }

  async function install() {
    const event = deferred.current;
    if (!event) {
      dismiss();
      return;
    }
    setBusy(true);
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      /* user closed the browser dialog — treat it as a dismissal */
    } finally {
      setBusy(false);
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t('pwa.install')}
      className="safe-bottom fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 px-3.5 pt-3 shadow-panel backdrop-blur-sm sm:px-4"
    >
      <div className="mx-auto flex w-full max-w-lg items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Download className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-slate-700 sm:text-xs">
          {t('pwa.install')}
        </p>
        <button
          type="button"
          onClick={() => void install()}
          disabled={busy}
          className="shrink-0 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-btn transition hover:shadow-btn-hover active:scale-[.98] disabled:opacity-50"
        >
          {t('pwa.installCta')}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('pwa.dismiss')}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
