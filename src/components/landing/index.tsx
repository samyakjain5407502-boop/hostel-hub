'use client';

import { Footer } from '@/components/footer';
import { LandingNav } from './nav';
import { Hero } from './hero';
import { Features } from './features';
import { HowItWorks } from './how';
import { StatsStrip } from './stats';
import { FinalCta } from './cta';

export function Landing() {
  return (
    <div className="mesh-bg w-full max-w-full overflow-x-clip">
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <StatsStrip />
      <FinalCta />
      <Footer />
    </div>
  );
}