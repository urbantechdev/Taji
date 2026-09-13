import { AdminUser } from '../types';

/**
 * Generate a clean, responsive, local vector SVG avatar.
 * Eliminates all external mock images or unsplash dependencies.
 */
export const getInitialsAvatar = (name: string, bg: string = '#06163c'): string => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'NU';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="${bg}"/><circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="800" letter-spacing="1">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Official Whitelisted Admin Emails authorized for Enterprise ERP Dashboard access.
 * Only these designated Gmail accounts can access the backend dashboard,
 * inventory management, KRA eTIMS invoices, and production queues.
 *
 * Any other Gmail account automatically accesses the customer interface for checkout.
 */
export const WHITELISTED_ADMIN_EMAILS: string[] = [
  'naisiaetext@gmail.com',
  'urbaninteriorkenya@gmail.com',
  'veronicanjus@gmail.com',
  'nasisiknitwear.ke@gmail.com',
  'optimumengineeringke@gmail.com',
];

export const isWhitelistedAdminEmail = (emailOrStaffId: string | null | undefined): boolean => {
  if (!emailOrStaffId) return false;
  const normalized = emailOrStaffId.trim().toLowerCase();
  return WHITELISTED_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
};

export const ALLOWED_ADMIN_ACCOUNTS_INFO = [
  { email: 'naisiaetext@gmail.com', label: 'Primary Super Admin' },
  { email: 'urbaninteriorkenya@gmail.com', label: 'Urban Interior Kenya Admin' },
  { email: 'veronicanjus@gmail.com', label: 'Veronica Njus (Managing Director)' },
  { email: 'nasisiknitwear.ke@gmail.com', label: 'Nasisi Knitwear Executive' },
  { email: 'optimumengineeringke@gmail.com', label: 'Optimum Engineering Admin' },
];

/**
 * Clean initial admin users list. No mock or demo users.
 * Real staff users are loaded from Firebase Auth when logging in with Google
 * or created by verified administrators in the ERP User Manager.
 */
export const INITIAL_ADMIN_USERS: AdminUser[] = [];
