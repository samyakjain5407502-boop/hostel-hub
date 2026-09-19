'use client';

/**
 * Mess-Operator console state (3-portal architecture).
 * ==================================================================
 * Demo-mode persistence for the operator's working data:
 *  - `availability`: which meal items the counter can serve right now
 *    (keyed `mealId::item`);
 *  - `scans`: the plate scan/verify journal;
 *  - `usedCodes`: plate codes already consumed at the counter.
 *
 * Backed by localStorage in demo mode — swap for Supabase/Prisma when
 * the backend lands; the hook API stays the same.
 */

import * as React from 'react';

const LS_KEY = 'hostelhub.operator.v1';

/** Plate codes "issued" to today's students (demo stand-in for QR scan). */
export const DEMO_PLATE_CODES = ['HH-8241', 'HH-5310', 'HH-9077', 'HH-1264'];

export interface ScanRecord {
  code: string;
  result: 'verified' | 'invalid' | 'reuse';
  at: number;
}

interface OperatorState {
  availability: Record<string, boolean>;
  scans: ScanRecord[];
}

function load(): OperatorState {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as OperatorState;
  } catch {
    /* corrupt cache — rebuild fresh */
  }
  return { availability: {}, scans: [] };
}

function persist(state: OperatorState) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* quota errors are non-fatal in demo */
  }
}

export function useOperatorState() {
  const [state, setState] = React.useState<OperatorState>({ availability: {}, scans: [] });
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  const update = React.useCallback((next: OperatorState) => {
    setState(next);
    persist(next);
  }, []);

  /** Toggle an item's availability for a given meal. */
  const toggleItem = React.useCallback((mealId: string, item: string) => {
    setState((prev) => {
      const key = `${mealId}::${item}`;
      const availability = { ...prev.availability, [key]: !(prev.availability[key] ?? true) };
      const next = { ...prev, availability };
      persist(next);
      return next;
    });
  }, []);

  const isAvailable = React.useCallback(
    (mealId: string, item: string) => state.availability[`${mealId}::${item}`] ?? true,
    [state.availability]
  );

  /** Verify a plate code at the counter; returns the result for the UI. */
  const scanPlate = React.useCallback((raw: string): ScanRecord['result'] => {
    const code = (raw ?? '').trim().toUpperCase();
    if (!DEMO_PLATE_CODES.includes(code)) {
      const record: ScanRecord = { code, result: 'invalid', at: Date.now() };
      setState((prev) => {
        const next = { ...prev, scans: [record, ...prev.scans].slice(0, 30) };
        persist(next);
        return next;
      });
      return 'invalid';
    }
    if (state.scans.some((s) => s.code === code && s.result === 'verified')) {
      const record: ScanRecord = { code, result: 'reuse', at: Date.now() };
      setState((prev) => {
        const next = { ...prev, scans: [record, ...prev.scans].slice(0, 30) };
        persist(next);
        return next;
      });
      return 'reuse';
    }
    const record: ScanRecord = { code, result: 'verified', at: Date.now() };
    setState((prev) => {
      const next = { ...prev, scans: [record, ...prev.scans].slice(0, 30) };
      persist(next);
      return next;
    });
    return 'verified';
  }, [state.scans]);

  return {
    ready,
    scans: state.scans,
    verifiedCount: state.scans.filter((s) => s.result === 'verified').length,
    toggleItem,
    isAvailable,
    scanPlate,
    demoCodes: DEMO_PLATE_CODES.filter((c) => !state.scans.some((s) => s.code === c && s.result === 'verified'))
  };
}
