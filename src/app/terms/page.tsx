import type { Metadata } from 'next';
import { AlertTriangle, Gavel, Info, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { LandingNav } from '@/components/landing/nav';
import { Card, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of HostelHub — an early-stage hostel-management platform — including acceptable use, account basics and an as-is disclaimer.'
};

const UPDATED = '24 September 2026';
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'Samyakthora@gmail.com';

/** One terms section on a Card — matches the design system used across the app. */
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

export default function TermsPage() {
  return (
    <div className="mesh-bg min-h-dvh">
      <LandingNav />
      <main id="main" className="mx-auto max-w-2xl px-5 py-10">
        <header className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <Gavel className="h-3.5 w-3.5" aria-hidden="true" /> Terms
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Last updated {UPDATED} — these terms are written to match the current, early stage of
            this product.
          </p>
        </header>
        <Section icon={<Info className="h-5 w-5" />} title="1. Accepting these terms">
          <p>
            By using HostelHub you agree to these Terms of Service and to our{' '}
            <a className="font-semibold text-brand-700 underline-offset-2 hover:underline" href="/privacy">
              Privacy Policy
            </a>
            . If you do not agree, please do not use the platform. If anything is unclear, contact
            us before continuing.
          </p>
        </Section>

        <Section icon={<ShieldCheck className="h-5 w-5" />} title="2. What HostelHub is">
          <p>
            HostelHub is a{' '}
            <strong className="font-semibold text-slate-800">hostel-management platform</strong>{' '}
            for private hostels and PG networks — it connects students, mess operators, hostel
            management and administrators in one place (mess planning, complaints, gate passes,
            fee ledgers, rewards and analytics).
          </p>
          <p>
            It is{' '}
            <strong className="font-semibold text-slate-800">not a general marketplace</strong>.
            Hostel listings shown under /hostels come from onboarded hostel owners publishing their
            own branches; HostelHub does not itself offer rooms, and any arrangement you make with a
            hostel (including fees) is between you and that hostel.
          </p>
        </Section>

        <Section icon={<UserCheck className="h-5 w-5" />} title="3. Accounts & eligibility">
          <Bullets
            items={[
              'You need an account for the student, mess, management and admin portals. Provide accurate information and keep your credentials private — you are responsible for activity under your account.',
              'Hostel owners onboarding a property must be 18 or older and must have the authority to list the property.',
              'Students use the platform through the college/hostel they are affiliated with.',
              'Demo credentials are provided for evaluation of this early preview; do not treat them as production accounts.',
              'Tell us promptly if you believe your account has been misused.'
            ]}
          />
        </Section>
        <Section icon={<Gavel className="h-5 w-5" />} title="4. Acceptable use">
          <p>You agree not to misuse HostelHub. In particular, you will not:</p>
          <Bullets
            items={[
              'Use it for anything unlawful, fraudulent, harassing or abusive.',
              'Abuse authentication or messaging systems — for example, bombarding the OTP/SMS endpoint with automated requests (such traffic is rate-limited for this reason).',
              'File complaints or upload photos you have no right to share, or content that is defamatory, obscene or unrelated to a genuine hostel issue.',
              'Attempt to disrupt, probe, reverse-engineer beyond authorized testing, or gain unauthorized access to other accounts, hostels or data.',
              'Scrape the site or reuse its content commercially without written permission.',
              'Impersonate anyone or misrepresent your affiliation with a hostel or college.'
            ]}
          />
        </Section>

        <Section icon={<AlertTriangle className="h-5 w-5" />} title="5. Early-stage service, provided “as is”">
          <p>
            HostelHub is currently an{' '}
            <strong className="font-semibold text-slate-800">early preview / demo product</strong>.
            It is provided on an “as is” and “as available” basis, without warranties of any kind,
            express or implied. We may change, pause or discontinue features — or the whole service —
            at any time and without notice, and demo or seed data may be reset.
          </p>
          <p>
            To the maximum extent permitted by law, we are not liable for any indirect, incidental or
            consequential losses arising from your use of the platform. Operational figures in the
            app (fees, ledgers, invoices, rewards) are tools for hostel management convenience —
            confirm real-world records with your hostel directly. Nothing here limits liability that
            cannot legally be limited.
          </p>
        </Section>
        <Section icon={<Info className="h-5 w-5" />} title="6. Changes & contact">
          <p>
            We may update these terms as the product evolves; the “last updated” date above will
            change when we do. Continued use after an update means you accept the revised terms.
          </p>
          <p>
            Questions about these terms:{' '}
            <a
              className="font-semibold text-brand-700 underline-offset-2 hover:underline"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>{' '}
            — the same address listed in the site footer.
          </p>
        </Section>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs leading-relaxed text-amber-800">
          <strong className="font-bold">Honest note:</strong> HostelHub is an early-stage product,
          and these are general terms written in plain language to set expectations for a demo-stage
          platform. They are not legal advice and are not a substitute for terms drafted and
          reviewed by a lawyer for your situation and jurisdiction.
        </div>

        <div className="mt-4 pb-4 text-center text-xs text-slate-400">
          Questions about these terms? Email{' '}
          <a className="text-brand-600 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}