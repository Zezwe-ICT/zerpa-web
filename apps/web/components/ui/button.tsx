/**
 * @file components/ui/button.tsx
 * @description Polymorphic Button component with variant (default, outline, ghost,
 * destructive) and size (sm, md, lg, icon) props. Used everywhere across the app.
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-fg hover:bg-primary-hover",
    outline: "border border-border bg-background text-foreground hover:bg-surface",
    ghost: "text-foreground hover:bg-surface",
    destructive: "bg-danger text-white hover:bg-red-700",
  },
  size: {
    sm: "h-8 px-3 text-xs rounded-[6px]",
    md: "h-9 px-4 text-sm rounded-[6px]",
    lg: "h-10 px-6 text-base rounded-[6px]",
    icon: "h-9 w-9 rounded-[6px]",
  },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
