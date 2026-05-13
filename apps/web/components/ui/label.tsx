/**
 * @file components/ui/label.tsx
 * @description Form Label component with ZERPA typography (semibold, sm, pointer).
 * Forwards refs; pair with Input or Select for accessible forms.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-semibold text-foreground cursor-pointer", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
