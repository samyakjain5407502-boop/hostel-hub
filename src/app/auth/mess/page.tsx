'use client';

/**
 * Mess Operator portal login (3-portal architecture → /auth/mess).
 * Demo credentials: Operator ID `OPS-2001` · Passkey `224488`.
 * Operator accounts are provisioned by the Super-Admin via
 * `/management/operators` onboarding.
 */

import { KeyRound, BadgeCheck, Fingerprint, ShieldAlert, ChefHat } from 'lucide-react';
import * as React from 'react';
import { AuthShell, Spin } from '@/components/auth/shell';
import { Field } from '@/components/auth/field';
import { Button } from '@/components/ui/button';
import { useLang } from '@/i18n';
import { DEMO_OPERATOR, demoOperatorUser } from '@/lib/auth';
import { clientLogin } from '@/lib/client-session';
import { useToast } from '@/components/ui/toast';
import { inputBase } from '@/components/ui/field';

export default function OperatorAuthPage() {
  const { t } = useLang();
  const toast = useToast();
  const [operatorId, setOperatorId] = React.useState('OPS-2001');
  const [passkey, setPasskey] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(demo = false) {
    setBusy(true);
    try {
      if (demo) {
        await clientLogin(demoOperatorUser());
        window.location.href = '/mess';
        return;
      }
      const okId = operatorId.trim().toUpperCase() === DEMO_OPERATOR.id;
      if (!okId) throw new Error('bad');
      if (passkey.trim() !== DEMO_OPERATOR.passkey) {
        toast.push({ title: 'Passkey challenge', body: 'Enter 224488 to approve (demo 2FA).', tone: 'info' });
        return;
      }
      await clientLogin(demoOperatorUser());
      window.location.href = '/mess';
    } catch {
      toast.push({ title: t('auth.error.invalid'), tone: 'warning' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      config={{
        role: 'operator',
        title: 'Mess Operator',
        sub: 'Counter console — live headcount, item availability and plate verification.',
        accentRing: 'from-emerald-500 to-teal-600',
        icon: <ChefHat className="h-10 w-10 text-white" aria-hidden="true" />
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="rounded-3xl border border-slate-300 bg-white p-6 shadow-soft"
      >
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Staff · Mess counter only
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Mess Operator Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in with the operator ID issued by your hostel management.</p>

        <div className="mt-5 space-y-4">
          <Field icon={BadgeCheck} label="Operator ID" hint="Demo: OPS-2001">
            <input className={inputBase} required value={operatorId} onChange={(e) => setOperatorId(e.target.value)} placeholder="OPS-XXXX" aria-label="Operator ID" />
          </Field>
          <Field icon={Fingerprint} label="Passkey (2FA)" hint="Multi-factor challenge · Demo: 224488">
            <input className={inputBase} required type="password" inputMode="numeric" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="••••••" aria-label="Passkey" />
          </Field>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            No operator account yet? Onboarding is approved by the Admin / Management portal.
          </div>
        </div>

        <Button type="submit" variant="dark" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? <Spin /> : null} {busy ? 'Authenticating…' : 'Open counter console'}
        </Button>
        <Button type="button" variant="warden" size="lg" className="mt-2.5 w-full" onClick={() => void submit(true)}>
          ✨ Use demo operator
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          <ShieldAlert className="inline h-3.5 w-3.5" aria-hidden="true" /> Operator ID + Passkey (2FA). {t('app.institute')}
        </p>
      </form>
    </AuthShell>
  );
}
