/**
 * @file components/layouts/page-container.tsx
 * @description PageContainer constrains page content to a max width of 1280 px
 * and adds consistent horizontal/vertical padding. Wraps every page body.
 */
"use client";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("max-w-[1280px] mx-auto px-6 py-6", className)}>{children}</div>
  );
}
