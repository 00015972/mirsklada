// Utility functions for Mirsklada
import Decimal from 'decimal.js';

// ═══════════════════════════════════════════════════════════════
// WEIGHT UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Round weight to 2 decimal places (standard for kg)
 */
export function roundWeight(kg: number | Decimal): Decimal {
  return new Decimal(kg).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Format weight for display with kg suffix
 * @example formatWeight(12.5) => "12.50 kg"
 */
export function formatWeight(kg: number | Decimal): string {
  return `${roundWeight(kg).toFixed(2)} kg`;
}

/**
 * Calculate line total (weight × price per kg)
 */
export function calculateLineTotal(
  quantityKg: number | Decimal,
  pricePerKg: number | Decimal
): Decimal {
  const qty = new Decimal(quantityKg);
  const price = new Decimal(pricePerKg);
  return qty.times(price).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Validate weight is positive and has at most 2 decimal places
 */
export function isValidWeight(kg: number): boolean {
  if (kg <= 0) return false;
  const decimal = new Decimal(kg);
  return decimal.decimalPlaces() <= 2;
}

// ═══════════════════════════════════════════════════════════════
// CURRENCY UTILITIES (UZS - Uzbek Som)
// ═══════════════════════════════════════════════════════════════

/**
 * Format UZS currency with thousand separators
 * @example formatUZS(1500000) => "1 500 000 UZS"
 */
export function formatUZS(amount: number | bigint | Decimal): string {
  const num = typeof amount === 'bigint' 
    ? Number(amount) 
    : amount instanceof Decimal 
      ? amount.toNumber() 
      : amount;
  
  // Use space as thousand separator (common in Uzbekistan/Russia)
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(num));
  
  return `${formatted} UZS`;
}

/**
 * Format price with 2 decimal places
 * @example formatPrice(85000.5) => "85 000.50"
 */
export function formatPrice(amount: number | Decimal): string {
  const num = amount instanceof Decimal ? amount.toNumber() : amount;
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// ═══════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format date for Uzbekistan (DD.MM.YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time (DD.MM.YYYY HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// ═══════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a human-readable order number
 * @example generateOrderNumber() => "ORD-2026-0001"
 */
export function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequence).padStart(4, '0');
  return `ORD-${year}-${paddedSeq}`;
}

/**
 * Slugify a string (for tenant slugs, etc.)
 * @example slugify("My Business Name") => "my-business-name"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION UTILITIES
// ═══════════════════════════════════════════════════════════════

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Calculate skip value for database pagination
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
