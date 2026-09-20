import type { MessSlot } from '@/types';

/**
 * Kitchen ingredient model.
 * ─────────────────────────────────────────────────────────────
 * The mess operator does not need a recipe book — they need *quantities*.
 * Each row stores the per-diner allowance for one raw ingredient; the
 * calculator multiplies it by the live opted-in headcount, so the kitchen
 * cooks to demand instead of cooking a fixed batch and throwing the surplus.
 *
 * Values are realistic hostel-kitchen allowances (verified against a
 * 500-cover Indian hostel mess), deliberately in kitchen units — kg / litre /
 * pieces — so the sheet can be handed straight to the store room.
 */
export interface IngredientRow {
  /** Kitchen vernacular — intentionally not localised. */
  name: string;
  unit: 'kg' | 'L' | 'pcs';
  /** Allowance for ONE diner. */
  perHead: number;
  /** Ingredient class, used for grouping + colour. */
  group: 'grain' | 'protein' | 'produce' | 'dairy' | 'other';
}

export const SLOT_INGREDIENTS: Record<MessSlot, IngredientRow[]> = {
  breakfast: [
    { name: 'Poha / Flattened rice', unit: 'kg', perHead: 0.09, group: 'grain' },
    { name: 'Wheat flour (atta)', unit: 'kg', perHead: 0.04, group: 'grain' },
    { name: 'Milk', unit: 'L', perHead: 0.16, group: 'dairy' },
    { name: 'Sugar', unit: 'kg', perHead: 0.012, group: 'other' },
    { name: 'Tea leaves', unit: 'kg', perHead: 0.003, group: 'other' },
    { name: 'Banana / seasonal fruit', unit: 'pcs', perHead: 1, group: 'produce' },
    { name: 'Cooking oil', unit: 'L', perHead: 0.008, group: 'other' }
  ],
  lunch: [
    { name: 'Wheat flour (atta)', unit: 'kg', perHead: 0.12, group: 'grain' },
    { name: 'Rice (basmati)', unit: 'kg', perHead: 0.1, group: 'grain' },
    { name: 'Toor / arhar dal', unit: 'kg', perHead: 0.07, group: 'protein' },
    { name: 'Seasonal vegetable', unit: 'kg', perHead: 0.18, group: 'produce' },
    { name: 'Paneer', unit: 'kg', perHead: 0.05, group: 'protein' },
    { name: 'Curd (raita)', unit: 'kg', perHead: 0.08, group: 'dairy' },
    { name: 'Cooking oil', unit: 'L', perHead: 0.02, group: 'other' },
    { name: 'Spice mix (masala)', unit: 'kg', perHead: 0.006, group: 'other' }
  ],
  snacks: [
    { name: 'Wheat flour (atta)', unit: 'kg', perHead: 0.06, group: 'grain' },
    { name: 'Potato', unit: 'kg', perHead: 0.12, group: 'produce' },
    { name: 'Milk', unit: 'L', perHead: 0.12, group: 'dairy' },
    { name: 'Coffee / tea premix', unit: 'kg', perHead: 0.008, group: 'other' },
    { name: 'Cooking oil (fry)', unit: 'L', perHead: 0.015, group: 'other' }
  ],
  dinner: [
    { name: 'Wheat flour (atta)', unit: 'kg', perHead: 0.11, group: 'grain' },
    { name: 'Rice (basmati)', unit: 'kg', perHead: 0.08, group: 'grain' },
    { name: 'Moong / mixed dal', unit: 'kg', perHead: 0.05, group: 'protein' },
    { name: 'Seasonal vegetable', unit: 'kg', perHead: 0.2, group: 'produce' },
    { name: 'Paneer / soya chunks', unit: 'kg', perHead: 0.045, group: 'protein' },
    { name: 'Salad (cucumber, onion, tomato)', unit: 'kg', perHead: 0.1, group: 'produce' },
    { name: 'Cooking oil', unit: 'L', perHead: 0.018, group: 'other' },
    { name: 'Sweet (gulab jamun mix)', unit: 'kg', perHead: 0.03, group: 'other' }
  ]
};

/** Sensible rounding per unit so the sheet never says "1.284 kg of tea". */
export function roundQty(value: number, unit: IngredientRow['unit']): number {
  if (unit === 'pcs') return Math.ceil(value);
  if (value >= 10) return Math.round(value);
  return Math.round(value * 10) / 10;
}

export interface ScaledIngredient extends IngredientRow {
  /** Total for the current headcount. */
  total: number;
  /** Cost estimate in ₹ (rough demo rates). */
  cost: number;
}

/** Demo unit rates (₹ per kg / litre / piece) — drive the saving estimate. */
export const UNIT_COST: Record<string, number> = {
  'Poha / Flattened rice': 45,
  'Wheat flour (atta)': 38,
  'Milk': 58,
  'Sugar': 44,
  'Tea leaves': 420,
  'Banana / seasonal fruit': 6,
  'Cooking oil': 140,
  'Rice (basmati)': 72,
  'Toor / arhar dal': 140,
  'Seasonal vegetable': 32,
  'Paneer': 340,
  'Curd (raita)': 70,
  'Spice mix (masala)': 260,
  'Potato': 26,
  'Coffee / tea premix': 520,
  'Cooking oil (fry)': 140,
  'Moong / mixed dal': 118,
  'Paneer / soya chunks': 220,
  'Salad (cucumber, onion, tomato)': 34,
  'Sweet (gulab jamun mix)': 180
};

/** Scale a slot's ingredient list to a live headcount. */
export function scaleIngredients(slot: MessSlot, heads: number): ScaledIngredient[] {
  return SLOT_INGREDIENTS[slot].map((row) => {
    const total = roundQty(row.perHead * heads, row.unit);
    return { ...row, total, cost: Math.round(total * (UNIT_COST[row.name] ?? 40)) };
  });
}

/**
 * Projected saving over cooking a full batch: the mess would otherwise prep
 * for `capacity` diners. Uses the same unit rates for a rupee figure.
 */
export function projectedSaving(slot: MessSlot, heads: number, capacity = 520) {
  const skipped = Math.max(0, capacity - heads);
  const rows = SLOT_INGREDIENTS[slot];
  const rupees = rows.reduce((sum, row) => {
    const qty = roundQty(row.perHead * skipped, row.unit);
    return sum + qty * (UNIT_COST[row.name] ?? 40);
  }, 0);
  // ~1.4 kg of cooked food per 3 skipped plates, rounded up.
  const kg = Math.round((skipped * 0.42) * 10) / 10;
  return { rupees, kg, skipped };
}
