/**
 * Utility functions for formatting values
 */

/**
 * Format currency values with Nigerian Naira symbol
 */
export function formatCurrency(
  amount: number,
  options?: {
    showSymbol?: boolean;
    precision?: number;
  },
): string {
  const { showSymbol = true, precision = 2 } = options || {};

  const formatted = amount.toLocaleString('en-NG', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return showSymbol ? `₦${formatted}` : formatted;
}

/**
 * Format numbers with thousand separators
 */
export function formatNumber(value: number, precision = 0): string {
  return value.toLocaleString('en-NG', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, precision = 1): string {
  return `${value.toFixed(precision)}%`;
}
