'use client';

/**
 * Admin → Manage Colleges (3-portal architecture → /admin/colleges).
 * ------------------------------------------------------------------
 *  - "Add New College" dialog: admins create + publish colleges with full
 *    details (name, city, address, contact email).
 *  - Pending queue: student-requested colleges arrive flagged
 *    "Pending Approval" and can be Approved, Edited or Deleted.
 *  - Approved directory: live at student sign-in, editable/removable.
 */

import { motion } from 'framer-motion';
import { Building2, Check, Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogBody } from '@/components/ui/dialog';
import { inputBase } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import {
  useCollegeRegistry,
  type CollegeDetails,
  type CollegeEntry
} from '@/lib/college-registry';
import { cn } from '@/lib/utils';

const EMPTY_FORM: CollegeDetails = { name: '', city: '', address: '', contactEmail: '' };

export default function AdminCollegesPage() {
  const registry = useCollegeRegistry();
  const toast = useToast();

  /* Add / Edit dialog state (shared form). */
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CollegeEntry | null>(null);
  const [form, setForm] = React.useState<CollegeDetails>(EMPTY_FORM);
  const [nameError, setNameError] = React.useState(false);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNameError(false);
    setDialogOpen(true);
  }

  function openEdit(entry: CollegeEntry) {
    setEditing(entry);
    setForm(entry.details ?? { name: entry.name, city: '', address: '', contactEmail: '' });
    setNameError(false);
    setDialogOpen(true);
  }

  function save() {
    const name = form.name.trim();
    if (name.length < 2) {
      setNameError(true);
      toast.push({ title: 'College name is required', tone: 'warning' });
      return;
    }
    if (editing) {
      registry.update(editing.id, {
        name,
        details: { ...form, name }
      });
      toast.push({ title: `${name} updated`, tone: 'success' });
    } else {
      registry.create({ ...form, status: 'approved', source: 'directory' });
      toast.push({ title: `${name} published`, body: 'Students can now select it at sign-in.', tone: 'success' });
    }
    setDialogOpen(false);
  }

  function onApprove(id: string, name: string) {
    registry.approve(id);
    toast.push({ title: `${name} approved`, body: 'Students can now select it at sign-in.', tone: 'success' });
  }

  function onDelete(id: string, name: string) {
    registry.remove(id);
    toast.push({ title: `${name} deleted from the directory`, tone: 'warning' });
  }

  return (
    <div className="w-full max-w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              <Building2 className="h-7 w-7 text-brand-600" aria-hidden="true" /> Manage Colleges
            </h1>
            <p className="mt-1 text-slate-500">Add colleges directly, or review what students request.</p>
          </div>
          <Button variant="primary" onClick={openAdd} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add New College
          </Button>
        </div>
      </motion.div>

      {/* Pending queue — student-requested colleges awaiting review */}
      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader
          title="Pending Approval"
          sub={registry.ready ? `${registry.pending.length} student-requested college(s)` : 'Loading…'}
          icon={<Clock3 className="h-5 w-5" />}
        />
        {registry.ready && registry.pending.length === 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            No requests waiting — every student-requested college has been reviewed. 🎉
          </p>
        )}
        <ul className="mt-4 w-full max-w-full space-y-2">
          {registry.pending.map((c) => (
            <li key={c.id} className="flex w-full max-w-full flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{c.name}</span>
                <span className="block text-[11px] text-slate-500">
                  Requested by {c.addedBy ?? 'student'} · {new Date(c.addedAt).toLocaleString()}
                </span>
              </span>
              <Badge tone="amber" dot>Pending Approval</Badge>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="success" onClick={() => onApprove(c.id, c.name)}>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(c.id, c.name)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Approved directory — live at student sign-in */}
      <Card className="mt-6 w-full max-w-full p-5">
        <CardHeader title="Approved directory" sub={registry.ready ? `${registry.approved.length} colleges live at sign-in` : 'Loading…'} icon={<Check className="h-5 w-5" />} />
        <ul className="mt-4 grid w-full max-w-full gap-2 sm:grid-cols-2">
          {registry.approved.map((c) => (
            <li key={c.id} className="flex w-full max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-700">{c.name}</span>
                {c.details?.city && <span className="block text-[11px] text-slate-400">{c.details.city}</span>}
              </span>
              {c.source === 'manual' && <Badge tone="sky">requested</Badge>}
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  aria-label={`Edit ${c.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id, c.name)}
                  aria-label={`Delete ${c.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Add / Edit college dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent maxW="max-w-lg">
          <DialogHeader
            title={editing ? `Edit ${editing.name}` : 'Add New College'}
            desc={editing ? 'Update the college profile and save.' : 'Publish a college directly to the student sign-in directory.'}
            icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
          />
          <DialogBody>
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">College name *</span>
                <input
                  className={cn(inputBase, nameError && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100')}
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }));
                    setNameError(false);
                  }}
                  placeholder="e.g. Medi-Caps University"
                  required
                />
              </label>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">City</span>
                  <input
                    className={inputBase}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Indore"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">Contact email</span>
                  <input
                    className={inputBase}
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="admin@college.edu"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Address</span>
                <textarea
                  className={cn(inputBase, 'min-h-[72px] resize-y')}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Campus address…"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={save}>
                {editing ? 'Save changes' : 'Publish college'}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
