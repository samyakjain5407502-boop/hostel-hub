'use client';

import { Building2, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { Footer } from '@/components/footer';
import { LandingNav } from '@/components/landing/nav';
import { HostelCard, type BranchStats } from '@/components/market/hostel-card';
import {
  BookingModal,
  GRACE_DAYS,
  TOKEN_AMOUNT,
  type BookingDraft,
  type BookingIntent
} from '@/components/market/booking-modal';
import { DirectoryFilters, useHostelFilters } from '@/components/market/filters';
import { useDb } from '@/lib/store';
import { useLang } from '@/i18n';
import { useToast } from '@/components/ui/toast';
import type { Branch, TokenBooking } from '@/types';

export default function HostelDirectoryPage() {
  const db = useDb();
  const toast = useToast();
  const { t } = useLang();
  const { query, setQuery, gender, setGender, food, setFood, bed, setBed, budget, setBudget, filtered } = useHostelFilters(db.branches);

  /** Which branch's booking modal is open, and the reservation once confirmed. */
  const [bookingBranchId, setBookingBranchId] = React.useState<string | null>(null);
  const [confirmed, setConfirmed] = React.useState<TokenBooking | null>(null);

  /** Bed availability + entry-level fee, derived once per branch. */
  const statsFor = React.useCallback(
    (branch: Branch): BranchStats => {
      const beds = db.beds.filter((b) => b.branchId === branch.id);
      return {
        vacant: beds.filter((b) => b.status === 'Vacant').length,
        total: beds.length,
        fromFee: branch.roomFees.length ? Math.min(...branch.roomFees.map((r) => r.monthlyFee)) : 0
      };
    },
    [db.beds]
  );

  /**
   * The reservation being drafted, rebuilt from the live store on every render.
   * Before confirming this is the next Vacant bed; afterwards it is the bed the
   * token is actually holding — so the modal keeps showing real data (and the
   * reduced vacancy count) while the confirmation card is on screen.
   */
  const draft = React.useMemo<BookingDraft | null>(() => {
    const branch = db.branches.find((b) => b.id === bookingBranchId);
    if (!branch) return null;
    const bed =
      (confirmed ? db.beds.find((b) => b.id === confirmed.bedId) : undefined) ??
      db.beds.find((b) => b.branchId === branch.id && b.status === 'Vacant');
    if (!bed) return null;
    const stats = statsFor(branch);
    return { branch, bed, vacant: stats.vacant, total: stats.total, fromFee: stats.fromFee };
  }, [bookingBranchId, confirmed, db.branches, db.beds, statsFor]);

  /** Sponsored placements float to the top — that is what the paid toggle buys. */
  const ordered = React.useMemo(
    () => [...filtered].sort((a, b) => Number(b.sponsored) - Number(a.sponsored)),
    [filtered]
  );

  /** "Book with ₹2,000 token" — opens the modal (no more one-click booking). */
  function openBooking(branch: Branch) {
    const vacantBed = db.beds.find((b) => b.branchId === branch.id && b.status === 'Vacant');
    if (!vacantBed) {
      toast.push({ title: t('admissions.noBed'), tone: 'warning' });
      return;
    }
    setConfirmed(null);
    setBookingBranchId(branch.id);
  }

  /**
   * Commit the reservation.
   * Two records, on purpose:
   *   1. `bookToken()` holds the bed (Vacant → Locked) — this is what reduces
   *      the "beds open" counter the card shows;
   *   2. `applyForHostel()` queues the walk-in so the management desk can see
   *      who is arriving and against which bed.
   */
  function handleConfirm(intent: BookingIntent): TokenBooking | null {
    const branch = db.branches.find((b) => b.id === bookingBranchId);
    const vacantBed = db.beds.find((b) => b.branchId === bookingBranchId && b.status === 'Vacant');
    if (!branch || !vacantBed) return null;

    const arrivalAt = intent.moveInDate
      ? new Date(`${intent.moveInDate}T00:00:00`).getTime()
      : Date.now() + GRACE_DAYS * 86_400_000;

    const booking = db.bookToken({
      applicationId: 'APP-WALKIN',
      branchId: branch.id,
      bedId: vacantBed.id,
      tokenAmount: TOKEN_AMOUNT,
      graceDays: GRACE_DAYS,
      expectedArrival: arrivalAt,
      reference: intent.reference,
      studentName: intent.studentName,
      studentMobile: intent.studentMobile,
      studentRoll: intent.studentRoll,
      collegeName: intent.collegeName,
      dietary: intent.diet,
      payment: intent.payment
    });
    if (!booking) return null;

    db.applyForHostel({
      studentName: intent.studentName,
      studentId: intent.studentRoll,
      aadhaarLast4: '0000',
      verified: false,
      branchId: branch.id,
      bedId: vacantBed.id
    });

    setConfirmed(booking);
    toast.push({
      title: t('market.tokenDone'),
      body: t('market.tokenNote', { days: booking.graceDays }),
      tone: 'success'
    });
    return booking;
  }

  function closeBooking() {
    setBookingBranchId(null);
    setConfirmed(null);
  }

  return (
    <div className="mesh-bg min-h-dvh">
      <LandingNav />

      <main id="main" className="mx-auto max-w-6xl px-5 py-10">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> {t('nav.hostels')}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{t('market.title')}</h1>
          <p className="mt-2 text-slate-500">{t('market.sub')}</p>
        </header>

        <div className="mt-7">
          <DirectoryFilters
            query={query} onQuery={setQuery}
            gender={gender} onGender={setGender}
            food={food} onFood={setFood}
            bed={bed} onBed={setBed}
            budget={budget} onBudget={setBudget}
            count={ordered.length}
          />
        </div>

        {ordered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-10 text-center text-sm text-slate-500">
            {t('market.noResults')}
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((branch) => (
              <HostelCard
                key={branch.id}
                branch={branch}
                stats={statsFor(branch)}
                onBook={openBooking}
                booking={false}
              />
            ))}
          </div>
        )}

        <p className="mt-8 flex items-start gap-2 rounded-2xl bg-white/70 px-4 py-3 text-xs text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
          {t('market.tokenNote', { days: GRACE_DAYS })}
        </p>
      </main>

      <BookingModal
        open={bookingBranchId !== null}
        draft={draft}
        confirmed={confirmed}
        onClose={closeBooking}
        onConfirm={handleConfirm}
        onOpenPortal={() => {
          window.location.href = '/auth/student';
        }}
      />

      <Footer />
    </div>
  );
}
