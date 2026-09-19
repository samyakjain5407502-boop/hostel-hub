import type { DailyPlan, MessSlot, Meal } from '@/types';

const now = new Date();

/** Local date as yyyy-mm-dd */
function isoDay(offset: number): string {
  const d = new Date(now.getTime() + offset * 86_400_000);
  return dateKey(d);
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const TODAY_KEY: string = dateKey(now);

export const MEAL_SLOT_META: Record<MessSlot, { time: string; emoji: string }> = {
  breakfast: { time: '7:30 – 9:30', emoji: '🥞' },
  lunch: { time: '12:30 – 14:30', emoji: '🍛' },
  snacks: { time: '17:00 – 18:00', emoji: '☕' },
  dinner: { time: '19:30 – 21:30', emoji: '🍲' }
};

function meal(
  slot: MessSlot,
  label: string,
  status: Meal['status'],
  items: string[],
  credits: number,
  participating: number,
  optedOut: number,
  extra?: Partial<Meal>
): Meal {
  return {
    id: `${slot}-${label.toLowerCase().replace(/\W+/g, '-')}`,
    label,
    slot,
    time: MEAL_SLOT_META[slot].time,
    status,
    items,
    credits,
    veg: true,
    participating,
    optedOut,
    ratings: null,
    userOpt: null,
    ...extra
  };
}

const WEEK_MENUS: Record<MessSlot, string[][]> = {
  breakfast: [
    ['Poha', 'Jalebi', 'Bread Omlette', 'Banana', 'Masala Chai'],
    ['Idli Sambar', 'Coconut Chutney', 'Cornflakes', 'Milk', 'Coffee'],
    ['Aloo Paratha', 'Dahi', 'Pickle', 'Bread Butter', 'Green Tea'],
    ['Upma', 'Sev', 'Vada Bhaji', 'Boiled Egg', 'Masala Tea'],
    ['Chole Bhature', 'Onion Salad', 'Coconut Water', 'Milk', 'Coffee'],
    ['Dosa', 'Chutney', 'Sambar', 'Fruit Bowl', 'Masala Chai'],
    ['Puri Sabzi', 'Raita', 'Toast Jam', 'Banana Shake', 'Green Tea']
  ],
  lunch: [
    ['Dal Tadka', 'Jeera Rice', 'Paneer Butter Masala', 'Chapati', 'Salad', 'Gulab Jamun'],
    ['Rajma', 'Steamed Rice', 'Mixed Veg', 'Butter Chapati', 'Cucumber Raita', 'Kheer'],
    ['Chana Masala', 'Plain Rice', 'Bhindi Fry', 'Chapati', 'Green Salad', 'Ice Cream'],
    ['Dal Makhani', 'Saffron Rice', 'Veg Kofta', 'Butter Naan', 'Salad', 'Fruit Custard'],
    ['Sambar', 'Plain Rice', 'Aloo Gobi', 'Tandoori Roti', 'Papad', 'Moong Dal Halwa'],
    ['Kadhi Pakora', 'Steamed Rice', 'Palak Paneer', 'Chapati', 'Raita', 'Sheera'],
    ['Mixed Dal', 'Jeera Pulao', 'Malai Kofta', 'Chapati', 'Boondi Raita', 'Brownie']
  ],
  snacks: [
    ['Samosa (2)', 'Green Chutney', 'Masala Chai'],
    ['Vada Pav (2)', 'Tomato Ketchup', 'Cutting Chai'],
    ['French Fries', 'Garlic Chutney', 'Cold Coffee'],
    ['Meat Puff', 'Sweet Corn', 'Green Tea'],
    ['Onion Pakora', 'Mint Chutney', 'Masala Tea'],
    ['Bread Pakora', 'Tamarind Chutney', 'Milk Coffee'],
    ['Veg Burger', 'Fries', 'Cold Drink']
  ],
  dinner: [
    ['Dal Fry', 'Plain Rice', 'Lauki Kofta', 'Chapati', 'Fresh Salad', 'Moong Dal Soup'],
    ['Chole', 'Jeera Rice', 'Mix Paneer Bhurji', 'Missi Roti', 'Papaya', 'Tomato Soup'],
    ['Masoor Dal', 'Steamed Rice', 'Capsicum Paneer', 'Chapati', 'Raita', 'Veg Manchow Soup'],
    ['Kadhi', 'Rice', 'Aloo Jeera', 'Tandoori Roti', 'Salad', 'Cream of Corn Soup'],
    ['Dal Palak', 'Plain Rice', 'Mushroom Matar', 'Butter Chapati', 'Onion Salad', 'Hot & Sour Soup'],
    ['Rajma', 'Steamed Rice', 'Gobi Matar', 'Chapati', 'Boondi Raita', 'Mushroom Soup'],
    ['Dal Tadka', 'Veg Pulao', 'Shahi Paneer', 'Chapati', 'Salad', 'Mango Lassi']
  ]
};

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function buildPlan(offset: number): DailyPlan {
  const dow = (new Date().getDay() + offset) % 7;
  const idx = (dow + 6) % 7; // Rotate so weekdays feel fresh
  const [breakfast, lunch, snacks, dinner] = [
    WEEK_MENUS.breakfast[idx],
    WEEK_MENUS.lunch[idx],
    WEEK_MENUS.snacks[idx],
    WEEK_MENUS.dinner[idx]
  ];
  return {
    date: isoDay(offset),
    meals: [
      meal('breakfast', WEEKDAYS[idx] + ' Special Breakfast', 'upcoming', breakfast, 6, 328, 41),
      meal('lunch', 'Full Veg Thali', offset === 0 ? 'active' : 'upcoming', lunch, 10, 412, 37),
      meal('snacks', 'Evening Snacks', 'upcoming', snacks, 5, 256, 63),
      meal('dinner', 'Comfort Dinner', 'upcoming', dinner, 10, 389, 52)
    ]
  };
}

export function buildWeek(seedTodays: Meal[]): DailyPlan[] {
  const today: DailyPlan = { date: TODAY_KEY, meals: seedTodays };
  const rest = [1, 2, 3, 4, 5, 6].map(buildPlan);
  return [today, ...rest];
}