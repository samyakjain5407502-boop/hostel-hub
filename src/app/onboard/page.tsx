'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, Sparkles, UserCheck } from 'lucide-react';
import * as React from 'react';
import { Footer } from '@/components/footer';
import { LandingNav } from '@/components/landing/nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { AMENITY_OPTIONS, INDORE_BRANCH_PRESETS } from '@/lib/data/seed-hostels';
import { useDb } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useLang } from '@/i18n';
import type { FoodTag, GenderTag } from '@/types';

const GENDERS: GenderTag[] = ['Girls', 'Boys', 'Open to All'];
const FOODS: FoodTag[] = ['Jain', 'Pure Veg', 'Non-Veg'];
const FEE_CONFIGS = ['1-Bed', '2-Bed', '3-Bed', '4-Bed'] as const;

export default function OnboardPage() {
  const db = useDb();
  const toast = useToast();
  const { t, tr } = useLang();

  const [step, setStep] = React.useState(1);
  const [ownerId, setOwnerId] = React.useState<string | null>(null);
  const [doneBranchId, setDoneBranchId] = React.useState<string | null>(null);

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [age, setAge] = React.useState('');
  const [idLast4, setIdLast4] = React.useState('');

  const [branchName, setBranchName] = React.useState('');
  const [gender, setGender] = React.useState<GenderTag>('Boys');
  const [food, setFood] = React.useState<FoodTag>('Pure Veg');
  const [address, setAddress] = React.useState('');
  const [mealsPerDay, setMealsPerDay] = React.useState(3);

  const [fees, setFees] = React.useState<Record<string, string>>({ '2-Bed': '7200', '3-Bed': '5900' });
  const [amenities, setAmenities] = React.useState<string[]>(['amenities.wifi', 'amenities.hotWater']);
  const [sponsored, setSponsored] = React.useState(false);

  const stepValid = React.useMemo(() => {
    if (step === 1) {
      return (
        fullName.trim().length >= 3 &&
        /.+@.+\..+/.test(email.trim()) &&
        phone.trim().length >= 8 &&
        Number(age) >= 18 &&
        /^\d{4}$/.test(idLast4.trim())
      );
    }
    if (step === 2) {
      return branchName.trim().length >= 3 && address.trim().length >= 6 && mealsPerDay >= 1 && mealsPerDay <= 5;
    }
    return FEE_CONFIGS.some((c) => Number(fees[c]) > 0);
  }, [step, fullName, email, phone, age, idLast4, branchName, address, mealsPerDay, fees]);

  function handleKycNext() {
    if (!stepValid) return;
    const owner = db.registerOwner({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      age: Number(age),
      aadhaarLast4: idLast4.trim()
    });
    setOwnerId(owner.id);
    toast.push({ title: t('owner.verified'), tone: 'success' });
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePublish() {
    if (!stepValid || !ownerId) return;
    const roomFees = FEE_CONFIGS.filter((c) => Number(fees[c]) > 0).map((config) => ({
      config, monthlyFee: Number(fees[config])
    }));
    const branch = db.registerBranch({
      ownerId, name: branchName.trim(), gender, food,
      address: address.trim(), amenities, mealsPerDay, roomFees, sponsored
    });
    setDoneBranchId(branch.id);
    toast.push({ title: t('owner.published'), tone: 'success' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleAmenity(key: string) {
    setAmenities((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  }

  const steps = [t('owner.step1'), t('owner.step2'), t('owner.step3')];
  const stepIcons = [UserCheck, Building2, Sparkles];

  return (
    <div className="mesh-bg min-h-dvh">
      <LandingNav />
      <main id="main" className="mx-auto max-w-2xl px-5 py-10">
        <header className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> {t('nav.onboarding')}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{t('owner.title')}</h1>
          <p className="mt-2 text-slate-500">{t('owner.sub')}</p>
        </header>

        {doneBranchId ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
            <Card className="mt-7 p-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-success-50 text-success-600">
                <BadgeCheck className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">{t('owner.published')}</h2>
              <p className="mt-1 font-mono text-xs text-slate-400">{doneBranchId}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild><a href="/hostels">{t('market.viewAll')}</a></Button>
                <Button variant="outline" asChild><a href="/admin/admissions">{t('nav.admissions')}</a></Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-lift">
              <div className="flex items-center gap-2">
                {steps.map((label, i) => {
                  const n = i + 1;
                  const Icon = stepIcons[i];
                  const active = step === n;
                  const passed = step > n;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-1 items-center gap-2">
                        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl transition', passed ? 'bg-success-600 text-white' : active ? 'bg-brand-600 text-white shadow-soft' : 'bg-slate-100 text-slate-400')}>
                          {passed ? <Check className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                        </span>
                        <span className={cn('hidden text-xs font-semibold sm:block', active ? 'text-slate-900' : 'text-slate-400')}>{label}</span>
                      </div>
                      {n < 3 && <span className={cn('h-px w-4 shrink-0 sm:w-8', step > n ? 'bg-success-400' : 'bg-slate-200')} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="mt-3">
                <Progress value={step} max={3} tone="brand" label={t('owner.stepOf', { n: step })} size="sm" />
              </div>
              <p className="mt-1.5 text-center text-[11px] font-semibold text-slate-400">{t('owner.stepOf', { n: step })}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                {step === 1 && (
                  <Card className="mt-5">
                    <CardHeader icon={<UserCheck className="h-5 w-5" />} title={t('owner.step1')} sub={t('owner.idNote')} />
                    <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="ob-name">{t('owner.fullName')}</Label>
                        <Input id="ob-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rajesh Khanna" autoComplete="name" />
                      </div>
                      <div>
                        <Label htmlFor="ob-email">{t('owner.email')}</Label>
                        <Input id="ob-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@hostel.in" autoComplete="email" />
                      </div>
                      <div>
                        <Label htmlFor="ob-phone">{t('owner.contact')}</Label>
                        <Input id="ob-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98260 11223" autoComplete="tel" />
                      </div>
                      <div>
                        <Label htmlFor="ob-age">{t('owner.age')}</Label>
                        <Input id="ob-age" type="number" min={18} max={100} value={age} onChange={(e) => setAge(e.target.value)} placeholder="38" />
                      </div>
                      <div>
                        <Label htmlFor="ob-id">{t('owner.idLast4')}</Label>
                        <Input id="ob-id" inputMode="numeric" maxLength={4} value={idLast4} onChange={(e) => setIdLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4821" />
                      </div>
                    </div>
                    <Button onClick={handleKycNext} disabled={!stepValid} block className="mt-5">
                      {t('owner.verify')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Card>
                )}
                {step === 2 && (
                  <Card className="mt-5">
                    <CardHeader icon={<Building2 className="h-5 w-5" />} title={t('owner.step2')} />
                                        <div className="mt-4 grid gap-3.5">
                      <div>
                        <Label htmlFor="ob-branch">{t('owner.branchName')}</Label>
                        <Input id="ob-branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Sunrise Boys Wing" />
                      </div>
                      <div>
                        <Label htmlFor="ob-preset">Or pick an Indore preset</Label>
                        <select
                          id="ob-preset"
                          value=""
                          onChange={(e) => {
                            const p = INDORE_BRANCH_PRESETS.find((x) => x.name === e.target.value);
                            if (p) {
                              setBranchName(p.name);
                              setAddress(p.area);
                            }
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        >
                          <option value="" disabled>— Choose a preset —</option>
                          {INDORE_BRANCH_PRESETS.map((p) => (
                            <option key={p.name} value={p.name}>{p.name} — {p.area}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="ob-addr">{t('owner.address')}</Label>
                        <Input id="ob-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="14 Lake Road" />
                      </div>
                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div>
                          <Label>{t('market.filterGender')}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {GENDERS.map((g) => (
                              <button key={g} onClick={() => setGender(g)} aria-pressed={gender === g} className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition', gender === g ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                                {tr('tag.' + g)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>{t('market.filterFood')}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {FOODS.map((f) => (
                              <button key={f} onClick={() => setFood(f)} aria-pressed={food === f} className={cn('rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition', food === f ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                                {tr('tag.' + f)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ob-meals">{t('owner.mealsPerDay')}</Label>
                        <div className="flex items-center gap-3">
                          <input id="ob-meals" type="range" min={1} max={5} value={mealsPerDay} onChange={(e) => setMealsPerDay(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-brand-600" />
                          <Badge tone="brand">{mealsPerDay}/day</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('owner.back')}
                      </Button>
                      <Button onClick={() => stepValid && setStep(3)} disabled={!stepValid} className="flex-1">
                        {t('owner.next')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </Card>
                )}
                {step === 3 && (
                  <Step3Card
                    fees={fees} setFees={setFees} amenities={amenities}
                    toggleAmenity={toggleAmenity} sponsored={sponsored}
                    setSponsored={setSponsored} stepValid={stepValid}
                    onBack={() => setStep(2)} onPublish={handlePublish}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Step3Card({ fees, setFees, amenities, toggleAmenity, sponsored, setSponsored, stepValid, onBack, onPublish }: {
  fees: Record<string, string>;
  setFees: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  amenities: string[];
  toggleAmenity: (k: string) => void;
  sponsored: boolean;
  setSponsored: React.Dispatch<React.SetStateAction<boolean>>;
  stepValid: boolean;
  onBack: () => void;
  onPublish: () => void;
}) {
  const { t, tr } = useLang();
  return (
    <Card className="mt-5">
      <CardHeader icon={<Sparkles className="h-5 w-5" />} title={t('owner.step3')} />
      <div className="mt-4">
        <Label>{t('owner.fees')}</Label>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {FEE_CONFIGS.map((c) => (
            <div key={c} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
              <span className="w-14 shrink-0 text-xs font-bold text-slate-600">{tr('tag.' + c)}</span>
              <span className="text-sm text-slate-400">Rs</span>
              <input type="number" min={0} step={100} value={fees[c] ?? ''} onChange={(e) => setFees((p) => ({ ...p, [c]: e.target.value }))} placeholder="--" aria-label={tr('tag.' + c)} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-300" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <Label>{t('owner.amenities')}</Label>
        <div className="flex flex-wrap gap-1.5">
          {AMENITY_OPTIONS.map((a) => {
            const on = amenities.includes(a);
            return (
              <button key={a} onClick={() => toggleAmenity(a)} aria-pressed={on} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition', on ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
                {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {tr(a)}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={() => setSponsored((v) => !v)} aria-pressed={sponsored} className={cn('mt-4 flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition', sponsored ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-50')}>
        <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border', sponsored ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white text-transparent')}>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-800">{t('owner.sponsored')}</span>
          <span className="mt-0.5 block text-xs text-slate-500">{t('owner.sponsoredNote')}</span>
        </span>
      </button>
      <div className="mt-5 flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t('owner.back')}
        </Button>
        <Button onClick={onPublish} disabled={!stepValid} className="flex-1">
          {t('owner.addBranch')}
        </Button>
      </div>
    </Card>
  );
}

