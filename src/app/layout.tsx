import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from './providers';
import './globals.css';

/**
 * Self-hosted Inter via next/font (no <link>/CDN — faster and needs no extra
 * CSP allowances). The `variable` option defines `--font-inter` globally,
 * which is the CSS variable tailwind.config.js references for `font-sans`
 * and `font-display`, so the whole site now renders in Inter instead of the
 * system fallback.
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
});

export const metadata: Metadata = {
  /* Absolute base so og:image / twitter:image resolve to the production
     origin instead of http://localhost:3000 when links are shared. */
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hostel-hub-9py0.onrender.com'),
  title: {
    default: 'HostelHub — Smarter Hostel Living',
    template: '%s · HostelHub'
  },
  description:
    'One Platform, Smarter Hostel Living. Dynamic mess planning, eco & discipline rewards, complaint tracking and admin analytics for any private hostel or PG network.',
  applicationName: 'HostelHub',
  /**
   * Icons.
   * `/favicon.ico` is emitted for the legacy browser + crawler request (Next
   * serves it straight from `public/`), and the scalable `/icon.svg` stays
   * first-class for modern browsers and the PWA manifest. `apple` covers iOS
   * "Add to Home Screen".
   */
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  /* PWA (Phase 3): manifest + iOS standalone hints. */
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'HostelHub',
    statusBarStyle: 'default'
  },
  keywords: ['hostel', 'mess', 'rewards', 'student portal', 'hostel management', 'PG network'],
  openGraph: {
    type: 'website',
    title: 'HostelHub',
    description: 'One Platform, Smarter Hostel Living',
    siteName: 'HostelHub',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }]
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png']
  }
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4f46e5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hostelhub.theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-1 focus:top-1 focus:z-[200] focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-1.5 focus:text-white"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}