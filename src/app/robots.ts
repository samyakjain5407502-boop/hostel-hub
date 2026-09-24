/**
 * robots.txt — App Router metadata file convention.
 * =================================================
 * Public marketing/auth pages are crawlable; everything behind login
 * (API routes, dashboards, management, admin, mess) is disallowed so it
 * never shows up in search results. Served automatically at /robots.txt.
 */

import type { MetadataRoute } from 'next';

/** Canonical origin — env override with a safe fallback if the var is unset. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hostel-hub-9py0.onrender.com').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/management/', '/admin/', '/mess/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}