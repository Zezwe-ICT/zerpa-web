/**
 * @file components/motion-provider.tsx
 * @description App-wide Motion settings: every animation respects the OS "reduce motion" setting.
 */
"use client";

import { MotionConfig } from "motion/react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
