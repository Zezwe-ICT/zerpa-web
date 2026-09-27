"use client";

/**
 * @author: @dorianbaffier
 * @description: Hold Button
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Zerpa: hold-to-confirm for actions that can't be undone. Calls `onComplete` only after a full
 * hold; works with mouse, touch and keyboard (hold Space or Enter). Uses Zerpa's danger tokens.
 */

import { Trash2Icon } from "lucide-react";
import { motion, useAnimation } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HoldButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Called once the button has been held for the full duration. */
  onComplete: () => void;
  holdDuration?: number;
  label?: string;
  holdingLabel?: string;
  icon?: React.ReactNode;
}

export default function HoldButton({
  className,
  onComplete,
  holdDuration = 1500,
  label = "Hold to delete",
  holdingLabel = "Keep holding…",
  icon = <Trash2Icon className="h-4 w-4" />,
  disabled,
  ...props
}: HoldButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const controls = useAnimation();
  const holding = useRef(false);

  // A timer decides completion; the fill is only visual, so a throttled or reduced-motion
  // animation can never confirm early or get stuck.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleHoldStart() {
    if (disabled || holding.current) return;
    holding.current = true;
    setIsHolding(true);
    controls.set({ width: "0%" });
    controls.start({
      width: "100%",
      transition: { duration: holdDuration / 1000, ease: "linear" },
    });
    timer.current = setTimeout(() => {
      if (!holding.current) return;
      holding.current = false;
      setIsHolding(false);
      controls.stop();
      controls.set({ width: "0%" });
      onComplete();
    }, holdDuration);
  }

  function handleHoldEnd() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!holding.current) return;
    holding.current = false;
    setIsHolding(false);
    controls.stop();
    controls.start({ width: "0%", transition: { duration: 0.15 } });
  }

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex min-w-44 touch-none select-none items-center justify-center overflow-hidden rounded-[8px] border border-danger-ring bg-danger-bg px-4 py-2 text-sm font-medium text-danger transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      aria-label={`${label}. Press and hold to confirm.`}
      onPointerDown={handleHoldStart}
      onPointerLeave={handleHoldEnd}
      onPointerUp={handleHoldEnd}
      onPointerCancel={handleHoldEnd}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          handleHoldStart();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") handleHoldEnd();
      }}
      onBlur={handleHoldEnd}
      {...props}
    >
      <motion.span
        aria-hidden="true"
        animate={controls}
        className="absolute left-0 top-0 h-full bg-danger/20"
        initial={{ width: "0%" }}
      />
      <span className="relative z-10 flex w-full items-center justify-center gap-2">
        {icon}
        {isHolding ? holdingLabel : label}
      </span>
    </button>
  );
}
