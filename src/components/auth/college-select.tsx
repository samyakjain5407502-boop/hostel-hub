'use client';

/**
 * Searchable "Select College" combobox for the student sign-in form.
 * ------------------------------------------------------------------
 * Styling intentionally mirrors the shared `inputBase` recipe and the
 * dropdown surfaces used elsewhere (rounded-xl, slate border, brand-50
 * highlight), so the existing light/dark theme tokens apply unchanged.
 * The college directory is mock data for now — swap `MOCK_COLLEGES`
 * (or hydrate from a `/api/colleges` endpoint) when the backend lands.
 */

import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputBase } from '@/components/ui/field';
import type { College } from '@/types';

/** Mock directory — replace with a real API when available. */
export const MOCK_COLLEGES: College[] = [
  { id: 'CLG-ENG-01', name: 'College of Engineering' },
  { id: 'CLG-ART-02', name: 'Arts & Science College' },
  { id: 'CLG-MCU-03', name: 'Medi-Caps University' },
  { id: 'CLG-ITS-04', name: 'Institute of Technology & Science' },
  { id: 'CLG-GPC-05', name: 'Government Polytechnic College' }
];

export function CollegeSelect({ value, onChange, invalid = false }: {
  value: College | null;
  onChange: (college: College) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  /** Type-to-filter over name or id; empty query shows the whole list. */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_COLLEGES;
    return MOCK_COLLEGES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [query]);

  /* Click-away closes the options panel. */
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openList() {
    setQuery('');
    setActive(Math.max(0, MOCK_COLLEGES.findIndex((c) => c.id === value?.id)));
    setOpen(true);
  }

  function pick(college: College) {
    onChange(college);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) openList();
      else setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      /* Consume Enter while the list is open — it selects instead of submitting the form. */
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  /* Closed: show the selection. Open: show the search text. */
  const shown = open ? query : (value?.name ?? '');

  return (
    <div ref={rootRef} className="relative w-full max-w-full">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls="college-listbox"
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        required
        value={shown}
        onChange={(e) => {
          if (!open) openList();
          setQuery(e.target.value);
          setActive(0);
        }}
        onFocus={() => { if (!open) openList(); }}
        onKeyDown={onKeyDown}
        placeholder="Search your college…"
        className={cn(inputBase, 'pr-10', invalid && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100')}
      />
      <ChevronDown
        className={cn(
          'pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform',
          open && 'rotate-180'
        )}
        aria-hidden="true"
      />

      {open && (
        <ul
          id="college-listbox"
          role="listbox"
          aria-label="Colleges"
          className="absolute z-30 mt-1.5 max-h-56 w-full max-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-soft"
        >
          {filtered.length === 0 && (
            <li className="px-2.5 py-2 text-sm text-slate-400" aria-live="polite">
              No colleges match “{query}”.
            </li>
          )}
          {filtered.map((college, i) => {
            const selected = college.id === value?.id;
            return (
              <li key={college.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault() /* keep input focus so the list stays open */}
                  onClick={() => pick(college)}
                  onPointerMove={() => setActive(i)}
                  className={cn(
                    'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-800 outline-none transition',
                    i === active && 'bg-brand-50 text-brand-800'
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{college.name}</span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
