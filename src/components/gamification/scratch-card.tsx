'use client';

/**
 * Scratch card.
 * ─────────────────────────────────────────────────────────────
 * A genuinely interactive scratch-to-reveal surface: the foil is a grid of
 * cells and a pointer drag erases every cell under the cursor (with a small
 * radius so a finger swipe feels smooth, not stringy). At `threshold` of the
 * foil removed the card auto-reveals and fires `onReveal` once.
 *
 * Why a cell grid rather than a `<canvas>` mask: it needs no pixel readback,
 * it is trivially themeable (the foil is a CSS class), it survives SSR, and
 * it keeps the interaction at 60fps on a mid-range phone.
 *
 * Accessibility: dragging is never the *only* path — a real button reveals the
 * prize for anyone using a keyboard, a screen reader or reduced motion.
 */

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLS = 12;
const ROWS = 7;
const CELLS = COLS * ROWS;
/** 55% of the foil removed counts as "scratched enough". */
const THRESHOLD = 0.55;

export interface ScratchCardProps {
  /** The prize revealed underneath the foil. */
  children: React.ReactNode;
  onReveal?: () => void;
  /** Change this to re-seal the card (e.g. after claiming a new card). */
  resetKey?: string | number;
  disabled?: boolean;
  /** Progress readout, e.g. `(pct) => `${pct}% scratched``. */
  progressLabel?: (pct: number) => string;
  hintLabel?: string;
  revealAllLabel?: string;
  className?: string;
  /** Minimum height of the scratch surface. */
  minHeight?: number;
}

export function ScratchCard({
  children,
  onReveal,
  resetKey,
  disabled = false,
  progressLabel,
  hintLabel,
  revealAllLabel,
  className,
  minHeight = 210
}: ScratchCardProps) {
  const reduce = useReducedMotion();
  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const drawingRef = React.useRef(false);
  const revealedRef = React.useRef(false);

  const [cleared, setCleared] = React.useState<boolean[]>(() => new Array(CELLS).fill(false));
  const [revealed, setRevealed] = React.useState(false);

  /* Re-seal whenever the caller hands us a new card. */
  React.useEffect(() => {
    setCleared(new Array(CELLS).fill(false));
    setRevealed(false);
    revealedRef.current = false;
  }, [resetKey]);

  const scratched = React.useMemo(() => cleared.reduce((a, b) => a + (b ? 1 : 0), 0), [cleared]);
  const ratio = scratched / CELLS;
  const pct = Math.round(ratio * 100);

  /** Reveal once, fire the callback once. */
  const reveal = React.useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    onReveal?.();
  }, [onReveal]);

  React.useEffect(() => {
    if (!disabled && ratio >= THRESHOLD) reveal();
  }, [ratio, disabled, reveal]);

  /** Erase a small stamp of cells around a pointer position. */
  const eraseAt = React.useCallback((clientX: number, clientY: number) => {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fx = (clientX - rect.left) / rect.width;
    const fy = (clientY - rect.top) / rect.height;
    if (fx < -0.05 || fx > 1.05 || fy < -0.05 || fy > 1.05) return;

    const col = Math.floor(fx * COLS);
    const row = Math.floor(fy * ROWS);

    setCleared((prev) => {
      let next: boolean[] | null = null;
      // 3×3 brush → a swipe clears a fingertip-wide path.
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const c = col + dc;
          const r = row + dr;
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
          const idx = r * COLS + c;
          if (prev[idx]) continue;
          if (!next) next = [...prev];
          next[idx] = true;
        }
      }
      return next ?? prev;
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || revealed) return;
    drawingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    eraseAt(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current || disabled || revealed) return;
    eraseAt(e.clientX, e.clientY);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={surfaceRef}
        className="relative w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift"
        style={{ minHeight }}
      >
        {/* ── Prize layer (under the foil) ─────────────────────── */}
        <div
          className={cn('grid w-full place-items-center px-5 py-6', revealed ? 'bounce-in' : 'opacity-95')}
          style={{ minHeight }}
        >
          {children}
        </div>

        {/* ── Foil overlay ─────────────────────────────────────── */}
        <AnimatePresence>
          {!revealed && (
            <motion.div
              key="foil"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0"
              aria-hidden="true"
            >
              <div className="scratch-foil grid h-full w-full" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {cleared.map((isCleared, i) => (
                  <span key={i} className="transition-opacity duration-200" style={{ opacity: isCleared ? 0 : 1 }} />
                ))}
              </div>

              {/* Brush capture surface. */}
              <div
                role="presentation"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                onPointerCancel={stopDrawing}
                className={cn(
                  'absolute inset-0 touch-none',
                  disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                )}
              >
                <span className="shine pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 pb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-lift backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  {hintLabel}
                </span>
                {progressLabel && (
                  <span className="text-[11px] font-bold tabular-nums text-slate-700">{progressLabel(pct)}</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard / reduced-motion escape hatch. */}
      {!disabled && !revealed && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2.5 w-full"
          onClick={() => {
            setCleared(new Array(CELLS).fill(true));
            reveal();
          }}
        >
          {revealAllLabel ?? (reduce ? 'Reveal reward' : 'Reveal it for me')}
        </Button>
      )}
    </div>
  );
}

