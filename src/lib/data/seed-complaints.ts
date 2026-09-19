import type { Complaint } from '@/types';

const H = 3_600_000;
const DAY = 24 * H;
const now = Date.now();

export const seedComplaints: Complaint[] = [
  {
    id: 'CM-1042',
    category: 'Electrical',
    title: 'Ceiling fan speed switch not working',
    description:
      'The regulator for the ceiling fan in Room 204 is jammed at the lowest setting. It stays noisy and barely rotates even on high.',
    status: 'Technician Assigned',
    priority: 'Urgent',
    createdAt: now - 3 * H,
    updatedAt: now - 1 * H,
    assignee: 'R. Sharma (Electrician)',
    slaSeconds: 2 * H + 8 * 60,
    author: 'Aarav Mehta',
    photo: null,
    votes: 12
  },
  {
    id: 'CM-1039',
    category: 'Plumbing',
    title: 'Washbasin tap leak in boys cubicle',
    description:
      'The hot-water tap in the 1st floor washroom leaks continuously. Water is pooling near the drain and making the floor slippery.',
    status: 'In Review',
    priority: 'Normal',
    createdAt: now - 6 * H,
    updatedAt: now - 4 * H,
    assignee: null,
    slaSeconds: 6 * H + 12 * 60,
    author: 'Priya Nair',
    photo: '/complaints/tap.jpg',
    votes: 4
  },
  {
    id: 'CM-1031',
    category: 'Wi-Fi',
    title: 'Hostel-WiFi dropping every 10 mins',
    description:
      'Connection keeps disconnecting near Room 312. Works fine in the corridor, so it might be a weak signal or AP issue.',
    status: 'Resolved',
    priority: 'Normal',
    createdAt: now - 1 * DAY,
    updatedAt: now - 20 * H,
    assignee: 'IT Cell — D. Bhatt',
    slaSeconds: 5 * H,
    author: 'Kabir Singh',
    photo: '/complaints/wifi.png',
    votes: 21
  }
];