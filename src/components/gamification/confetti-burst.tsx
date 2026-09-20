'use client';

/**
 * Viewport confetti burst.
 * ─────────────────────────────────────────────────────────────
 * Renders into a fixed, pointer-events-none layer so a celebration reads the
 * same whether it is fired from a card, a dialog or the middle of a page.
 * The particles are memoised per `burst` id, so re-firing restarts cleanly
 * without re-randomising an already-animating layer.
 */

import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { createPortal } from 'react-dom';

const COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#0ea5e9'];

export interface ConfettiBurstProps {
  /** Unique per burst — change it to re-fire the animation. */
  burst: number;
  count?: number;
  /** Where the particles originate, in viewport pixels. Defaults to centre. */
  origin?: { x: number; y: number };
  onDone?: () => void;
}

export function ConfettiBurst({ burst, count = 90, origin, onDone }: ConfettiBurstProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const pieces = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.35;
        const dist = 110 + Math.random() * 300;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist * 0.8 + 60,
          rot: Math.random() * 720 - 360,
          w: 6 + Math.random() * 7,
          h: 8 + Math.random() * 10,
          round: Math.random() > 0.6,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.1,
          dur: 1 + Math.random() * 0.8
        };
      }),
    // Re-randomise on every new burst, not on unrelated re-renders.
    [burst, count]
  );

  React.useEffect(() => {
    if (reduce || !onDone) return;
    const id = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(id);
  }, [burst, reduce, onDone]);

  if (!mounted || reduce) return null;

  const ox = origin?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const oy = origin?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2.6 : 0);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[130] overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={`${burst}-${i}`}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rot, scale: 0.45 }}
          transition={{ delay: p.delay, duration: p.dur, ease: 'easeOut' }}
          className={p.round ? 'absolute rounded-full' : 'absolute rounded-[2px]'}
          style={{ left: ox, top: oy, width: p.w, height: p.h, backgroundColor: p.color }}
        />
      ))}
    </div>,
    document.body
  );
}

/**
 * Imperative hook: `const { fire, burst} = useConfetti()` then render
 * `{burst}` once near the page root and call `fire(event)` on any interaction.
 */
export function useConfetti() {
  const [state, setState] = React.useState<{ id: number; origin?: { x: number; y: number } } | null>(null);

  const fire = React.useCallback((e?: { clientX: number; clientY: number } | React.MouseEvent | null) => {
    const point =
      e && 'clientX' in e ? { x: e.clientX, y: e.clientY } : undefined;
    setState({ id: Date.now(), origin: point });
  }, []);

  const node = state ? <ConfettiBurst burst={state.id} origin={state.origin} onDone={() => setState(null)} /> : null;

  return { fire, burst: node };
}

export { COLORS };
