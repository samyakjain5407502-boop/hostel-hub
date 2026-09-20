import { Footer } from '@/components/footer';
import { LandingNav } from '@/components/landing/nav';
import { Hero } from '@/components/landing/hero';
import { TrustRail } from '@/components/landing/trust';
import { Portals } from '@/components/landing/portals';
import { Capabilities } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how';
import { ImpactBand } from '@/components/landing/stats';
import { Faq } from '@/components/landing/faq';
import { FinalCta } from '@/components/landing/cta';

/**
 * HostelHub landing page.
 *
 * HostelHub — Built for smarter hostel living (independent multi-tenant SaaS).
 *
 * The composition reads as one editorial flow, and every band is intentional:
 *
 *   1. `Hero`        — asymmetrical 7/5 grid, indigo→violet gradient headline,
 *                      integrated live-headcount status bar, product console and
 *                      a single call to action.
 *   2. `TrustRail`   — four measured outcomes from live hostel operations.
 *   3. `Portals`     — the public 3-portal bento (student · mess operator ·
 *                      management desk) with the new college/branch
 *                      registration module inside the management tile.
 *   4. `Capabilities`— six engineered promises, each with a hand-built visual.
 *   5. `HowItWorks`  — the operating loop as a numbered rail (no extra boxes).
 *   6. `ImpactBand`  — the single saturated indigo panel on the page.
 *   7. `Faq`         — five real questions, answered in place.
 *   8. `FinalCta`    — one primary action, one staff door, one registration link.
 *
 * Admin Command is deliberately absent from this page: it is a staff-only
 * surface reached through the header menu or the `/auth` portal hub. `#main` is
 * the skip-link target declared in the root layout; every interactive band opts
 * into its own client boundary.
 */
export default function HomePage() {
  return (
    <div className="w-full max-w-full overflow-x-clip bg-white">
      <LandingNav />

      <main id="main" className="w-full max-w-full">
        <Hero />
        <TrustRail />
        <Portals />
        <Capabilities />
        <HowItWorks />
        <ImpactBand />
        <Faq />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}
