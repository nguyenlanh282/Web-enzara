/**
 * Format a number as Vietnamese Dong (VND) currency.
 * Uses dot as thousands separator, no decimal places.
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as compact VND (e.g., "85.000đ").
 */
export function formatVNDCompact(amount: number): string {
  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(amount) + "đ"
  );
}
