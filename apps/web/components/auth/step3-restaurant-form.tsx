/**
 * @file components/auth/step3-restaurant-form.tsx
 * @description Step 3 details form for Restaurant / Hospitality vertical. Captures
 * restaurant type, average covers per day, event booking volume and cuisine types.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step3RestaurantFormProps {
  data: {
    restaurantType?: string;
    avgCoversPerDay?: number;
    eventBookingVolume?: number;
    cuisineTypes?: string[];
    description?: string;
  };
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const RESTAURANT_TYPES = [
  { value: "fine-dining", label: "Fine Dining" },
  { value: "casual", label: "Casual / family-friendly" },
  { value: "fast-food", label: "Fast Food / Quick Service" },
  { value: "cafe", label: "Cafe / Coffee Shop" },
  { value: "catering", label: "Catering / Events" },
  { value: "food-truck", label: "Food Truck" },
  { value: "buffet", label: "Buffet" },
  { value: "other", label: "Other" },
];

const CUISINE_TYPES = [
  { value: "south-african", label: "South African" },
  { value: "italian", label: "Italian" },
  { value: "asian", label: "Asian / Oriental" },
  { value: "mexican", label: "Mexican" },
  { value: "seafood", label: "Seafood" },
  { value: "steakhouse", label: "Steakhouse" },
  { value: "fusion", label: "Fusion" },
  { value: "vegetarian", label: "Vegetarian / Vegan" },
];

export function Step3RestaurantForm({
  data,
  onChange,
  onSubmit,
  onBack,
  isLoading,
}: Step3RestaurantFormProps) {
  const toggleCuisine = (value: string) => {
    const current = data.cuisineTypes || [];
    if (current.includes(value)) {
      onChange("cuisineTypes", current.filter((c) => c !== value));
    } else {
      onChange("cuisineTypes", [...current, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Restaurant Details</h1>
        <p className="text-sm text-muted-fg">Tell us about your dining establishment</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="restaurantType">Restaurant Type</Label>
          <select
            id="restaurantType"
            value={data.restaurantType || ""}
            onChange={(e) => onChange("restaurantType", e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select type</option>
            {RESTAURANT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="avgCoversPerDay">Avg Covers/Day</Label>
            <Input
              id="avgCoversPerDay"
              type="number"
              placeholder="e.g. 45"
              min="1"
              value={data.avgCoversPerDay || ""}
              onChange={(e) => onChange("avgCoversPerDay", parseInt(e.target.value) || undefined)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventBookingVolume">Monthly Event Bookings</Label>
            <Input
              id="eventBookingVolume"
              type="number"
              placeholder="e.g. 8"
              min="0"
              value={data.eventBookingVolume || ""}
              onChange={(e) => onChange("eventBookingVolume", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Cuisine Types</Label>
          <div className="space-y-2">
            {CUISINE_TYPES.map((cuisine) => (
              <label key={cuisine.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.cuisineTypes || []).includes(cuisine.value)}
                  onChange={() => toggleCuisine(cuisine.value)}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm font-medium">{cuisine.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Tell us about your restaurant</Label>
          <textarea
            id="description"
            placeholder="What's your restaurant's story? What are your operational needs?"
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
