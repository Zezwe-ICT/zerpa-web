/**
 * @file components/auth/progress-indicator.tsx
 * @description Visual step progress bar for the multi-step registration flow.
 * Renders coloured segment bars and labelled step indicators below them.
 */
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function ProgressIndicator({ currentStep, totalSteps, labels }: ProgressIndicatorProps) {
  return (
    <div className="w-full space-y-4">
      {/* Visual progress bar */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1 rounded-full transition-colors ${
              idx < currentStep ? "bg-primary" : idx === currentStep ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between text-xs font-medium text-muted-fg">
        {labels.map((label, idx) => (
          <span
            key={idx}
            className={idx < currentStep || idx === currentStep - 1 ? "text-foreground" : ""}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
