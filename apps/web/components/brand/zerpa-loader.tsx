/**
 * @file components/brand/zerpa-loader.tsx
 * @description The Zerpa mark, animated, for anything that makes people wait: creating a workspace, opening a
 * company, loading a page. The two halves of the Z slide together, then a light sweeps across; messages
 * underneath rotate so long waits feel like progress. CSS only, and still when "reduce motion" is on.
 */
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The Z mark as SVG (same shapes as /brand/zerpa-mark.png) so each half can move on its own. */
export function ZerpaMarkAnimated({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} className={cn("zl-mark", className)} aria-hidden="true">
      <defs>
        <linearGradient id="zl-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="zl-clip">
          <polygon points="0,0 256,0 128,128 0,128" />
          <polygon points="128,128 256,128 256,256 0,256" />
        </clipPath>
      </defs>
      <polygon className="zl-top" points="0,0 256,0 128,128 0,128" fill="#203b32" />
      <polygon className="zl-bottom" points="128,128 256,128 256,256 0,256" fill="#e1561b" />
      <g clipPath="url(#zl-clip)">
        <rect className="zl-sweep" x="-160" y="0" width="120" height="256" fill="url(#zl-sweep)" />
      </g>
    </svg>
  );
}

export interface ZerpaLoaderProps {
  /** The main line, e.g. "Creating your workspace". */
  title?: string;
  /** Smaller lines that rotate underneath while it's busy. */
  messages?: string[];
  /** Cover the whole screen (with a soft backdrop) instead of sitting in the page. */
  fullScreen?: boolean;
  size?: number;
  className?: string;
}

export function ZerpaLoader({ title = "Loading", messages = [], fullScreen = false, size = 44, className }: ZerpaLoaderProps) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % messages.length), 2400);
    return () => window.clearInterval(t);
  }, [messages.length]);

  const body = (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-5 text-center", !fullScreen && "py-16", className)}>
      {/* White tile so the green half stays visible in dark mode, like the app icon */}
      <span className="zl-tile inline-flex items-center justify-center rounded-[22%] bg-white shadow-sm ring-1 ring-black/5" style={{ padding: size * 0.22 }}>
        <ZerpaMarkAnimated size={size} />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">
          {title}
          <span className="zl-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </p>
        {messages.length > 0 && (
          <p key={i} className="zl-message text-sm text-muted-fg min-h-[1.25rem]">{messages[i]}</p>
        )}
      </div>
      <style>{LOADER_CSS}</style>
    </div>
  );

  if (!fullScreen) return body;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">{body}</div>;
}

/** A full-height loader for route segments (`loading.tsx`) and auth hydration. */
export function PageLoader({ title = "Loading", messages }: { title?: string; messages?: string[] }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ZerpaLoader title={title} messages={messages} />
    </div>
  );
}

const LOADER_CSS = `
.zl-mark { overflow: hidden; display: block; }
.zl-tile { animation: zl-breathe 2.4s ease-in-out infinite; }
@keyframes zl-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
.zl-top, .zl-bottom { transform-box: fill-box; transform-origin: center; }
.zl-top { animation: zl-top 2.4s cubic-bezier(.22,1,.36,1) infinite; }
.zl-bottom { animation: zl-bottom 2.4s cubic-bezier(.22,1,.36,1) infinite; }
.zl-sweep { animation: zl-sweep 2.4s ease-in-out infinite; }
.zl-dots span { animation: zl-dot 1.2s infinite; opacity: 0; }
.zl-dots span:nth-child(2) { animation-delay: .2s; }
.zl-dots span:nth-child(3) { animation-delay: .4s; }
.zl-message { animation: zl-in .35s ease-out both; }
/* The Z is whole on the first frame (short waits still show the logo): a light sweeps across,
   then the halves part and slide back together. */
@keyframes zl-top {
  0%, 50% { transform: translate(0, 0); opacity: 1; }
  68% { transform: translate(-16%, 0); opacity: .2; }
  88%, 100% { transform: translate(0, 0); opacity: 1; }
}
@keyframes zl-bottom {
  0%, 54% { transform: translate(0, 0); opacity: 1; }
  72% { transform: translate(16%, 0); opacity: .2; }
  92%, 100% { transform: translate(0, 0); opacity: 1; }
}
@keyframes zl-sweep { 0% { transform: translateX(0); } 42%, 100% { transform: translateX(560px); } }
@keyframes zl-dot { 0%, 20% { opacity: 0; } 40%, 100% { opacity: 1; } }
@keyframes zl-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .zl-top, .zl-bottom, .zl-sweep, .zl-message, .zl-tile { animation: none; opacity: 1; transform: none; }
  .zl-sweep { display: none; }
  .zl-dots span { animation: none; opacity: 1; }
}
`;
