'use client';

import ChartJS from 'chart.js/auto';
import * as React from 'react';
import { useTheme } from '@/components/theme/provider';

interface Row { label: string; votes: number; }

/** Canvas colours for Chart.js, mirroring --border / --fg-muted per theme. */
const AXIS = {
  light: { grid: '#e2e8f0', tick: '#64748b' },
  dark: { grid: '#1e293b', tick: '#94a3b8' }
} as const;

/** Bar chart of poll results (Chart.js). */
export function PollChart({ data }: { data: Row[] }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<ChartJS | null>(null);
  const { theme } = useTheme();

  const labels = React.useMemo(() => data.map((d) => d.label), [data]);
  const votes = React.useMemo(() => data.map((d) => d.votes), [data]);

  React.useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    // Canvas can't inherit Tailwind classes, so axis colours are picked
    // explicitly and the chart is rebuilt whenever the theme flips.
    const axis = AXIS[theme];
    chartRef.current = new ChartJS(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Votes',
          data: votes,
          backgroundColor: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'],
          borderRadius: 8,
          maxBarThickness: 46
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { displayColors: false, callbacks: { label: (ctx) => `${ctx.parsed.y} votes` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: axis.grid },
            border: { display: false },
            ticks: { precision: 0, color: axis.tick }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: axis.tick }
          }
        }
      }
    });
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [labels, votes, theme]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="relative h-60 w-full">
        <canvas ref={ref} role="img" aria-label="Poll votes bar chart" />
      </div>
    </div>
  );
}