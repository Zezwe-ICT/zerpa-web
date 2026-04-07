import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between border-b border-border pb-5 mb-6", className)}>
      <div>
        <h1 className="page-title text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-fg mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4 mt-1">{action}</div>}
    </div>
  );
}
