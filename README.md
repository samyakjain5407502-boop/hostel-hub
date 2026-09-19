# 🏨 HostelHub

> **One Platform, Smarter Hostel Living** — *Any private hostel or PG network*

A production-grade, dual-portal web app for smarter hostel management: dynamic mess planning,
a gamified reward system, fast-track complaint tracking, meal-quality feedback, and a real-time
admin kitchen dashboard — with full **English / हिंदी / Hinglish** localization.

---

## ✨ Tech Stack

| Layer       | Choice                                                        |
|-------------|---------------------------------------------------------------|
| Frontend    | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind 3   |
| UI          | shadcn-style primitives on **Radix UI** · **Lucide** icons     |
| Motion      | **Framer Motion** micro-interactions, confetti & celebration   |
| Localization| Custom i18n context (instant switch, no reload)               |
| Data        | Mock store (localStorage) ⇄ **Supabase / Prisma** (swap-in)   |

---

## 🚀 Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Everything works **out of the box** with realistic seed data — no API keys required
(`NEXT_PUBLIC_DATA_MODE=mock`). State persists to `localStorage`.

### Demo credentials

| Portal  | Route        | Credentials                        |
|---------|--------------|------------------------------------|
| Student | `/auth/student` | ID `STU-23045` · pass `hostelhub` · OTP `482913` |
| Admin   | `/auth/admin`   | Key `HUB-2026` · Fac `FAC-1001` · passkey `447102` |

…or hit the **“Use demo account”** button on either login.

---

## 🧭 Portals

- **Student** (`/dashboard…`): Mess & Meals, Meal Rating, Complaints, Rewards (gift boxes 🎁),
  Leaderboard, Dining-Credit Wallet.
- **Admin** (`/admin…`): Command Center, Live Headcount, Menu Planner + Poll Analytics,
  Complaint Triage (SLA), Reward Broadcast Engine.

Role-based redirect middleware (`src/middleware.ts`) guarantees students can never reach admin
routes and vice-versa. Sessions are HMAC-SHA256 signed tokens; OTP + Passkey(2FA) demo flows included.

---

## 🌐 Localization

The nav **language switcher** toggles English, हिंदी, and colloquial Hinglish instantly
(no reload). Add keys in `src/i18n/en.ts`; the English dictionary is the typed source of truth.

---

## 🗄 Going to production

1. Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_DATA_MODE=supabase` + your keys.
2. Apply `supabase/schema.sql` (or `npx prisma migrate dev` with `prisma/schema.prisma`).
3. Wire `src/lib/*/store` mutations to your Server Actions / Supabase RPC calls.
4. Set a strong `AUTH_SECRET`, rotate the demo credentials, and point middleware at real auth.

---

© 2026 HostelHub · Contact: Samyakthora@gmail.com · +91 9098088466