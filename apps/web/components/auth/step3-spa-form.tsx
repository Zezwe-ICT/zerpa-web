/**
 * @file components/auth/step3-spa-form.tsx
 * @description Step 3 details form for Spa & Wellness vertical. Captures staff
 * count, services offered (multi-select), average bookings per week and description.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step3SpaFormProps {
  data: {
    staffCount?: number;
    servicesOffered?: string[];
    avgBookingsPerWeek?: number;
    description?: string;
  };
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const SERVICES = [
  { value: "massage", label: "Massage Therapy" },
  { value: "facials", label: "Facials / Skincare" },
  { value: "nails", label: "Nails (Manicure / Pedicure)" },
  { value: "hair", label: "Hair Services" },
  { value: "sauna", label: "Sauna / Steam" },
  { value: "waxing", label: "Waxing" },
  { value: "body-treatments", label: "Body Treatments" },
  { value: "wellness", label: "Wellness / Holistic" },
];

export function Step3SpaForm({
  data,
  onChange,
  onSubmit,
  onBack,
  isLoading,
}: Step3SpaFormProps) {
  const toggleService = (value: string) => {
    const current = data.servicesOffered || [];
    if (current.includes(value)) {
      onChange("servicesOffered", current.filter((s) => s !== value));
    } else {
      onChange("servicesOffered", [...current, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Spa / Wellness Details</h1>
        <p className="text-sm text-muted-fg">Help us customize Zerpa for your spa</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="staffCount">Therapists / Staff</Label>
            <Input
              id="staffCount"
              type="number"
              placeholder="e.g. 5"
              min="1"
              value={data.staffCount || ""}
              onChange={(e) => onChange("staffCount", parseInt(e.target.value) || undefined)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avgBookingsPerWeek">Avg Bookings/Week</Label>
            <Input
              id="avgBookingsPerWeek"
              type="number"
              placeholder="e.g. 35"
              min="1"
              value={data.avgBookingsPerWeek || ""}
              onChange={(e) => onChange("avgBookingsPerWeek", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Services You Offer</Label>
          <div className="space-y-2">
            {SERVICES.map((service) => (
              <label key={service.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.servicesOffered || []).includes(service.value)}
                  onChange={() => toggleService(service.value)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm font-medium">{service.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Tell us about your spa</Label>
          <textarea
            id="description"
            placeholder="What wellness services do you specialize in? What are your biggest operational challenges?"
            rows={3}
            value={data.description || ""}
            onChange={(e) => onChange("description", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
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
            disabled={isLoading}
          >
            {isLoading ? "Creating account…" : "Complete Setup"}
          </Button>
        </div>
      </form>
    </div>
  );
}
