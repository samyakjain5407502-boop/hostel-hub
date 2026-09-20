import {
  BarChart3,
  BedDouble,
  Building2,
  Calculator,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Gift,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  QrCode,
  ScrollText,
  UserCheck,
  UtensilsCrossed,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import type { TKey } from '@/i18n';
import type { Role } from '@/types';
import { PORTAL_AUTH } from './portals';

/**
 * Portal presentation registry — one source of truth for how each of the four
 * portals looks, which sign-in route it owns and whether it is marketed
 * publicly.
 *
 * Consumers:
 *   • landing bento hub  → `PUBLIC_PORTALS` (student · operator · management)
 *   • landing nav menu   → `PORTAL_UI` (all four, so staff can reach their desk)
 *   • `/auth` portal hub → `PORTAL_UI` (all four, incl. Admin Command)
 *
 * Routes come from `lib/portals` (the RBAC registry the middleware mirrors);
 * labels come from the dictionaries, so nothing here is hard-coded copy.
 */
export interface PortalUi {
  role: Role;
  /** Sign-in route. */
  href: string;
  icon: LucideIcon;
  /** Icon-tile gradient. */
  accent: string;
  titleKey: TKey;
  descKey: TKey;
  /** Capability chips — real navigation strings, so they stay translated. */
  chips: { icon: LucideIcon; key: TKey }[];
  /** Landing bento placement at `lg` (only meaningful while publicFacing). */
  span: string;
  /** `true` = showcased on the public site; `false` = reachable via /auth only. */
  publicFacing: boolean;
}

export const PORTAL_UI: PortalUi[] = [
  {
    role: 'student',
    href: PORTAL_AUTH.student,
    icon: GraduationCap,
    accent: 'from-brand-600 to-violet-600',
    titleKey: 'portal.student',
    descKey: 'landing.portals.p1d',
    span: 'lg:col-span-7',
    publicFacing: true,
    chips: [
      { icon: LayoutDashboard, key: 'nav.dashboard' },
      { icon: UtensilsCrossed, key: 'nav.mess' },
      { icon: Gift, key: 'nav.rewards' },
      { icon: Wallet, key: 'nav.wallet' },
      { icon: QrCode, key: 'nav.gatepass' }
    ]
  },
  {
    role: 'operator',
    href: PORTAL_AUTH.operator,
    icon: ChefHat,
    accent: 'from-amber-500 to-orange-600',
    titleKey: 'portal.operator',
    descKey: 'landing.portals.p2d',
    span: 'lg:col-span-5',
    publicFacing: true,
    chips: [
      { icon: ClipboardList, key: 'nav.messConsole' },
      { icon: CalendarDays, key: 'nav.messMenu' },
      { icon: Calculator, key: 'nav.messIngredients' }
    ]
  },
  {
    role: 'management',
    href: PORTAL_AUTH.management,
    icon: Building2,
    accent: 'from-sky-500 to-indigo-600',
    titleKey: 'portal.management',
    descKey: 'landing.portals.p3d',
    span: 'sm:col-span-2 lg:col-span-12',
    publicFacing: true,
    chips: [
      { icon: UserCheck, key: 'nav.mgmtAdmissions' },
      { icon: BedDouble, key: 'nav.mgmtInventory' },
      { icon: ScrollText, key: 'nav.mgmtInvoices' }
    ]
  },
  {
    role: 'admin',
    href: PORTAL_AUTH.admin,
    icon: Landmark,
    accent: 'from-violet-600 to-fuchsia-600',
    titleKey: 'portal.admin',
    descKey: 'landing.portals.p4d',
    span: '',
    publicFacing: false,
    chips: [
      { icon: Building2, key: 'nav.adminBranches' },
      { icon: BarChart3, key: 'nav.adminAnalytics' },
      { icon: ScrollText, key: 'nav.logsAdmin' }
    ]
  }
];

/** Marketing-safe portals: student, mess operator and management desk. */
export const PUBLIC_PORTALS: PortalUi[] = PORTAL_UI.filter((portal) => portal.publicFacing);

/** Command-centre portals that must never be advertised on the public site. */
export const STAFF_PORTALS: PortalUi[] = PORTAL_UI.filter((portal) => !portal.publicFacing);
