import type {
  Branch, FeeInvoice, OwnerProfile, RoomBed, StudentApplication, TokenBooking,
  BedConfig, GenderTag, FoodTag
} from '@/types';

const DAY = 86_400_000;
const now = Date.now();

export const AMENITY_OPTIONS = [
  'amenities.wifi',
  'amenities.hotWater',
  'amenities.cleaning',
  'amenities.induction',
  'amenities.chai',
  'amenities.laundry'
] as const;

export const INDORE_BRANCH_PRESETS = [
  { name: 'Vijay Nagar Premium Boys Hostel', area: 'Vijay Nagar, Near Scheme 54' },
  { name: 'Bhawarkua Scholar Girls PG', area: 'Bhawarkua, Near Devi Ahilya University' },
  { name: 'Sapphire Heights Student Living', area: 'AB Road, Rau Circle' },
  { name: 'Shree Residency Boys Hostel', area: 'Geeta Bhawan, A.B. Road' },
  { name: 'Lakeview Girls Hostel & PG', area: 'Vijay Nagar, Near Bombay Hospital' },
  { name: 'Sharma Boys Hostel Indore', area: 'Palasia, Near Treasure Island' }
] as const;

export const seedOwners = [
  {
    id: 'OWN-1001', fullName: 'Rajesh Khanna', email: 'rajesh@sunrisehostels.in',
    phone: '+91 98260 11223', age: 46, aadhaarLast4: '4821', verified: true,
    createdAt: now - 320 * DAY
  },
  {
    id: 'OWN-1002', fullName: 'Farah Sheikh', email: 'farah@greenviewpg.in',
    phone: '+91 99812 44556', age: 38, aadhaarLast4: '9034', verified: true,
    createdAt: now - 210 * DAY
  }
];

export const seedBranches: Branch[] = [
  {
    id: 'BR-SUN-BOYS', ownerId: 'OWN-1001', name: 'Sunrise Boys Wing',
    gender: 'Boys', food: 'Pure Veg', address: '14 Lake Road, Near Central Market',
    amenities: ['amenities.wifi', 'amenities.hotWater', 'amenities.cleaning', 'amenities.chai'],
    mealsPerDay: 3,
    roomFees: [
      { config: '1-Bed', monthlyFee: 9500 },
      { config: '2-Bed', monthlyFee: 7200 },
      { config: '3-Bed', monthlyFee: 5900 },
      { config: '4-Bed', monthlyFee: 4800 }
    ],
    sponsored: true, rating: 4.6, reviews: 212,
    photos: ['/hostels/sunrise-1.jpg', '/hostels/sunrise-2.jpg'],
    createdAt: now - 300 * DAY
  },
  {
    id: 'BR-SUN-GIRLS', ownerId: 'OWN-1001', name: 'Sunrise Girls Wing',
    gender: 'Girls', food: 'Jain', address: '16 Lake Road, Near Central Market',
    amenities: ['amenities.wifi', 'amenities.hotWater', 'amenities.cleaning', 'amenities.induction', 'amenities.laundry'],
    mealsPerDay: 4,
    roomFees: [
      { config: '1-Bed', monthlyFee: 10200 },
      { config: '2-Bed', monthlyFee: 7800 },
      { config: '3-Bed', monthlyFee: 6400 }
    ],
    sponsored: false, rating: 4.8, reviews: 186,
    photos: ['/hostels/girls-1.jpg'],
    createdAt: now - 295 * DAY
  },
  {
    id: 'BR-GREEN-A', ownerId: 'OWN-1002', name: 'Greenview Block A',
    gender: 'Open to All', food: 'Non-Veg', address: '7 Palm Avenue, Station Road',
    amenities: ['amenities.wifi', 'amenities.chai', 'amenities.laundry'],
    mealsPerDay: 2,
    roomFees: [
      { config: '2-Bed', monthlyFee: 6500 },
      { config: '3-Bed', monthlyFee: 5400 },
      { config: '4-Bed', monthlyFee: 4400 }
    ],
    sponsored: false, rating: 4.2, reviews: 98, photos: [],
    createdAt: now - 180 * DAY
  }
];