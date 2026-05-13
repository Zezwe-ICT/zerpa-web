/**
 * @file components/add-company-button.tsx
 * @description Thin wrapper button that opens AddCompanyModal on click.
 * Accepts an optional onSuccess callback and showLabel flag.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddCompanyModal } from "@/components/modals/add-company-modal";

interface AddCompanyButtonProps {
  onSuccess?: () => void;
  className?: string;
  showLabel?: boolean;
}

export function AddCompanyButton({
  onSuccess,
  className,
  showLabel = true,
}: AddCompanyButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowModal(true)}
        className={className}
      >
        <Plus className="w-4 h-4 mr-2" />
        {showLabel ? "Add Another Company" : "Add Company"}
      </Button>

      <AddCompanyModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={onSuccess}
      />
    </>
  );
}
