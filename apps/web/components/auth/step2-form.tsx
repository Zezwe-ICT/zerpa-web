/**
 * @file components/auth/step2-form.tsx
 * @description Step 2 of the registration flow: captures company name, industry
 * vertical (FUNERAL | AUTO | RESTAURANT | SPA | …) and contact phone number.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VERTICALS = [
  { value: "", label: "Select industry" },
  { value: "FUNERAL", label: "Funeral Home" },
  { value: "AUTO", label: "Automotive / Auto Shop" },
  { value: "RESTAURANT", label: "Restaurant / Hospitality" },
  { value: "SPA", label: "Spa / Wellness" },
  { value: "TECH", label: "Technology / ICT" },
  { value: "TELECOM", label: "Telecommunications" },
  { value: "FINANCE", label: "Finance / Accounting" },
  { value: "RETAIL", label: "Retail" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "HEALTH", label: "Healthcare" },
  { value: "OTHER", label: "Other" },
];

interface Step2FormProps {
  companyName: string;
  phone: string;
  vertical: string;
  onCompanyNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onVerticalChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function Step2Form({
  companyName,
  phone,
  vertical,
  onCompanyNameChange,
  onPhoneChange,
  onVerticalChange,
  onNext,
  onBack,
  isLoading,
}: Step2FormProps) {
  const isValid = companyName.trim() && vertical;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Tell us about your business</h1>
        <p className="text-sm text-muted-fg">We'll personalize Zerpa for your industry</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isValid) onNext();
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="e.g. Dignity Funeral Home"
            required
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Contact Phone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. +27 12 345 6789"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
          <p className="text-xs text-muted-fg">We'll use this to contact you when needed</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vertical">Industry</Label>
          <select
            id="vertical"
            value={vertical}
            onChange={(e) => onVerticalChange(e.target.value)}
            required
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {VERTICALS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-fg">
            Choose the industry that best describes your business
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isLoading}
          >
            ← Back
          </Button>
          <Button
            type="submit"
            className="flex-1"
            size="lg"
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Loading…" : "Next →"}
          </Button>
        </div>
      </form>
    </div>
  );
}
