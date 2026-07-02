/**
 * @file components/modules/billing/customer-select.tsx
 * @description Dropdown of billing customers (CLOSED_WON leads). Emits both the
 * id and the resolved BillingCustomer so editors can prefill contact details.
 */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { getBillingCustomers } from "@/lib/data/billing-customers";
import type { BillingCustomer } from "@zerpa/shared-types";

interface CustomerSelectProps {
  value: string;
  onChange: (id: string, customer: BillingCustomer | null) => void;
  id?: string;
  required?: boolean;
}

export function CustomerSelect({
  value,
  onChange,
  id = "customer",
  required,
}: CustomerSelectProps) {
  const { company } = useAuth();
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);

  useEffect(() => {
    getBillingCustomers(company?.id)
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, [company?.id]);

  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => {
        const next = customers.find((c) => c.id === e.target.value) ?? null;
        onChange(e.target.value, next);
      }}
      className="w-full h-10 rounded-[8px] border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">Select a customer…</option>
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
