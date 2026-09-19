'use client';

import { motion } from 'framer-motion';
import * as React from 'react';

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export function ConfettiBurst({ count = 90 }: { count?: number }) {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.3);
        const dist = 90 + Math.random() * 220;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.7 + 40,
          rot: Math.random() * 540 - 270,
          size: 5 + Math.random() * 7,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.12,
          dur: 0.9 + Math.random() * 0.7
        };
      }),
    [count]
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rot, scale: 0.4 }}
          transition={{ delay: p.delay, duration: p.dur, ease: 'easeOut' }}
          className="absolute h-2.5 w-2.5 rounded-[2px]"
          style={{ left: '50%', top: '46%', backgroundColor: p.color, width: p.size, height: p.size * 0.55 }}
        />
      ))}
    </div>
  );
}
export { COLORS };