/**
 * @file components/auth/step3-form.tsx
 * @description Step 3 dispatcher: routes to the correct vertical-specific details
 * form (funeral, auto, restaurant, spa) based on the selected vertical value.
 */
import { Step3FuneralForm } from "@/components/auth/step3-funeral-form";
import { Step3AutoForm } from "@/components/auth/step3-auto-form";
import { Step3RestaurantForm } from "@/components/auth/step3-restaurant-form";
import { Step3SpaForm } from "@/components/auth/step3-spa-form";
import { Button } from "@/components/ui/button";

interface Step3FormProps {
  vertical: string;
  data: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function Step3Form({
  vertical,
  data,
  onChange,
  onSubmit,
  onBack,
  isLoading,
}: Step3FormProps) {
  if (vertical === "FUNERAL") {
    return (
      <Step3FuneralForm
        data={data}
        onChange={onChange}
        onSubmit={onSubmit}
        onBack={onBack}
        isLoading={isLoading}
      />
    );
  }

  if (vertical === "AUTO") {
    return (
      <Step3AutoForm
        data={data}
        onChange={onChange}
        onSubmit={onSubmit}
        onBack={onBack}
        isLoading={isLoading}
      />
    );
  }

  if (vertical === "RESTAURANT") {
    return (
      <Step3RestaurantForm
        data={data}
        onChange={onChange}
        onSubmit={onSubmit}
        onBack={onBack}
        isLoading={isLoading}
      />
    );
  }

  if (vertical === "SPA") {
    return (
      <Step3SpaForm
        data={data}
        onChange={onChange}
        onSubmit={onSubmit}
        onBack={onBack}
        isLoading={isLoading}
      />
    );
  }

  // Fallback for other verticals
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Tell us more</h1>
        <p className="text-sm text-muted-fg">Provide details about your business</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">
            Tell us about your business
          </label>
          <textarea
            id="description"
            placeholder="What does your business do? What are your main challenges?"
            rows={5}
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
