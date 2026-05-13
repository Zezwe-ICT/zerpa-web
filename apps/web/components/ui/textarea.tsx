/**
 * @file components/ui/textarea.tsx
 * @description Multi-line text input (textarea) with ZERPA design-system styling.
 * Forwards refs so it works with react-hook-form and other form libraries.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-[6px] border border-border bg-background text-foreground placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary-ring resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
