export const API = '/api';
export const TOKEN_KEY = 'chufa.token';
export const THEME_KEY = 'chufa.theme';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'staff' | 'admin' | string;
  points: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface MillDay {
  id: string;
  millDate: string;
  kgSoaked: number;
  litersYield: number;
  litersRemaining: number;
  status: string;
  soakNotes: Record<string, unknown> | null;
  photoUrl: string | null;
  litersRemainingLiters?: number;
  litersYieldLiters?: number;
  reviews?: Review[];
}

export interface Size {
  id: string;
  slug: string;
  name: string;
  ml: number;
  priceCents: number;
  blurb: string | null;
  photoUrl: string | null;
  active: boolean;
}

export interface Addon {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  stock: number;
  nutTags: string[] | null;
  photoUrl: string | null;
}

export interface CartLine {
  id: string;
  kind: string;
  refId: string | null;
  name: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  ml: number;
  photoUrl: string | null;
  stock: number | null;
}

export interface Cart {
  items: CartLine[];
  liveTotalCents: number;
  liveMl: number;
}

export interface OrderLine {
  id: string;
  kind: string;
  refId: string;
  nameSnapshot: string;
  unitPriceCents: number;
  qty: number;
  mlSnapshot: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  userId: string;
  millDayId: string;
  code: string;
  status: string;
  totalCents: number;
  totalMl: number;
  pointsAwarded: number;
  qrSvg: string | null;
  qrUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  lines: OrderLine[];
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
}

export interface StatPoint {
  date: string;
  litersYield: number;
  litersSold: number;
  yieldLiters: number;
  soldLiters: number;
}

export const ERROR_COPY: Record<string, string> = {
  MILL_DRY: 'El remojo de hoy no da para tantos litros. Baja la vasija.',
  MILL_CLOSED: 'Hoy la mola está cerrada.',
  ALREADY_QUEUED: 'Ya tienes un encargo vivo para este remojo.',
  NO_ADDON: 'Ese fartón se ha acabado. Quítalo de la bandeja.',
  ALREADY_PICKED_UP: 'Este pedido ya salió del mostrador.',
  NOT_READY: 'Aún se está moliendo. Espera a «listo».',
  TOO_LATE: 'Ya empezamos a moler; no se puede cancelar.',
  ALREADY_REVIEWED: 'Ya dejaste nota de este remojo.',
  NOT_FOUND: 'No hay un pedido con ese código.',
};

export function humanizeApiError(err: unknown): string {
  const e = err as { error?: { code?: string; message?: string }; message?: string };
  const code = e?.error?.code;
  if (code && ERROR_COPY[code]) return ERROR_COPY[code];
  const raw = e?.error?.message || e?.message || '';
  const stripped = String(raw).replace(/^[A-Z_]+:\s*/, '');
  if (stripped && ERROR_COPY[stripped]) return ERROR_COPY[stripped];
  return stripped || 'No pudimos hablar con la mola.';
}

export function eur(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function liters(ml: number): string {
  return (ml / 1000).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L';
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    paid: 'Cobrada',
    milling: 'Moliendo',
    ready: 'Lista',
    picked_up: 'Recogida',
    cancelled: 'Cancelada',
  };
  return map[s] || s;
}
