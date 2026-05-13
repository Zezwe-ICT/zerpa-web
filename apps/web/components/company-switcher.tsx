/**
 * @file components/company-switcher.tsx
 * @description CompanySwitcher dropdown in the sidebar footer. Lists all companies
 * the user belongs to, lets them switch active company, and opens the
 * AddCompanyModal to create a new one.
 */
"use client";

import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownValue,
} from "@/components/ui/dropdown-menu";
import { Plus, Building2 } from "lucide-react";
import { useState } from "react";
import { AddCompanyModal } from "@/components/modals/add-company-modal";

export function CompanySwitcher() {
  const { company, companies, selectCompany } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  if (!company || companies.length <= 1) {
    return null;
  }

  return (
    <>
      <Dropdown value={company.id} onValueChange={selectCompany}>
        <DropdownTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline max-w-[200px] truncate">
              {company.name}
            </span>
            <span className="sm:hidden">{companies.length}</span>
          </Button>
        </DropdownTrigger>

        <DropdownContent align="end" className="w-56">
          <DropdownLabel>Your Companies</DropdownLabel>
          <DropdownSeparator />

          {companies.map((c) => (
            <DropdownItem key={c.id} value={c.id}>
              <div className="flex flex-col gap-0">
                <span className="font-medium">{c.name}</span>
                {c.vertical && (
                  <span className="text-xs text-gray-500 capitalize">
                    {c.vertical.replace("_", " ")}
                  </span>
                )}
              </div>
            </DropdownItem>
          ))}

          <DropdownSeparator />

          <DropdownItem
            value="__add_company__"
            onClick={() => setShowAddModal(true)}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </div>
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <AddCompanyModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          // Optionally handle success
          console.log("Company added successfully");
        }}
      />
    </>
  );
}
