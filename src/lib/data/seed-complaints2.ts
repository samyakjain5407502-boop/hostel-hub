// part 2 — remaining complaints
import type { Complaint } from '@/types';

const t = Date.now();
export const seedComplaints2: Complaint[] = [
  {
    id: 'CM-1028',
    category: 'Mess/Food Quality',
    title: 'Poha too oily this morning',
    description:
      'The breakfast poha had excess oil and very little lemon. A few students reported an upset stomach after. Requesting quality check.',
    status: 'Resolved',
    priority: 'Urgent',
    createdAt: t - 2 * (24 * 3_600_000),
    updatedAt: t - 24 * 3_600_000 - 4 * 3_600_000,
    assignee: 'Mess Committee — S. Warden',
    slaSeconds: 4 * 3_600_000,
    author: 'Ishita Verma',
    photo: '/complaints/poha.jpg',
    feedback: 'Cooked in a fresh batch with reduced oil. Quality check done. ✓',
    votes: 34
  },
  {
    id: 'CM-1022',
    category: 'Room Maintenance',
    title: 'Bed spring creaking / broken slats',
    description:
      'The slats under the lower bunk in Room 118 have come loose. The bed tilts to one side. Requesting a repair visit.',
    status: 'Submitted',
    priority: 'Urgent',
    createdAt: t - 2 * 3_600_000,
    updatedAt: t - 2 * 3_600_000,
    assignee: null,
    slaSeconds: 24 * 3_600_000,
    author: 'Tanvi Patel',
    photo: '/complaints/bed.jpg',
    votes: 2
  },
  {
    id: 'CM-1017',
    category: 'Hygiene/Cleaning',
    title: 'Lift lobby needs deep cleaning',
    description:
      'The 3rd floor lift lobby has a persistent odour and sticky floor stains near the dustbin corner.',
    status: 'Closed',
    priority: 'Normal',
    createdAt: t - 3 * 24 * 3_600_000,
    updatedAt: t - 2 * 24 * 3_600_000,
    assignee: 'Housekeeping — Ganesh',
    slaSeconds: 8 * 3_600_000,
    author: 'Rohit Kulkarni',
    photo: null,
    votes: 9
  }
];