/**
 * @file components/signature/signature-pad.tsx
 * @description Draw a signature (finger, pen or mouse) or type it. Reports a PNG data URL for a
 * drawn signature, or "typed" (the typed name is the signature).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignatureValue = { method: "drawn"; image: string } | { method: "typed" } | null;

export function SignaturePad({
  name,
  onChange,
  className,
}: {
  /** Shown as the typed signature. */
  name: string;
  onChange: (value: SignatureValue) => void;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  // A ref, not state: pointerup can fire before React re-renders after the last stroke.
  const inked = useRef(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [hasInk, setHasInk] = useState(false);

  // Size the canvas for the screen's pixel density so lines stay crisp.
  useEffect(() => {
    const c = canvas.current;
    if (!c || mode !== "draw") return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const { width, height } = c.getBoundingClientRect();
    c.width = Math.round(width * ratio);
    c.height = Math.round(height * ratio);
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16211d";
    inked.current = false;
    setHasInk(false);
    onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === "type") onChange(name.trim().length >= 2 ? { method: "typed" } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, name]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!inked.current) {
      inked.current = true;
      setHasInk(true);
    }
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (inked.current && canvas.current) onChange({ method: "drawn", image: canvas.current.toDataURL("image/png") });
  }
  function clear() {
    const c = canvas.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    inked.current = false;
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Signature *</span>
        <div className="flex gap-1 rounded-[8px] border border-border p-0.5 text-xs" role="tablist" aria-label="How to sign">
          {([["draw", "Draw", PenLine], ["type", "Type", Type]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={cn("flex items-center gap-1 rounded-[6px] px-2 py-1", mode === key ? "bg-primary-tint text-primary font-medium" : "text-muted-fg")}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "draw" ? (
        <div className="relative">
          <canvas
            ref={canvas}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
            aria-label="Draw your signature here"
            role="img"
            className="h-36 w-full touch-none rounded-[10px] border border-dashed border-border-2 bg-white cursor-crosshair"
          />
          {!hasInk && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              Sign here with your finger or mouse
            </span>
          )}
          <span className="pointer-events-none absolute left-4 right-4 bottom-8 border-b border-gray-300" aria-hidden="true" />
          {hasInk && (
            <button type="button" onClick={clear} className="absolute top-2 right-2 flex items-center gap-1 rounded-[6px] bg-white/90 px-2 py-1 text-xs text-gray-600 border border-gray-200">
              <Eraser size={12} /> Clear
            </button>
          )}
        </div>
      ) : (
        <div className="h-36 rounded-[10px] border border-dashed border-border-2 bg-white flex items-center justify-center px-4">
          <span className="text-4xl text-[#16211d] truncate" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic" }}>
            {name.trim() || "Type your name above"}
          </span>
        </div>
      )}
    </div>
  );
}
