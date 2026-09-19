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

import { Check, ChevronDown, Plus, Undo2 } from 'lucide-react';
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
  /** `null` clears the selection (e.g. leaving manual-entry mode). */
  onChange: (college: College | null) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  /** Manual-entry mode — toggled by the "+ Add My College Manually" option. */
  const [manual, setManual] = React.useState(false);
  const [manualName, setManualName] = React.useState('');
  const [manualError, setManualError] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const manualRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (manual) manualRef.current?.focus();
  }, [manual]);

  /** Emit the typed college live once it is long enough to be meaningful. */
  function onManualChange(name: string) {
    setManualName(name);
    const clean = name.trim();
    if (clean.length >= 2) {
      setManualError(false);
      onChange({ id: 'MANUAL', name: clean, status: 'pending', source: 'manual' });
    } else {
      setManualError(clean.length > 0);
    }
  }

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
    setManual(false);
    setManualName('');
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

  /* Closed: show the selection. Open: show the search text (or the manual name). */
  const shown = open ? query : (manual ? manualName : (value?.name ?? ''));

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

          {/* Manual entry — always the last option in the list. */}
          <li role="option" aria-selected={manual} className="mt-1 border-t border-slate-200 pt-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                setManual(true);
                setManualName('');
                setManualError(false);
              }}
              className="flex w-full cursor-pointer select-none items-center gap-2 rounded-lg border border-dashed border-brand-300 px-2.5 py-1.5 text-left text-sm font-semibold text-brand-700 outline-none transition hover:bg-brand-50"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">Add My College Manually</span>
            </button>
          </li>
        </ul>
      )}

      {/* Manual-entry panel — the student types their college's exact name. */}
      {manual && (
        <div className="mt-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-brand-800">Add My College Manually</p>
            <button
              type="button"
              onClick={() => {
                setManual(false);
                setManualName('');
                setManualError(false);
                onChange(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Use list instead
            </button>
          </div>
          <input
            ref={manualRef}
            type="text"
            required
            value={manualName}
            onChange={(e) => onManualChange(e.target.value)}
            placeholder="e.g. Medi-Caps University"
            aria-label="College name"
            className={cn(inputBase, 'mt-2', manualError && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100')}
          />
          <p className="mt-1.5 text-[11px] text-slate-500">
            Your college is added as <span className="font-semibold text-amber-700">pending</span> and reviewed by the HostelHub management team.
          </p>
        </div>
      )}
    </div>
  );
}
