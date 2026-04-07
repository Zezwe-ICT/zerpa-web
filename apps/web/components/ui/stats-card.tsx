import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "red" | "violet" | "amber";
  trend?: { value: string; positive: boolean };
  className?: string;
}

const iconStyles = {
  blue: "bg-info-bg text-info",
  green: "bg-success-bg text-success",
  red: "bg-danger-bg text-danger",
  violet: "bg-funeral-bg text-funeral",
  amber: "bg-warning-bg text-warning",
};

export function StatsCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "blue",
  trend,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("rounded-[12px] border border-border bg-background p-5 shadow-xs", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">{label}</p>
        <span className={cn("rounded-[8px] p-2", iconStyles[iconColor])}>
          <Icon size={14} />
        </span>
      </div>
      <p className="mono font-semibold text-2xl tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-fg mt-1">{sub}</p>}
      {trend && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium mt-2 px-1.5 py-0.5 rounded-[4px]",
            trend.positive ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
          )}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
    </div>
  );
}
