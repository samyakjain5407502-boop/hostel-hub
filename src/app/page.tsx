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
 * HostelHub landing page — rebuilt from the ground up.
 *
 * Medi-Caps University | Cause ’26
 *
 * The composition reads as one editorial flow, and every band is intentional:
 *
 *   1. `Hero`        — asymmetrical 7/5 grid, indigo→violet gradient headline,
 *                      integrated live-headcount status bar, product console.
 *   2. `TrustRail`   — measured outcomes first, operator marquee second.
 *   3. `Portals`     — the 4-portal bento hub (7/5 · 5/7) with the admin tile
 *                      carrying the New College / Branch Registration module.
 *   4. `Capabilities`— six engineered promises, each with a hand-built visual.
 *   5. `HowItWorks`  — the operating loop as a numbered rail (no extra boxes).
 *   6. `ImpactBand`  — the single saturated indigo panel on the page.
 *   7. `Faq`         — five real questions, answered in place.
 *   8. `FinalCta`    — one primary action, one staff door, one registration link.
 *
 * `#main` is the skip-link target declared in the root layout. The page itself
 * stays a server component; every interactive band below opts into a client
 * boundary on its own.
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
