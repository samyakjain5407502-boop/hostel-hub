'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { RewardTxn } from '@/types';
import { load, persist, defaultSnapshot, type DbSnapshot } from './store-core';
import { buildApi } from './store-api';

export type DbApi = ReturnType<typeof buildApi>;
export type { PerkInline } from './store-api';
export { TAIL } from './store-core';

const Ctx = createContext<DbApi | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbSnapshot>(defaultSnapshot);

  // Hydrate from localStorage after mount so SSR markup stays deterministic.
  useEffect(() => {
    const stored = load();
    setDb((current) => (sameSnapshot(current, stored) ? current : stored));
  }, []);

  function commit(next: DbSnapshot) {
    setDb(next);
    persist(next);
  }

  function award(rewards: RewardTxn[], txn: RewardTxn): RewardTxn[] {
    return [txn, ...rewards].slice(0, 40);
  }

  const api: DbApi = buildApi(db, commit, award);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** Cheap identity check so the post-hydration load never causes a pointless re-render. */
function sameSnapshot(a: DbSnapshot, b: DbSnapshot): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

export function useDb(): DbApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDb must be used within <DbProvider>.');
  return ctx;
}