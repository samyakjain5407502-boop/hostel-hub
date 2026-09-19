'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input, TextArea, Label, inputBase } from '@/components/ui/field';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectIcon } from '@/components/ui/select';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { CATEGORIES, PRIORITIES } from './card';
import type { Category, Priority } from '@/types';
import { TAIL } from '@/lib/store';

export function NewComplaint({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const [category, setCategory] = React.useState<Category>('Room Maintenance');
  const [priority, setPriority] = React.useState<Priority>('Normal');
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [photo, setPhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCategory('Room Maintenance'); setPriority('Normal'); setTitle(''); setDesc(''); setPhoto(null);
    }
  }, [open]);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.push({ title: t('toast.fileType.title'), body: t('toast.fileType.body'), tone: 'warning' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => toast.push({ title: t('toast.fileError.title'), body: t('toast.fileError.body'), tone: 'warning' });
    reader.readAsDataURL(file);
  }

  function submit() {
    db.addComplaint({ category, priority, title, description: desc, author: 'Aarav Mehta', photo });
    onOpenChange(false);
    toast.push({
      title: t('toast.ticket.title'),
      body: t('toast.ticket.body', { status: t('complaints.status.Submitted'), points: TAIL.comp }),
      tone: 'success'
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxW="max-w-xl">
        <DialogTitle className="text-lg font-bold">{t('complaints.new')}</DialogTitle>
        <div className="px-5 pb-5 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{t('complaints.category')}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className={cn(inputBase, 'flex items-center justify-between')} aria-label={t('complaints.category')}>
                  <span className="min-w-0 flex-1 truncate text-sm text-left">{category}</span>
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('complaints.priority')}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className={cn(inputBase, 'flex items-center justify-between')} aria-label={t('complaints.priority')}>
                  <span className="min-w-0 flex-1 truncate text-sm text-left">{t(priority === 'Urgent' ? 'complaints.urgent' : 'complaints.normal')}</span>
                  <SelectIcon />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p === 'Urgent' ? `${t('complaints.urgent')} ⚡` : t('complaints.normal')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3.5">
            <Label>{t('complaints.titleField')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('complaints.titlePlaceholder')} />
          </div>
          <div className="mt-3.5">
            <Label>{t('complaints.describe')}</Label>
            <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('complaints.descPlaceholder')} />
          </div>

          <div className="mt-3.5">
            <Label>{t('complaints.attachPhoto')} · {t('common.optional')}</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600">
              {photo ? '✅ Photo attached — tap to change' : '📷 Upload photo proof'}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            {photo && <img src={photo} alt="preview" className="mt-1.5 max-h-24 rounded-lg border border-slate-200 object-cover" />}
          </div>

          <Button type="button" variant="primary" size="lg" className="mt-5 w-full" disabled={!title || !desc} onClick={submit}>
            {t('common.submit')} ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}