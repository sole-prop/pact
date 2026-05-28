/**
 * Deterministic, locale-agnostic number and currency formatters to prevent Next.js hydration mismatches.
 */

/**
 * Formats a number with comma separators for thousands (e.g. 165883 -> "165,883").
 */
export function formatNumber(val: number): string {
  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * Formats a currency value in Indian Crores (e.g. 76957000000 -> "₹7,695.7 Cr").
 */
export function formatGMV(val: number): string {
  const crores = val / 10000000;
  // Ensure we keep exactly 1 decimal place as requested
  const formatted = crores.toFixed(1);
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₹${parts.join(".")} Cr`;
}

/**
 * Formats standard currency style (e.g. "₹7,695.7").
 */
export function formatCurrency(val: number): string {
  return `₹${formatNumber(val)}`;
}
