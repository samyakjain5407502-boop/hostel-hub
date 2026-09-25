'use client';

import { Building2, GraduationCap, Mail, Lock, KeyRound, RefreshCw, ShieldAlert, Smartphone } from 'lucide-react';
import * as React from 'react';
import { AuthShell, Spin } from '@/components/auth/shell';
import { Field } from '@/components/auth/field';
import { OtpBanner } from '@/components/auth/otp-banner';
import { CollegeSelect } from '@/components/auth/college-select';
import { Button } from '@/components/ui/button';
import { inputBase } from '@/components/ui/field';
import { useLang, type TKey } from '@/i18n';
import { DEMO_STUDENT, demoStudentUser } from '@/lib/auth';
import { clientLogin } from '@/lib/client-session';
import { addPendingCollege } from '@/lib/college-registry';
import type { College } from '@/types';
import { isMockMode } from '@/lib/data-mode';
import {
  attemptsLeft, createOtpChallenge, deliverOtp, isValidMobile, maskMobile, normalizeMobile,
  normalizeOtp, resendSecondsLeft, secondsLeft, verifyOtp, type OtpChallenge, type OtpStatus
} from '@/lib/otp';
import { useToast } from '@/components/ui/toast';

/** Friendly copy for every way a typed code can be rejected. */
const OTP_ERROR_KEY: Record<OtpStatus, TKey | null> = {
  ok: null,
  empty: 'auth.otp.needed',
  expired: 'auth.otp.expired',
  mismatch: 'auth.otp.wrong',
  locked: 'auth.otp.locked'
};

/**
 * Safe `?redirect=` target.
 * Deep links such as `/auth/student?redirect=/dashboard/rewards` (used by the
 * footer when an anonymous visitor clicks a student-only screen) are honoured
 * after a successful login — but only for `/dashboard*` paths, so the parameter
 * can never be turned into an open redirect.
 */
function safeRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('redirect');
  return raw && raw.startsWith('/dashboard') ? raw : null;
}

export default function StudentAuthPage() {
  const { t } = useLang();
  const toast = useToast();
    const [id, setId] = React.useState('STU-23045');
  const [pw, setPw] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  /** Selected college — required, travels with the login request. */
  const [college, setCollege] = React.useState<College | null>(null);
  const [collegeError, setCollegeError] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  /** The one live challenge for this session — it owns the freshly minted code. */
  const [challenge, setChallenge] = React.useState<OtpChallenge | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [busy, setBusy] = React.useState(false);
  /** Resolved after mount (never during SSR) so hydration stays deterministic. */
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);
  const otpRef = React.useRef<HTMLInputElement>(null);

  /* Deep link in the URL? Surface it and remember it for the post-login hop. */
  React.useEffect(() => {
    setRedirectTo(safeRedirect());
  }, []);

  const mockMode = isMockMode();
  const awaitingOtp = challenge !== null;
  const ttl = secondsLeft(challenge, now);
  const resendIn = resendSecondsLeft(challenge, now);
  const left = attemptsLeft(challenge);

  /* One shared 1-second ticker drives the expiry countdown and resend cooldown. */
  React.useEffect(() => {
    if (!awaitingOtp) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [awaitingOtp]);

  /* Drop the cursor straight into the OTP box once a code has been minted. */
  React.useEffect(() => {
    if (awaitingOtp) otpRef.current?.focus();
  }, [awaitingOtp]);

  /**
   * Mint a brand-new code, hand it to the delivery channel and surface it.
   * Returns the challenge (or `null` when the gateway refused).
   */
  async function issueOtp(mobileDigits: string): Promise<OtpChallenge | null> {
    const next = createOtpChallenge(mobileDigits);
    try {
      await deliverOtp(next);
    } catch {
      toast.push({ title: t('auth.otp.gatewayFail'), tone: 'warning' });
      return null;
    }
    setChallenge(next);
    setOtp('');
    setNow(Date.now());
    const masked = maskMobile(next.mobile);
    toast.push({
      title: t('auth.otp.toastTitle'),
      /* Mock mode: show the exact code on screen. Live mode: just confirm the SMS. */
      body: next.code
        ? t('auth.otp.toastBody', { code: next.code, mobile: masked })
        : t('auth.otp.liveNote', { mobile: masked }),
      tone: 'info'
    });
    return next;
  }

  /** Editing the number invalidates any code that was bound to the old one. */
  function onMobileChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    if (challenge && normalizeMobile(digits) !== challenge.mobile) {
      setChallenge(null);
      setOtp('');
    }
  }

  /** Resend always mints a fresh code — the previous one is never replayed. */
  async function resend() {
    if (!challenge || resendIn > 0 || busy) return;
    setBusy(true);
    try {
      await issueOtp(challenge.mobile);
    } finally {
      setBusy(false);
    }
  }

  /** Land on the deep-linked screen when there is one, otherwise the dashboard. */
  function goAfterLogin() {
    window.location.href = safeRedirect() ?? '/dashboard';
  }

  async function submit(demo = false) {
    setBusy(true);
    try {
      if (demo) {
        if (college && (college.id === 'MANUAL' || college.source === 'manual')) {
          addPendingCollege(college.name, 'demo');
        }
        await clientLogin(demoStudentUser(college));
        goAfterLogin();
        return;
      }

      /* The college field is required — validated before the credentials. */
      if (!college) {
        setCollegeError(true);
        toast.push({ title: t('auth.student.collegeRequired'), tone: 'warning' });
        return;
      }
      setCollegeError(false);

      const cleanId = id.trim().toUpperCase();
      const cleanPw = pw.trim();

      if (!cleanId || !cleanPw) {
        toast.push({ title: 'Enter your Student ID and password', tone: 'warning' });
        return;
      }
      if (cleanId !== DEMO_STUDENT.id || cleanPw !== DEMO_STUDENT.password) {
        toast.push({ title: 'Invalid Student ID or password', tone: 'warning' });
        return;
      }

      /* Step 1 — no live challenge yet: validate the mobile and mint one. */
      if (!challenge) {
        const digits = normalizeMobile(mobile);
        if (!isValidMobile(digits)) {
          toast.push({ title: t('auth.otp.mobileInvalid'), tone: 'warning' });
          return;
        }
        await issueOtp(digits);
        return;
      }

      /* Step 2 — strictly match the input against *this session's* OTP. */
      const result = await verifyOtp(challenge, otp);
      setChallenge(result.challenge);
      if (!result.ok) {
        const key = OTP_ERROR_KEY[result.status];
        toast.push({
          title: key ? t(key) : t('auth.error.invalid'),
          body: result.status === 'expired' || result.status === 'locked' ? t('auth.otp.resendHint') : undefined,
          tone: 'warning'
        });
        return;
      }

      /* Manually added colleges land in the Super-Admin approval queue. */
      if (college.id === 'MANUAL' || college.source === 'manual') {
        addPendingCollege(college.name, cleanId);
      }

      /* The login request carries the selected college alongside the
         other credentials (Student ID, password, mobile). When this demo
         is wired to a real backend, POST this object to the auth endpoint. */
      const loginRequest = {
        collegeId: college.id,
        collegeName: college.name,
        studentId: cleanId,
        password: cleanPw,
        mobile: normalizeMobile(mobile)
      };
      console.info('[hostelhub] student login request', { ...loginRequest, password: '••••••' });

      await clientLogin(demoStudentUser(college, loginRequest.mobile));
      goAfterLogin();
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
        className="w-full max-w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-6"
      >
        <h1 className="text-xl font-extrabold text-slate-900">{t('auth.student.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.student.sub')}</p>

        {/* Deep link from the footer — tell the visitor where they are headed
            and that the demo button gets them there in one click. */}
        {redirectTo && (
          <p className="mt-3 w-full max-w-full break-anywhere rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-xs font-semibold text-brand-800">
            {t('auth.redirect.hint', { path: redirectTo })}
          </p>
        )}

        <div className="mt-5 w-full max-w-full space-y-4">
          {/* Select College — sits above the Student ID / email field. */}
          <Field
            icon={Building2}
            label={t('auth.student.college')}
            hint={college ? college.id : undefined}
          >
            <CollegeSelect
              value={college}
              invalid={collegeError}
              onChange={(c) => {
                setCollege(c);
                setCollegeError(false);
              }}
            />
          </Field>

          <Field icon={Mail} label={t('auth.student.id')}>
            <AuthInput required value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. STU-23045" />
          </Field>
          <Field icon={Lock} label={t('auth.student.password')} hint="Demo: hostelhub">
            <AuthInput required type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="• • • • • • • •" />
          </Field>

          <Field
            icon={Smartphone}
            label={t('auth.student.mobile')}
            hint={challenge ? t('auth.otp.sentTo', { mobile: maskMobile(challenge.mobile) }) : t('auth.student.otpHint')}
          >
            <AuthInput
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={mobile}
              onChange={(e) => onMobileChange(e.target.value)}
              placeholder="e.g. 9826011223"
            />
          </Field>

          {/* Mock mode: the freshly minted code, straight from this session. */}
          {challenge && mockMode && (
            <OtpBanner
              code={challenge.code}
              mobile={maskMobile(challenge.mobile)}
              secondsLeft={ttl}
              attemptsLeft={left}
            />
          )}

          {challenge && (
            <div className="w-full max-w-full">
              <Field
                icon={KeyRound}
                label={`${t('auth.student.otp')} • 6 digits`}
                hint={ttl > 0 ? t('auth.otp.expiresIn', { s: ttl }) : t('auth.otp.resendHint')}
              >
                <AuthInput
                  ref={otpRef}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(normalizeOtp(e.target.value))}
                  placeholder="••••••"
                  aria-label={t('auth.student.otp')}
                />
              </Field>
              <button
                type="button"
                onClick={() => void resend()}
                disabled={busy || resendIn > 0}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:text-slate-400"
              >
                <RefreshCw className={busy ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                {resendIn > 0 ? t('auth.otp.resendIn', { s: resendIn }) : t('auth.otp.resend')}
              </button>
            </div>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-5 w-full" disabled={busy}>
          {busy ? <Spin /> : null} {busy ? 'Checking…' : awaitingOtp ? t('auth.student.signIn') : t('auth.student.sendOtp')}
        </Button>
        <Button type="button" variant="warden" size="lg" className="mt-2.5 w-full" onClick={() => void submit(true)}>
          ✨ {t('auth.student.demo')}
        </Button>

        <p className="mt-4 text-center text-xs text-slate-400">
          <ShieldAlert className="inline h-3.5 w-3.5" aria-hidden="true" /> Protected by a fresh 6-digit OTP + signed tokens. {t('app.institute')}
        </p>
      </form>
    </AuthShell>
  );
}

/** Thin wrapper so every auth field inherits the shared input recipe (ref-forwarding for autofocus). */
const AuthInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function AuthInput(props, ref) {
    return <input ref={ref} className={inputBase} {...props} />;
  }
);