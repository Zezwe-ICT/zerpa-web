/**
 * @file components/modals/add-company-modal.tsx
 * @description Modal dialog for creating and adding a new company to the
 * authenticated user's account. Fields: company name, vertical, phone.
 * Calls createCompany() from lib/api/companies on submit.
 */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/hooks/use-toast";

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const VERTICALS = [
  { value: "FUNERAL", label: "Funeral Home" },
  { value: "AUTOMOTIVE", label: "Auto Shop" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "SPA", label: "Spa" },
];

export function AddCompanyModal({
  open,
  onOpenChange,
  onSuccess,
}: AddCompanyModalProps) {
  const { addCompany } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vertical: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.vertical) {
      toast({
        title: "Error",
        description: "Please select a business type",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await addCompany({
        name: formData.name.trim(),
        vertical: formData.vertical,
        phone: formData.phone.trim() || undefined,
      });

      toast({
        title: "Success",
        description: `${formData.name} has been created!`,
      });

      setFormData({ name: "", vertical: "", phone: "" });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Company</DialogTitle>
          <DialogDescription>
            Create another company to manage multiple business operations in ZERPA
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="Enter company name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isLoading}
              required
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="vertical">Business Type *</Label>
            <Select
              value={formData.vertical}
              onValueChange={(value) =>
                setFormData({ ...formData, vertical: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger id="vertical">
                <SelectValue placeholder="Select a business type" />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              placeholder="e.g., 012 345 6789"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
