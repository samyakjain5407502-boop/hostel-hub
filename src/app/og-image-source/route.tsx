/**
 * Brand source for public/og-image.png — renders the social share card
 * (1200×630, the standard OG size) with next/og's ImageResponse, styled to
 * match the site (brand indigo gradient, HostelHub wordmark, tagline).
 *
 * Export/refresh the static PNG used by the metadata in src/app/layout.tsx:
 *   1. npm run build && npx next start -p 3111
 *   2. fetch http://localhost:3111/og-image-source → save as public/og-image.png
 * Social crawlers read the static public/og-image.png, not this route; this
 * endpoint only exists so the PNG can be generated programmatically
 * (no manual screenshot) and regenerated whenever branding changes.
 */
import { ImageResponse } from 'next/og';

/* Edge runtime: the Node build of @vercel/og resolves its bundled default font
   with path.join(import.meta.url, '../…ttf'), which mangles Windows paths and
   throws "Invalid URL" during prerender (index.node.js, module top level).
   The edge build loads the same font via fetch(new URL(...)) and is unaffected. */
export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(100deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
          color: '#ffffff',
          position: 'relative'
        }}
      >
        {/* Soft decorative circles for depth. */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            right: -80,
            width: 440,
            height: 440,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            left: -100,
            width: 540,
            height: 540,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex'
          }}
        />
        {/* Wordmark: Hostel + Hub, mirroring the footer/brand treatment. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontSize: 112,
            fontWeight: 800,
            letterSpacing: -3
          }}
        >
          <span style={{ display: 'flex' }}>Hostel</span>
          <span style={{ display: 'flex', color: '#c7d2fe' }}>Hub</span>
        </div>
        <div
          style={{
            display: 'flex',
            width: 140,
            height: 6,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.55)',
            marginTop: 30,
            marginBottom: 30
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 44,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.94)'
          }}
        >
          One Platform, Smarter Hostel Living
        </div>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: 44,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.75)'
          }}
        >
          hostel-hub-9py0.onrender.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}