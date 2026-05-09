import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

/** Generate an order number like 20260510-ABC123 */
export function generateOrderNo(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}-${nano()}`;
}
