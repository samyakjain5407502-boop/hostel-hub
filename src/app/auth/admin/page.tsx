'use client';

import { KeyRound, BadgeCheck, Fingerprint, ShieldAlert, Landmark } from 'lucide-react';
import * as React from 'react';
import { AuthShell, Spin } from '@/components/auth/shell';
import { Field } from '@/components/auth/field';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { DEMO_ADMIN, demoAdminUser } from '@/lib/auth';
import { clientLogin } from '@/lib/client-session';
import { useToast } from '@/components/ui/toast';
import { inputBase } from '@/components/ui/field';

export default function AdminAuthPage() {
  const { t } = useLang();
  const toast = useToast();
  const [key, setKey] = React.useState('HUB-2026');
  const [faculty, setFaculty] = React.useState('FAC-1001');
  const [passkey, setPasskey] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(demo = false) {
    setBusy(true);
    try {
      if (demo) {
        await clientLogin(demoAdminUser());
        window.location.href = '/admin';
        return;
      }
      const okKey = key.trim().toUpperCase() === DEMO_ADMIN.key;
      const okFac = faculty.trim().toUpperCase() === DEMO_ADMIN.id;
      const okPass = passkey.trim() === DEMO_ADMIN.passkey;
      if (!okKey || !okFac) throw new Error('bad');
      if (!okPass) {
        toast.push({ title: 'Passkey challenge', body: 'Enter 447102 to approve (demo 2FA).', tone: 'info' });
        return;
      }
      await clientLogin(demoAdminUser());
      window.location.href = '/admin';
    } catch {
      toast.push({ title: t('auth.error.invalid'), tone: 'warning' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      config={{
        role: 'admin',
        title: t('auth.admin.title'),
        sub: t('auth.admin.sub'),
        accentRing: 'from-slate-800 to-slate-900',
        icon: <Landmark className="h-10 w-10 text-white" aria-hidden="true" />
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="rounded-3xl border border-slate-300 bg-white p-6 shadow-soft"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Restricted · Staff only
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">{t('auth.admin.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.admin.sub')}</p>

        <div className="mt-5 space-y-4">
          <Field icon={KeyRound} label={t('auth.admin.key')} hint="Demo: HUB-2026">
            <input className={inputBase} required value={key} onChange={(e) => setKey(e.target.value)} placeholder="HUB-XXXX" aria-label={t('auth.admin.key')} />
          </Field>
          <Field icon={BadgeCheck} label={t('auth.admin.facultyId')} hint="Demo: FAC-1001">
            <input className={inputBase} required value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="FAC-1001" aria-label={t('auth.admin.facultyId')} />
          </Field>
          <Field icon={Fingerprint} label={`${t('auth.admin.passkey')} • 6 digits`} hint="Multi-factor challenge · Demo: 447102">
            <input className={inputBase} required inputMode="numeric" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="••••••" aria-label={t('auth.admin.passkey')} />
          </Field>
        </div>

        <Button type="submit" variant="dark" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? <Spin /> : null} {busy ? 'Authenticating…' : t('auth.admin.secure')}
        </Button>
        <Button type="button" variant="warden" size="lg" className="mt-2.5 w-full" onClick={() => void submit(true)}>
          ✨ {t('auth.admin.demo')}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          <ShieldAlert className="inline h-3.5 w-3.5" aria-hidden="true" /> Admin Key + Passkey (2FA). {t('app.institute')}
        </p>
      </form>
    </AuthShell>
  );
}