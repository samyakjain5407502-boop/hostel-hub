'use client';

import { GraduationCap, Mail, Lock, KeyRound, ShieldAlert, Smartphone } from 'lucide-react';
import * as React from 'react';
import { AuthShell, Spin } from '@/components/auth/shell';
import { Field } from '@/components/auth/field';
import { Button } from '@/components/ui/button';
import { inputBase } from '@/components/ui/field';
import { useLang } from '@/i18n';
import { DEMO_STUDENT, demoStudentUser } from '@/lib/auth';
import { clientLogin } from '@/lib/client-session';
import { useToast } from '@/components/ui/toast';

export default function StudentAuthPage() {
  const { t } = useLang();
  const toast = useToast();
    const [id, setId] = React.useState('STU-23045');
  const [pw, setPw] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [phase, setPhase] = React.useState<'idle' | 'sent'>('idle');
  const [busy, setBusy] = React.useState(false);

  async function submit(demo = false) {
    setBusy(true);
    try {
      if (demo) {
        await clientLogin(demoStudentUser());
        window.location.href = '/dashboard';
        return;
      }

      const cleanId = id.trim().toUpperCase();
      const cleanPw = pw.trim();
      const cleanMobile = mobile.trim().replace(/\D/g, '');

      if (!cleanId || !cleanPw) {
        toast.push({ title: 'Enter your Student ID and password', tone: 'warning' });
        return;
      }

      const okId = cleanId === DEMO_STUDENT.id;
      const okPw = cleanPw === DEMO_STUDENT.password;
      if (!okId || !okPw) {
        toast.push({ title: 'Invalid Student ID or password', tone: 'warning' });
        return;
      }

      if (phase === 'idle') {
        if (cleanMobile.length < 8) {
          toast.push({ title: 'Enter a valid mobile number', tone: 'warning' });
          return;
        }
        toast.push({ title: 'OTP sent', body: 'Enter 482913 to continue (demo).', tone: 'info' });
        setPhase('sent');
        return;
      }

      if (!otp.trim()) {
        toast.push({ title: 'Enter the OTP', body: 'The 6-digit code is 482913 (demo).', tone: 'warning' });
        return;
      }

      const okOtp = otp.trim() === DEMO_STUDENT.otp;
      if (!okOtp) {
        toast.push({ title: 'Wrong OTP', body: 'The 6-digit code is 482913 (demo).', tone: 'warning' });
        return;
      }
      await clientLogin(demoStudentUser());
      window.location.href = '/dashboard';
    } catch {
      toast.push({ title: t('auth.error.invalid'), tone: 'warning' });
    } finally {
      setBusy(false);
    }
  }


  return (
    <AuthShell
      config={{
        role: 'student',
        title: t('auth.student.title'),
        sub: t('auth.student.sub'),
        accentRing: 'from-brand-500 to-violet-600',
        icon: <GraduationCap className="h-10 w-10 text-white" aria-hidden="true" />
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
      >
        <h1 className="text-xl font-extrabold text-slate-900">{t('auth.student.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.student.sub')}</p>

                <div className="mt-5 space-y-4">
          <Field icon={Mail} label={t('auth.student.id')}>
            <AuthInput required value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. STU-23045" />
          </Field>
          <Field icon={Lock} label={t('auth.student.password')} hint="Demo: hostelhub">
            <AuthInput required type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="• • • • • • • •" />
          </Field>

                    {phase === 'idle' && (
            <Field icon={Smartphone} label={t('auth.student.mobile')} hint={t('auth.student.otpHint')}>
              <AuthInput
                required
                type="tel"
                inputMode="numeric"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g. 9826011223"
              />
            </Field>
          )}

          {phase === 'sent' && (
            <Field icon={KeyRound} label={`${t('auth.student.otp')} • 6 digits`} hint="6-digit code sent to your mobile">
              <AuthInput
                required
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="482913"
              />
            </Field>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? <Spin /> : null} {busy ? 'Checking…' : phase === 'sent' ? t('auth.student.signIn') : t('auth.student.sendOtp')}
        </Button>
        <Button type="button" variant="warden" size="lg" className="mt-2.5 w-full" onClick={() => void submit(true)}>
          ✨ {t('auth.student.demo')}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          <ShieldAlert className="inline h-3.5 w-3.5" aria-hidden="true" /> Protected by OTP + signed tokens. {t('app.institute')}
        </p>
      </form>
    </AuthShell>
  );
}

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputBase} {...props} />;
}