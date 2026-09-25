/**
 * GET /api/health — liveness probe (Phase 5).
 * ==================================================================
 * The cheapest possible "is this instance awake?" answer, used by:
 *   • `docs/DEPLOYMENT_TIPS.md` uptime monitors (UptimeRobot / cron-job.org)
 *     pinging every 10 minutes so a Render free-tier container never idles out;
 *   • any platform health check configured in render.yaml / Docker / k8s.
 *
 * Response (HTTP 200):
 *   { "status": "healthy", "uptime": 1234.56, "timestamp": "2026-09-25T…Z" }
 *
 * `dynamic = 'force-dynamic'` + `Cache-Control: no-store` are load-bearing:
 * without them Next would happily serve a *build-time* snapshot and every ping
 * would report the same uptime, defeating the whole point of the probe.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      /* Seconds since this Node process started — a restart resets it, which is
         exactly how a monitor distinguishes "awake" from "recycled". */
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    }
  );
}
