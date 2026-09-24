import type { Metadata } from 'next';
import { Database, Mail, ShieldCheck, Timer, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { LandingNav } from '@/components/landing/nav';
import { Card, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What data HostelHub collects, why, how it is stored in demo (localStorage) and live (Supabase) modes, how long it is kept, and who to contact.'
};

const UPDATED = '24 September 2026';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'Samyakthora@gmail.com';

/** One policy section on a Card — matches the design system used across the app. */
function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card className="mt-4">
      <CardHeader icon={icon} title={title} />
      <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600">{children}</div>
    </Card>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-brand-400">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mesh-bg min-h-dvh">
      <LandingNav />
      <main id="main" className="mx-auto max-w-2xl px-5 py-10">
        <header className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Privacy
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Last updated {UPDATED} — written in plain language to honestly describe how the app
            handles your data today.
          </p>
        </header>
        <Section icon={<Users className="h-5 w-5" />} title="What data we collect">
          <p>Only what the platform needs to work:</p>
          <Bullets
            items={[
              <>
                <strong className="font-semibold text-slate-800">Login details</strong> — student ID,
                password, college, and mobile number (used for one-time password / OTP verification
                during sign-in). Staff portals use their own portal credentials.
              </>,
              <>
                <strong className="font-semibold text-slate-800">Hostel onboarding details</strong>{' '}
                — full name, email, phone number, age, and the{' '}
                <strong className="font-semibold text-slate-800">last 4 digits of your Aadhaar</strong>{' '}
                (we never ask for or store a full Aadhaar number), plus hostel details such as branch
                name, address, room fees and amenities.
              </>,
              <>
                <strong className="font-semibold text-slate-800">Complaint content</strong> — the
                title, description, category and priority you file, plus an{' '}
                <strong className="font-semibold text-slate-800">optional photo</strong> you attach
                as proof.
              </>,
              <>
                <strong className="font-semibold text-slate-800">Basic technical data</strong> —
                request metadata such as your IP address, used only for abuse prevention (e.g.
                rate-limiting OTP/SMS sends), and locally stored preferences like theme and language.
              </>
            ]}
          />
          <p>
            <strong className="font-semibold text-slate-800">We do not collect</strong> full
            Aadhaar numbers, payment card details, precise GPS location, or contacts — the app never
            asks for them.
          </p>
        </Section>

        <Section icon={<ShieldCheck className="h-5 w-5" />} title="Why we collect it">
          <Bullets
            items={[
              'To authenticate you and deliver OTP codes to the right mobile number.',
              'To let hostel owners publish their branch details (fees, amenities, rules) and let students find them.',
              'To route complaints to the right hostel staff and track them to resolution.',
              'To operate mess planning, fee ledgers, gate passes, rewards and admin analytics for your hostel.',
              'To prevent abuse of the platform — for example, stopping someone from triggering unlimited SMS messages.'
            ]}
          />
        </Section>
        <Section icon={<Database className="h-5 w-5" />} title="How it is stored">
          <p>
            <strong className="font-semibold text-slate-800">Demo mode (default)</strong> —
            everything stays in your own browser&apos;s{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code>. No
            personal data is sent to any server; clearing your browser&apos;s site data removes it.
          </p>
          <p>
            <strong className="font-semibold text-slate-800">Live mode</strong> — data is stored in
            a Supabase (PostgreSQL) database with row-level security, so portals only see the rows
            they are allowed to. In live mode your mobile number and one-time code are also passed
            to the configured SMS provider (Twilio or Fast2SMS) purely to deliver the message; OTP
            codes are kept only in server memory for two minutes, are single-use, and are never
            stored in plaintext beyond that.
          </p>
        </Section>

        <Section icon={<Timer className="h-5 w-5" />} title="How long we keep it">
          <Bullets
            items={[
              'Demo mode: until you clear your browser data — nothing is kept on any server.',
              'Live mode: for as long as your account or hostel relationship is active, plus operational records (complaints, invoices, gate passes) kept while your hostel needs them.',
              'OTP codes: two minutes, then they expire; successful codes are burned immediately.',
              'You can ask us to delete your data at any time using the contact below.'
            ]}
          />
          <p className="text-xs text-slate-500">
            As an early-stage product we do not yet have formal, fixed retention schedules — we keep
            things only as long as the purposes above require and will tighten this as the platform
            matures.
          </p>
        </Section>
        <Section icon={<UserCheck className="h-5 w-5" />} title="Who we share it with">
          <p>
            <strong className="font-semibold text-slate-800">We do not sell your personal data</strong>,
            and there are no advertising or marketing trackers involved.
          </p>
          <Bullets
            items={[
              'Demo mode: nothing leaves your browser at all.',
              'Live mode: only the service providers needed to run the app — Supabase (database hosting) and the configured SMS provider (mobile number + OTP code, only to send the message).',
              <>
                Your complaint text and photo are shared with your hostel&apos;s management staff so
                they can fix the issue — that is the point of filing it.
              </>,
              'We disclose data only if legally required.'
            ]}
          />
        </Section>

        <Section icon={<Mail className="h-5 w-5" />} title="Your choices & contact">
          <Bullets
            items={[
              <>Use demo mode if you prefer that no data leaves your device at all.</>,
              <>Clear your browser&apos;s site data to wipe local demo data.</>,
              <>
                Questions, access requests, or deletion requests:{' '}
                <a
                  className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>{' '}
                — the same address listed in the site footer.
              </>
            ]}
          />
        </Section>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs leading-relaxed text-amber-800">
          <strong className="font-bold">Honest note:</strong> HostelHub is an early-stage product,
          and this is a general, plain-language policy that reflects how the app actually works
          today. It is written for transparency, not as legal advice, and it is not a substitute for
          a lawyer-drafted policy reviewed for your jurisdiction.
        </div>

        <div className="mt-4 pb-4 text-center text-xs text-slate-400">
          Questions about this page? Email{' '}
          <a className="text-brand-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}