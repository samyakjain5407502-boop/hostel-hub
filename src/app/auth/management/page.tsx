'use client';

/**
 * Management Desk portal login (4-tier architecture → /auth/management).
 * Demo credentials: Desk key `DESK-2026` · ID `MGT-3001` · passkey `776611`.
 * The desk handles admissions, bed allotment and fee invoicing.
 */

import { KeyRound, BadgeCheck, Fingerprint, ShieldAlert, Building2 } from 'lucide-react';
import * as React from 'react';
import { AuthShell, Spin } from '@/components/auth/shell';
import { Field } from '@/components/auth/field';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { DEMO_MANAGER, demoManagerUser } from '@/lib/auth';
import { clientLogin } from '@/lib/client-session';
import { useToast } from '@/components/ui/toast';
import { inputBase } from '@/components/ui/field';

export default function ManagementAuthPage() {
  const { t } = useLang();
  const toast = useToast();
  const [key, setKey] = React.useState(DEMO_MANAGER.key);
  const [deskId, setDeskId] = React.useState(DEMO_MANAGER.id);
  const [passkey, setPasskey] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(demo = false) {
    setBusy(true);
    try {
      if (demo) {
        await clientLogin(demoManagerUser());
        window.location.href = '/management';
        return;
      }
      const okKey = key.trim().toUpperCase() === DEMO_MANAGER.key;
      const okId = deskId.trim().toUpperCase() === DEMO_MANAGER.id;
      const okPass = passkey.trim() === DEMO_MANAGER.passkey;
      if (!okKey || !okId) throw new Error('bad');
      if (!okPass) {
        toast.push({
          title: 'Passkey challenge',
          body: `Enter ${DEMO_MANAGER.passkey} to approve (demo 2FA).`,
          tone: 'info'
        });
        return;
      }
      await clientLogin(demoManagerUser());
      window.location.href = '/management';
    } catch {
      toast.push({ title: t('auth.error.invalid'), tone: 'warning' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      config={{
        role: 'management',
        title: t('auth.management.title'),
        sub: t('auth.management.sub'),
        accentRing: 'from-violet-500 to-fuchsia-600',
        icon: <Building2 className="h-10 w-10 text-white" aria-hidden="true" />
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> {t('auth.management.badge')}
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">{t('auth.management.title')}</h1>
        <p className="mt-1 text-sm text-slate-600">{t('auth.management.sub')}</p>

        <div className="mt-5 space-y-4">
          <Field icon={KeyRound} label={t('auth.management.key')} hint={`Demo: ${DEMO_MANAGER.key}`}>
            <input
              className={inputBase}
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="DESK-XXXX"
              aria-label={t('auth.management.key')}
            />
          </Field>
          <Field icon={BadgeCheck} label={t('auth.management.id')} hint={`Demo: ${DEMO_MANAGER.id}`}>
            <input
              className={inputBase}
              required
              value={deskId}
              onChange={(e) => setDeskId(e.target.value)}
              placeholder="MGT-XXXX"
              aria-label={t('auth.management.id')}
            />
          </Field>
          <Field icon={Fingerprint} label={`${t('auth.management.passkey')} • 6 digits`} hint={`Multi-factor challenge · Demo: ${DEMO_MANAGER.passkey}`}>
            <input
              className={inputBase}
              required
              inputMode="numeric"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="••••••"
              aria-label={t('auth.management.passkey')}
            />
          </Field>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
            Desk accounts are issued by the Super-Admin command centre.
          </div>
        </div>

        <Button type="submit" variant="dark" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? <Spin /> : null} {busy ? 'Authenticating…' : t('auth.management.secure')}
        </Button>
        <Button type="button" variant="warden" size="lg" className="mt-2.5 w-full" onClick={() => void submit(true)}>
          ✨ {t('auth.management.demo')}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-500">
          <ShieldAlert className="inline h-3.5 w-3.5" aria-hidden="true" /> Desk Key + Passkey (2FA). {t('app.institute')}
        </p>
      </form>
    </AuthShell>
  );
}
