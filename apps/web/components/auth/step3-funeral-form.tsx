import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step3FuneralFormProps {
  data: {
    staffCount?: number;
    monthlyVolume?: number;
    currentInvoicing?: string;
    painPoints?: string[];
    servicesOffered?: string[];
    description?: string;
  };
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const PAIN_POINTS = [
  { value: "manual-work", label: "Too much manual work" },
  { value: "poor-communication", label: "Poor client communication" },
  { value: "invoicing", label: "Invoicing challenges" },
  { value: "staff-coordination", label: "Staff coordination" },
  { value: "reporting", label: "Lack of reporting" },
  { value: "payment-tracking", label: "Payment tracking" },
];

const SERVICES = [
  { value: "burials", label: "Burials" },
  { value: "cremations", label: "Cremations" },
  { value: "embalming", label: "Embalming" },
  { value: "transfers", label: "Transfers" },
  { value: "repatriation", label: "Repatriation" },
];

const INVOICING_METHODS = [
  { value: "spreadsheet", label: "Spreadsheet (Excel/Google Sheets)" },
  { value: "manual", label: "Manual paper invoices" },
  { value: "basic-software", label: "Basic accounting software" },
  { value: "other", label: "Other" },
];

export function Step3FuneralForm({
  data,
  onChange,
  onSubmit,
  onBack,
  isLoading,
}: Step3FuneralFormProps) {
  const togglePainPoint = (value: string) => {
    const current = data.painPoints || [];
    if (current.includes(value)) {
      onChange("painPoints", current.filter((p) => p !== value));
    } else {
      onChange("painPoints", [...current, value]);
    }
  };

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
        <h1 className="text-2xl font-bold">Funeral Home Details</h1>
        <p className="text-sm text-muted-fg">Help us understand your operations</p>
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
            <Label htmlFor="staffCount">Staff Count</Label>
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
            <Label htmlFor="monthlyVolume">Monthly Cases</Label>
            <Input
              id="monthlyVolume"
              type="number"
              placeholder="e.g. 8"
              min="1"
              value={data.monthlyVolume || ""}
              onChange={(e) => onChange("monthlyVolume", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentInvoicing">Current Invoicing Method</Label>
          <select
            id="currentInvoicing"
            value={data.currentInvoicing || ""}
            onChange={(e) => onChange("currentInvoicing", e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select method</option>
            {INVOICING_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
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

        <div className="space-y-3">
          <Label>Current Pain Points</Label>
          <div className="space-y-2">
            {PAIN_POINTS.map((point) => (
              <label key={point.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.painPoints || []).includes(point.value)}
                  onChange={() => togglePainPoint(point.value)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm font-medium">{point.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Tell us more about your business</Label>
          <textarea
            id="description"
            placeholder="What makes your funeral home unique? Any specific challenges you'd like us to help with?"
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
