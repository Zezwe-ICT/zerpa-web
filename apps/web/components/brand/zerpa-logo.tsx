import { cn } from "@/lib/utils";

/** The Z mark, or the full wordmark. Both sit on a transparent background. */
export function ZerpaLogo({
  variant = "lockup",
  className,
}: {
  variant?: "mark" | "lockup";
  className?: string;
}) {
  if (variant === "mark") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/brand/zerpa-mark.png" alt="Zerpa" className={cn("h-8 w-8", className)} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/zerpa-wordmark.png" alt="Zerpa" className={cn("h-9 w-auto", className)} />
  );
}
