'use client';

/**
 * College registry (3-portal architecture).
 * ==================================================================
 * Mock-mode persistence for the college directory:
 *  - directory colleges ship approved;
 *  - colleges a student adds via "+ Add My College Manually" land as
 *    `pending` and appear in the Super-Admin portal (/admin/colleges)
 *    for approval.
 *
 * Backed by localStorage in demo mode — swap the internals for a
 * Supabase table when the backend lands; the hook API stays the same.
 */

import * as React from 'react';
import type { College } from '@/types';
import { MOCK_COLLEGES } from '@/components/auth/college-select';

const LS_KEY = 'hostelhub.colleges.v1';

export interface CollegeEntry extends College {
  status: 'approved' | 'pending';
  source: 'directory' | 'manual';
  addedAt: number;
  addedBy?: string;
}

function seed(): CollegeEntry[] {
  return MOCK_COLLEGES.map((c) => ({
    ...c,
    status: 'approved' as const,
    source: 'directory' as const,
    addedAt: 0
  }));
}

export function loadColleges(): CollegeEntry[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as CollegeEntry[];
  } catch {
    /* corrupt cache — rebuild fresh */
  }
  return seed();
}

function persist(entries: CollegeEntry[]) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    /* quota errors are non-fatal in demo */
  }
}

/** Register a manually typed college as `pending` for Super-Admin approval. */
export function addPendingCollege(name: string, addedBy?: string): CollegeEntry | null {
  const clean = (name ?? '').trim();
  if (clean.length < 2) return null;
  const entries = loadColleges();
  const existing = entries.find((e) => e.name.toLowerCase() === clean.toLowerCase());
  if (existing) return existing;
  const entry: CollegeEntry = {
    id: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
    name: clean,
    status: 'pending',
    source: 'manual',
    addedAt: Date.now(),
    addedBy
  };
  persist([...entries, entry]);
  return entry;
}

/** Super-Admin action: approve a pending college into the sign-in directory. */
export function approveCollege(id: string): CollegeEntry[] {
  const entries = loadColleges().map((e) => (e.id === id ? { ...e, status: 'approved' as const } : e));
  persist(entries);
  return entries;
}

/** Super-Admin action: reject/remove a pending (or any) college entry. */
export function removeCollege(id: string): CollegeEntry[] {
  const entries = loadColleges().filter((e) => e.id !== id);
  persist(entries);
  return entries;
}

/** React binding — keeps admin + auth surfaces in sync via localStorage events. */
export function useCollegeRegistry() {
  const [colleges, setColleges] = React.useState<CollegeEntry[]>([]);
  const [ready, setReady] = React.useState(false);

  const refresh = React.useCallback(() => {
    setColleges(loadColleges());
    setReady(true);
  }, []);

  React.useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === LS_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return {
    colleges,
    ready,
    pending: colleges.filter((c) => c.status === 'pending'),
    approved: colleges.filter((c) => c.status === 'approved'),
    approve: (id: string) => setColleges(approveCollege(id)),
    remove: (id: string) => setColleges(removeCollege(id)),
    addPending: (name: string, addedBy?: string) => {
      addPendingCollege(name, addedBy);
      refresh();
    },
    refresh
  };
}
