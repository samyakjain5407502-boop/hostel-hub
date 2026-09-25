# 🚀 Deployment Tips — HostelHub

Practical notes for keeping the deployed app **awake, healthy and observable**.
Everything here applies to the Render free tier first, but the health-check
pattern works on any host (Railway, Fly.io, Vercel, a bare VPS + Docker).

---

## 1. The cold-start problem (Render free tier)

Render's free web services **spin down after ~15 minutes of no traffic** and the
next request pays a 30–60 s cold boot. Visitors see the Next.js loading shell and
assume the product is broken; the first demo click can even time out.

**Fix: keep one cheap request in flight every 10 minutes.** That is exactly what
the health endpoint is for:

```
GET https://<your-app>.onrender.com/api/health
```

```json
{ "status": "healthy", "uptime": 1234.56, "timestamp": "2026-09-25T08:15:02.441Z" }
```

Headers:

| Header          | Value                  | Why                                    |
|-----------------|------------------------|----------------------------------------|
| `Cache-Control` | `no-store, max-age=0`  | a cached reply proves nothing about the instance |
| `Content-Type`  | `application/json`     | monitor parses it directly              |

The route is `force-dynamic` (`src/app/api/health/route.ts`), so `uptime` is the
**live** process uptime — a value that resets after a restart, which is how you
tell "warm" from "recycled".

---

## 2. UptimeRobot (free, 5-minute checks)

1. Create an account at <https://uptimerobot.com> → **Add New Monitor**.
2. **Monitor Type:** `HTTP(s)` · **Friendly Name:** `HostelHub prod`.
3. **URL:** `https://<your-app>.onrender.com/api/health`
4. **Monitoring Interval:** every **10 minutes** (5 min on the free tier is also
   fine — the endpoint is weightless).
5. **Alert Contacts:** your email (and a Slack/Discord webhook if you have one).
6. Optional — **Alert When:** *Down*, plus a second monitor on `/` with keyword
   monitoring for `HostelHub` so a white-screen deploy is caught too.

> ⚠️ Do not point the monitor at `/` — that renders the full landing page (fonts,
> images, animations) and wastes free-tier CPU minutes. `/api/health` is a JSON
> literal.

## 3. cron-job.org (free, minute-granularity)

1. Sign in at <https://cron-job.org> → **Create cronjob**.
2. **Title:** `HostelHub keep-alive` · **URL:**
   `https://<your-app>.onrender.com/api/health`
3. **Schedule:** `*/10 * * * *` (every 10 minutes).
4. **Execution settings:** enable *Save responses in job history* and set
   **Failure → Notify** so a non-`200` (or a body without `"healthy"`) emails you.
5. **Advanced → Treat redirects as errors:** off (307s are legitimate here).

## 4. Any GitHub Actions repo (zero extra accounts)

```yaml
# .github/workflows/keep-alive.yml
name: keep-alive
on:
  schedule: [{ cron: '*/10 * * * *' }]
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping HostelHub health endpoint
        run: |
          body=$(curl -fsS --max-time 90 "https://${{ vars.APP_URL }}/api/health")
          echo "$body"
          echo "$body" | grep -q '"status":"healthy"'
```

Set the repository variable `APP_URL` (Settings → Secrets and variables →
Actions → Variables). Note: GitHub's scheduler is best-effort and can lag by
several minutes — fine for keep-alive, not for strict SLA alerting.

---

## 5. Production environment checklist

Copy `.env.example` → your host's env settings and fill in:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_DATA_MODE` | yes | `demo` for the zero-config demo, `supabase` for the live backend |
| `AUTH_SECRET` | **yes in `supabase` mode** | `openssl rand -base64 32`; the app refuses to start without it |
| `NEXT_PUBLIC_SUPABASE_URL` | in `supabase` mode | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | in `supabase` mode | safe in the browser (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | **server-only** — never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | recommended | canonical origin for `robots.ts`, `sitemap.ts`, OG images |
| `DATABASE_URL` | optional | only for `prisma migrate` |

Generate `AUTH_SECRET` on any machine:

```bash
openssl rand -base64 32
# Windows / no openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Render → **Environment** → add each variable → **Manual Deploy → Clear build
cache and deploy** so the `NEXT_PUBLIC_*` values are baked into the client bundle.

---

## 6. Rendering the first paint fast

- Free instances have a small CPU slice: keep `next build` output as-is
  (`npm run build && npm start`) and avoid adding heavy client libraries.
- The PWA manifest (`public/manifest.json`) makes the second visit instant from
  the home-screen icon — no cold start for repeat users.
- `public/favicon.ico` + `public/apple-touch-icon.png` are generated from
  `public/icon.svg`; re-run `powershell -File scripts/make-favicon.ps1` after any
  change to the vector mark so browsers never 404 the icon.

---

## 7. Verifying the deployment

```bash
curl -i https://<your-app>.onrender.com/api/health      # 200 + no-store header
curl -I https://<your-app>.onrender.com/favicon.ico     # 200 image/x-icon
curl -I https://<your-app>.onrender.com/manifest.json   # 200 application/json
curl -I https://<your-app>.onrender.com/operator        # 307 → /mess
curl -I https://<your-app>.onrender.com/desk            # 307 → /management
curl -I https://<your-app>.onrender.com/auth/staff      # 307 → /auth
```

Then sign in to all four portals with the demo credentials in the README
(`/auth/student`, `/auth/mess`, `/auth/management`, `/auth/admin`).
