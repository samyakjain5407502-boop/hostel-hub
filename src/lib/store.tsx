'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { RewardTxn } from '@/types';
import { load, persist, defaultSnapshot, LS, type DbSnapshot } from './store-core';
import { buildApi, hydrateFromLive } from './store-api';
import { isLiveMode } from './data-mode';
import { publish, subscribe, subscribeStorage } from './live-sync';

export type DbApi = ReturnType<typeof buildApi>;
export type { PerkInline } from './store-api';
export { TAIL } from './store-core';

const Ctx = createContext<DbApi | null>(null);

/** Live-sync channel carrying the whole demo snapshot between tabs (Phase 4). */
const DB_CHANNEL = 'db';

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DbSnapshot>(defaultSnapshot);

  // Hydrate from localStorage after mount so SSR markup stays deterministic.
  useEffect(() => {
    const stored = load();
    setDb((current) => (sameSnapshot(current, stored) ? current : stored));

    // LIVE (Phase 4): overlay the Supabase-backed slices (week / wallet /
    // rewards / complaints) onto the local snapshot. Guarded on isLiveMode()
    // so mock mode keeps byte-for-byte the behavior it has today (and the
    // overlay only applies if the user hasn't acted since `load()`).
    if (!isLiveMode()) return;
    let cancelled = false;
    hydrateFromLive(stored)
      .then((fresh) => {
        if (cancelled) return;
        setDb((current) =>
          !sameSnapshot(current, stored) ? current
            : sameSnapshot(current, fresh) ? current
              : fresh
        );
      })
      .catch((error) => {
        console.error('[live] hydration failed — keeping localStorage snapshot', error);
      });
    return () => { cancelled = true; };
  }, []);

  /**
   * Cross-tab sync (Phase 4, demo mode).
   * The demo is fully client-side, so "the mess console sees the student's
   * opt-out instantly" means: the second tab picks the snapshot up from
   * BroadcastChannel, or — on engines without it — straight from localStorage an
   * instant later via the `storage` event. Both paths are guarded with
   * `sameSnapshot()` so a remote snapshot can never trigger a render loop.
   */
  useEffect(() => {
    function apply(remote: DbSnapshot) {
      setDb((current) => (sameSnapshot(current, remote) ? current : remote));
    }
    const offChannel = subscribe<DbSnapshot>(DB_CHANNEL, apply, { includeSelf: false });
    const offStorage = subscribeStorage(LS, () => {
      const stored = load();
      setDb((current) => (sameSnapshot(current, stored) ? current : stored));
    });
    return () => {
      offChannel();
      offStorage();
    };
  }, []);

  function commit(next: DbSnapshot) {
    setDb(next);
    persist(next);
    /* Announce it; other tabs apply it, this tab ignores its own echo. */
    publish(DB_CHANNEL, next);
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