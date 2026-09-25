'use client';

/**
 * Meal activity bus (Phase 4).
 * ==================================================================
 * One place where "a student changed their plate" becomes a fact the rest of
 * the demo can react to — the student card, the student dashboard and the mess
 * operator console all read the same event.
 *
 * `emitMealActivity()` is called by `db.optMeal()` (see `store-api.tsx`), so the
 * publish happens at the data layer: any screen that toggles a meal produces the
 * event, not just the one component we remembered to wire up.
 *
 * The ingredient estimate travels *with* the event (computed by the shared
 * `projectedSaving()` helper), so the operator console and the student toast can
 * never disagree about the numbers.
 */

import * as React from 'react';
import { projectedSaving } from '@/lib/data/ingredients';
import { publish, subscribe } from './live-sync';
import type { MessSlot } from '@/types';

export const MEAL_ACTIVITY_CHANNEL = 'meal-activity';

/**
 * The demo resident every mock login signs in as.
 * Kept as a literal (rather than importing `DEMO_STUDENT`) because
 * `src/lib/auth.ts` throws at module scope when `AUTH_SECRET` is missing in live
 * mode — store code must not pull that into the browser bundle.
 */
export const DEMO_RESIDENT_ID = 'STU-23045';

/** Residents on roll — the full-batch baseline the savings estimate compares to. */
export const MESS_CAPACITY = 520;

export interface MealActivity {
  id: string;
  studentId: string;
  mealId: string;
  mealLabel: string;
  slot: MessSlot;
  choice: 'optin' | 'optout';
  at: number;
  /** Headcount after the change — the number the kitchen must cook for. */
  participating: number;
  optedOut: number;
  /** Recounted on every event: rupees + kg the mess no longer has to buy. */
  savings: { rupees: number; kg: number; skipped: number };
}

export interface MealActivityInput {
  mealId: string;
  mealLabel: string;
  slot: MessSlot;
  choice: 'optin' | 'optout';
  participating: number;
  optedOut: number;
  studentId?: string;
}

/** Build, estimate and broadcast one meal-attendance change. */
export function emitMealActivity(input: MealActivityInput): MealActivity {
  const activity: MealActivity = {
    mealId: input.mealId,
    mealLabel: input.mealLabel,
    slot: input.slot,
    choice: input.choice,
    participating: input.participating,
    optedOut: input.optedOut,
    studentId: input.studentId ?? DEMO_RESIDENT_ID,
    id: `act-${input.mealId}-${input.choice}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: Date.now(),
    savings: projectedSaving(input.slot, input.participating, MESS_CAPACITY)
  };
  publish(MEAL_ACTIVITY_CHANNEL, activity);
  return activity;
}

export interface MealActivityFeed {
  /** Newest first. */
  activities: MealActivity[];
  /** The most recent event, or `null` before any student acts. */
  latest: MealActivity | null;
}

/**
 * Subscribe to the activity bus.
 * React 18 StrictMode double-invokes effects in development; that is harmless
 * here because each subscription is closed by its own cleanup, and consumers
 * guard against re-handling the same `id`.
 */
export function useMealActivityFeed(limit = 6): MealActivityFeed {
  const [activities, setActivities] = React.useState<MealActivity[]>([]);

  React.useEffect(
    () =>
      subscribe<MealActivity>(MEAL_ACTIVITY_CHANNEL, (activity) => {
        setActivities((prev) => [activity, ...prev].slice(0, limit));
      }),
    [limit]
  );

  return { activities, latest: activities[0] ?? null };
}
