/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },

  /**
   * URL aliases (Phase 1).
   * Every alias is a 307 *redirect* (not an internal rewrite) so the address
   * bar normalises to the canonical route and the middleware RBAC pass then
   * evaluates the real path — a signed-out visitor hitting `/operator` lands on
   * `/mess` and is bounced to `/auth/mess` exactly like a direct visit.
   *
   *   /operator[/...] → /mess[/...]        mess-operator console
   *   /desk[/...]     → /management[/...]  management / warden desk
   *   /auth/staff     → /auth              staff portal chooser
   *
   * Mirror list (documentation only) in `src/lib/portals.ts` → LEGACY_ROUTES.
   */
  async redirects() {
    return [
      { source: '/operator', destination: '/mess', permanent: false },
      { source: '/operator/:path*', destination: '/mess/:path*', permanent: false },
      { source: '/desk', destination: '/management', permanent: false },
      { source: '/desk/:path*', destination: '/management/:path*', permanent: false },
      { source: '/auth/staff', destination: '/auth', permanent: false }
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  }
};

export default nextConfig;