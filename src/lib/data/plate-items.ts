import type { MessSlot } from '@/types';
import type { TKey } from '@/i18n';

/**
 * Granular mess-plate components.
 *
 * The kitchen does not need to know *what* a student eats — only *how much*
 * to cook. Each slot therefore exposes the countable components a student can
 * tick off, which is what the headcount engine aggregates.
 */
export interface PlateComponent {
  /** i18n key for the human label. */
  key: TKey;
  /** Marks the component the mess always prepares a base quantity of. */
  staple?: boolean;
}

export const PLATE_COMPONENTS: Record<MessSlot, PlateComponent[]> = {
  breakfast: [
    { key: 'plate.item.roti', staple: true },
    { key: 'plate.item.sabji' },
    { key: 'plate.item.snack' },
    { key: 'plate.item.chai', staple: true }
  ],
  lunch: [
    { key: 'plate.item.roti', staple: true },
    { key: 'plate.item.sabji', staple: true },
    { key: 'plate.item.dal', staple: true },
    { key: 'plate.item.rice', staple: true },
    { key: 'plate.item.salad' },
    { key: 'plate.item.raita' }
  ],
  snacks: [
    { key: 'plate.item.snack', staple: true },
    { key: 'plate.item.chai' }
  ],
  dinner: [
    { key: 'plate.item.roti', staple: true },
    { key: 'plate.item.sabji', staple: true },
    { key: 'plate.item.dal' },
    { key: 'plate.item.rice', staple: true },
    { key: 'plate.item.salad' },
    { key: 'plate.item.soup' }
  ]
};

/** Default tick-off = every staple, so a student only opts *out* of extras. */
export function defaultPlateItems(slot: MessSlot): string[] {
  return PLATE_COMPONENTS[slot].filter((c) => c.staple).map((c) => c.key);
}

/** Sweet dish only exists on lunch & dinner service. */
export function slotHasSweet(slot: MessSlot): boolean {
  return slot === 'lunch' || slot === 'dinner';
}

/** Rupee value of one skipped meal — drives the absence deduction. */
export const MEAL_CREDIT_VALUE = 120;

/** Token amount that locks a bed, in rupees. */
export const TOKEN_AMOUNT = 2000;

/** Days a token booking holds a vacant bed before it lapses. */
export const GRACE_DAYS = 7;
