'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const SIZE = 13;

/**
 * Deterministic QR-style visual for a gate pass code.
 *
 * This is a *visual* representation, not a scannable QR symbol — the security
 * desk types the 6-character code. Being deterministic (pure hash of the code,
 * no randomness) keeps server and client markup identical, so there is no
 * hydration mismatch.
 */
export function PassCode({ code, className, label }: { code: string; className?: string; label?: string }) {
  const cells = React.useMemo(() => buildMatrix(code), [code]);

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div
        className="passcode-surface grid gap-[2px] rounded-xl border p-2.5 shadow-lift"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        role="img"
        aria-label={label ? `${label}: ${code}` : code}
      >
        {cells.map((on, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn('h-2.5 w-2.5 rounded-[2px] sm:h-3 sm:w-3', on ? 'passcode-cell-on' : 'passcode-cell-off')}
          />
        ))}
      </div>
      <code className="rounded-lg bg-slate-900 px-3 py-1 font-mono text-sm font-bold tracking-[0.35em] text-white">
        {code}
      </code>
    </div>
  );
}

/** 33-bit FNV-1a spread over the grid, with three finder squares for realism. */
function buildMatrix(code: string): boolean[] {
  const on: boolean[] = new Array(SIZE * SIZE).fill(false);

  for (const [x, y] of finderOrigins()) {
    for (let dx = 0; dx < 4; dx++) {
      for (let dy = 0; dy < 4; dy++) {
        const edge = dx === 0 || dy === 0 || dx === 3 || dy === 3;
        on[(y + dy) * SIZE + (x + dx)] = edge || (dx === 1 && dy === 1) || (dx === 2 && dy === 2);
      }
    }
  }

  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }

  for (let i = 0; i < SIZE * SIZE; i++) {
    // Cheap xorshift so neighbouring cells don't look patterned.
    h ^= h << 13; h >>>= 0;
    h ^= h >> 17;
    h ^= h << 5; h >>>= 0;
    if (overlapsFinder(i)) continue;
    on[i] = (h & 1) === 1;
  }
  return on;
}

function finderOrigins(): Array<[number, number]> {
  return [[0, 0], [SIZE - 4, 0], [0, SIZE - 4]];
}

function overlapsFinder(index: number): boolean {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);
  return finderOrigins().some(([fx, fy]) => x >= fx && x < fx + 4 && y >= fy && y < fy + 4);
}