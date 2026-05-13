/**
 * @file components/ui/input.tsx
 * @description Text Input component with ZERPA design-system styling.
 * Forwards refs; supports all native input attributes.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-[6px] border border-border bg-background text-foreground placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary-ring",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
