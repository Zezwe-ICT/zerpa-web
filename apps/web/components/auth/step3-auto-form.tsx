/**
 * @file components/auth/step3-auto-form.tsx
 * @description Step 3 details form for Automotive / Auto Shop vertical. Captures
 * mechanic count, monthly repair volume, workshop location and service types.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step3AutoFormProps {
  data: {
    mechanicsCount?: number;
    monthlyVolume?: number;
    workshopLocation?: string;
    serviceTypes?: string[];
    description?: string;
  };
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const SERVICE_TYPES = [
  { value: "maintenance", label: "Routine Maintenance" },
  { value: "repairs", label: "General Repairs" },
  { value: "diagnostics", label: "Diagnostics" },
  { value: "electrical", label: "Electrical Work" },
  { value: "bodywork", label: "Bodywork" },
  { value: "mechanical", label: "Mechanical Repairs" },
  { value: "welding", label: "Welding" },
];

export function Step3AutoForm({
  data,
  onChange,
  onSubmit,
  onBack,
  isLoading,
}: Step3AutoFormProps) {
  const toggleServiceType = (value: string) => {
    const current = data.serviceTypes || [];
    if (current.includes(value)) {
      onChange("serviceTypes", current.filter((s) => s !== value));
    } else {
      onChange("serviceTypes", [...current, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Auto Shop Details</h1>
        <p className="text-sm text-muted-fg">Help us configure Zerpa for your workshop</p>
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
            <Label htmlFor="mechanicsCount">Number of Mechanics</Label>
            <Input
              id="mechanicsCount"
              type="number"
              placeholder="e.g. 3"
              min="1"
              value={data.mechanicsCount || ""}
              onChange={(e) => onChange("mechanicsCount", parseInt(e.target.value) || undefined)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthlyVolume">Monthly Jobs</Label>
            <Input
              id="monthlyVolume"
              type="number"
              placeholder="e.g. 25"
              min="1"
              value={data.monthlyVolume || ""}
              onChange={(e) => onChange("monthlyVolume", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workshopLocation">Workshop Location</Label>
          <Input
            id="workshopLocation"
            type="text"
            placeholder="e.g. Johannesburg CBD"
            value={data.workshopLocation || ""}
            onChange={(e) => onChange("workshopLocation", e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Services You Offer</Label>
          <div className="space-y-2">
            {SERVICE_TYPES.map((service) => (
              <label key={service.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.serviceTypes || []).includes(service.value)}
                  onChange={() => toggleServiceType(service.value)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm font-medium">{service.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Tell us about your workshop</Label>
          <textarea
            id="description"
            placeholder="What's unique about your auto shop? What are your biggest operational challenges?"
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
