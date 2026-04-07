// Currency formatting utilities
export function formatCurrency(
  amount: number,
  currency: string = "ZAR",
  decimals: number = 2
): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatCurrencyShort(amount: number): string {
  const currency = formatCurrency(amount);
  // Remove "R" prefix for display in mono font contexts
  return currency.replace("R", "");
}

export function parseAmount(value: string | number): number {
  if (typeof value === "number") return value;
  return parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
}
