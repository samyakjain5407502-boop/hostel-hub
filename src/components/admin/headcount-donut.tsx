'use client';

/** Lightweight SVG donut for live headcount (no external chart lib needed here). */
export function HeadcountDonut({ eating, seated, size = 116 }: { eating: number; seated: number; size?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const pct = seated ? Math.min(1, eating / seated) : 0;
  const stroke = c * pct;

  return (
    <svg width={size} height={size} viewBox="0 0 110 110" role="img" aria-label={`${eating} of ${seated} students eating`} className="shrink-0">
      <circle cx="55" cy="55" r={r} fill="none" style={{ stroke: 'var(--border-strong)' }} strokeWidth="12" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke="url(#hcd)"
        strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${stroke} ${c - stroke}`}
        transform="rotate(-90 55 55)"
      />
      <defs>
        <linearGradient id="hcd" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <text x="55" y="52" textAnchor="middle" fontSize="16" fontWeight="800" style={{ fill: 'var(--fg)' }}>{Math.round(pct * 100)}%</text>
      <text x="55" y="66" textAnchor="middle" fontSize="7" style={{ fill: 'var(--fg-muted)' }}>seats used</text>
    </svg>
  );
}