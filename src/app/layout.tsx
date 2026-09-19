import type { Metadata, Viewport } from 'next';
import { AppProviders } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'HostelHub — Smarter Hostel Living',
    template: '%s · HostelHub'
  },
  description:
    'One Platform, Smarter Hostel Living. Dynamic mess planning, eco & discipline rewards, complaint tracking and admin analytics for any private hostel or PG network.',
  applicationName: 'HostelHub',
  icons: { icon: '/icon.svg' },
  keywords: ['hostel', 'mess', 'rewards', 'student portal', 'hostel management', 'PG network'],
  openGraph: {
    type: 'website',
    title: 'HostelHub',
    description: 'One Platform, Smarter Hostel Living',
    siteName: 'HostelHub'
  }
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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