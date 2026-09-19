'use client';

/**
 * College registry (3-portal architecture).
 * ==================================================================
 * Demo-mode persistence for the college directory:
 *  - directory colleges ship approved;
 *  - colleges a student adds via "+ Request My College" land as
 *    pending (flagged "Pending Approval") and appear in the Super-Admin's
 *    Manage Colleges section (/admin/colleges) for approve/edit/delete;
 *  - admins can also create + publish colleges directly with full details.
 *
 * Backed by localStorage in demo mode — swap the internals for a
 * Supabase table when the backend lands; the hook API stays the same.
 */

import * as React from 'react';
import type { College } from '@/types';
import { MOCK_COLLEGES } from '@/components/auth/college-select';

const LS_KEY = 'hostelhub.colleges.v1';

/** Full college profile an admin sets when creating or editing an entry. */
export interface CollegeDetails {
  name: string;
  city: string;
  address: string;
  contactEmail: string;
}

export interface CollegeEntry extends College {
  status: 'approved' | 'pending';
  source: 'directory' | 'manual';
  addedAt: number;
  addedBy?: string;
  /** Full profile — optional for the seeded directory entries. */
  details?: CollegeDetails;
}

function defaultDetails(name: string): CollegeDetails {
  return { name, city: '', address: '', contactEmail: '' };
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

/** Shared by the admin "Add New College" dialog and the student request flow. */
export function createCollege(
  input: Partial<CollegeDetails> & { name: string; status?: 'approved' | 'pending'; source?: 'directory' | 'manual'; addedBy?: string }
): CollegeEntry | null {
  const name = (input.name ?? '').trim();
  if (name.length < 2) return null;
  const entries = loadColleges();
  const existing = entries.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;

  const prefix = input.source === 'manual' ? 'MANUAL' : 'CLG';
  let id = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  while (entries.some((e) => e.id === id)) {
    id = `${prefix}-${(Date.now() + Math.floor(Math.random() * 1000)).toString(36).toUpperCase()}`;
  }

  const entry: CollegeEntry = {
    id,
    name,
    status: input.status ?? 'approved',
    source: input.source ?? 'directory',
    addedAt: Date.now(),
    addedBy: input.addedBy,
    details: {
      name,
      city: (input.city ?? '').trim(),
      address: (input.address ?? '').trim(),
      contactEmail: (input.contactEmail ?? '').trim()
    }
  };
  persist([...entries, entry]);
  return entry;
}

/** Student portal: flag a manually requested college as Pending Approval. */
export function addPendingCollege(name: string, addedBy?: string): CollegeEntry | null {
  return createCollege({ name, status: 'pending', source: 'manual', addedBy });
}

/** Super-Admin action: approve a pending college into the sign-in directory. */
export function approveCollege(id: string): CollegeEntry[] {
  const entries = loadColleges().map((e) => (e.id === id ? { ...e, status: 'approved' as const } : e));
  persist(entries);
  return entries;
}

/** Admin action: update a college's name/profile (pending or approved). */
export function updateCollege(
  id: string,
  patch: Partial<Omit<CollegeEntry, 'id' | 'addedAt'>>
): CollegeEntry[] {
  const entries = loadColleges().map((e) => {
    if (e.id !== id) return e;
    const merged: CollegeEntry = { ...e, ...patch };
    if (patch.details) merged.details = { ...defaultDetails(e.name), ...e.details, ...patch.details };
    if (typeof patch.name === 'string' && patch.name.trim()) {
      merged.name = patch.name.trim();
      merged.details = { ...defaultDetails(merged.name), ...e.details, name: merged.name };
    }
    return merged;
  });
  persist(entries);
  return entries;
}

/** Admin action: delete a college from the directory (any status). */
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
    update: (id: string, patch: Partial<Omit<CollegeEntry, 'id' | 'addedAt'>>) =>
      setColleges(updateCollege(id, patch)),
    addPending: (name: string, addedBy?: string) => {
      addPendingCollege(name, addedBy);
      refresh();
    },
    create: (input: Partial<CollegeDetails> & { name: string; status?: 'approved' | 'pending'; source?: 'directory' | 'manual'; addedBy?: string }) => {
      createCollege(input);
      refresh();
    },
    refresh
  };
}
