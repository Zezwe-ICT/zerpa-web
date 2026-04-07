"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
  decimals?: number;
}

export function CurrencyDisplay({
  amount,
  currency = "ZAR",
  decimals = 2,
  className,
}: CurrencyDisplayProps) {
  return (
    <span className={cn("font-mono text-sm font-medium", className)}>
      {formatCurrency(amount, currency, decimals)}
    </span>
  );
}
