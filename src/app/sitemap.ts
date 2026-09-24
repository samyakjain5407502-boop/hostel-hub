/**
 * sitemap.xml — App Router metadata file convention.
 * ==================================================
 * Covers public, unauthenticated pages only (marketing + auth entry
 * points). Logged-in areas (/dashboard, /management, /admin, /mess) and
 * API routes are intentionally excluded, matching src/app/robots.ts.
 * Served automatically at /sitemap.xml.
 */

import type { MetadataRoute } from 'next';

/** Canonical origin — env override with a safe fallback if the var is unset. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hostel-hub-9py0.onrender.com').replace(/\/+$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = [
    '/',
    '/hostels',
    '/onboard',
    '/auth',
    '/auth/student',
    '/auth/management',
    '/auth/mess',
    '/auth/admin',
    '/privacy',
    '/terms',
  ];

  return publicPaths.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '/' : path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1.0 : 0.7,
  }));
}