'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Plus, Sparkles, Star } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { playChime } from '@/lib/celebration';
import type { FoodTag, GenderTag } from '@/types';

/**
 * Multi-property branch setup — the admin's real-estate ledger. Register a
 * new hostel property in one pass; it appears in the grid with its live bed
 * counts immediately (the store recomputes from the beds table).
 */
export default function BranchesPage() {
  const db = useDb();
  const toast = useToast();
  const { t, n } = useLang();
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [gender, setGender] = React.useState<GenderTag>('Boys');
  const [food, setFood] = React.useState<FoodTag>('Pure Veg');
  const [meals, setMeals] = React.useState('4');

  function register() {
    if (!name.trim()) return;
    const b = db.registerBranch({
      ownerId: db.owners[0]?.id ?? 'OWN-DEMO',
      name: name.trim(), gender, food, address: address.trim(),
      amenities: ['Wi-Fi', 'Laundry', 'RO Water'],
      mealsPerDay: Number(meals) || 4,
      roomFees: [{ config: '1-Bed', monthlyFee: 7800 }, { config: '2-Bed', monthlyFee: 4800 }, { config: '3-Bed', monthlyFee: 3900 }],
      sponsored: false
    });
    playChime();
    toast.push({ title: t('branches.created', { name: b.name }), body: b.id, tone: 'success' });
    setName(''); setAddress('');
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-extrabold text-slate-900">{t('branches.title')}</h1>
        <p className="mt-1 text-slate-600">{t('branches.sub')}</p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <CardHeader icon={<Plus className="h-5 w-5" />} title={t('branches.addTitle')} sub={t('branches.addSub')} />
          <div className="mt-4 grid gap-3">
            <div>
              <Label>{t('branches.name')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunrise Boys Hostel" />
            </div>
            <div>
              <Label>{t('branches.address')}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Scheme 54, Vijay Nagar" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label>{t('branches.gender')}</Label>
                <select value={gender} onChange={(e) => setGender(e.target.value as GenderTag)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500">
                  <option>Boys</option><option>Girls</option><option>Open to All</option>
                </select>
              </div>
              <div>
                <Label>{t('branches.food')}</Label>
                <select value={food} onChange={(e) => setFood(e.target.value as FoodTag)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500">
                  <option>Pure Veg</option><option>Non-Veg</option><option>Jain</option>
                </select>
              </div>
              <div><Label>{t('branches.meals')}</Label><Input value={meals} onChange={(e) => setMeals(e.target.value)} inputMode="numeric" /></div>
            </div>
            <Button className="w-full" disabled={!name.trim()} onClick={register}>
              <Building2 className="h-4 w-4" aria-hidden="true" /> {t('branches.register')}
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {db.branches.map((b) => {
              const beds = db.beds.filter((x) => x.branchId === b.id);
              const booked = beds.filter((x) => x.status === 'Booked').length;
              const occ = beds.length ? Math.round((booked / beds.length) * 100) : 0;
              return (
                <Card key={b.id} className="p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900">{b.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /> {b.address || b.id}
                      </p>
                    </div>
                    {b.sponsored && <Badge tone="violet" dot>{t('branches.sponsored')}</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="slate">{b.gender}</Badge>
                    <Badge tone="slate">{b.food}</Badge>
                    <Badge tone="slate">{b.mealsPerDay} {t('branches.mealsDay')}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                    <span className="font-bold text-slate-700">{booked}/{beds.length} {t('inventory.beds')} · {occ}%</span>
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" /> {b.rating.toFixed(1)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" /> {t('branches.autoBeds')}
          </p>
        </div>
      </div>
    </div>
  );
}

