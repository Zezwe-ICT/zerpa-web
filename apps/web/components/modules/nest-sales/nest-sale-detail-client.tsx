"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { formatDate } from "@/lib/utils/dates";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { NestSale, ProvisioningChecklistItem } from "@zerpa/shared-types";

interface NestSaleDetailClientProps {
  sale: NestSale;
  initialChecklist: ProvisioningChecklistItem[];
}

export function NestSaleDetailClient({
  sale: initialSale,
  initialChecklist,
}: NestSaleDetailClientProps) {
  const [sale] = useState(initialSale);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const handleToggleItem = async (itemId: string) => {
    setCompletingId(itemId);
    try {
      // In mock mode, just update locally
      await new Promise((r) => setTimeout(r, 300));

      const updatedChecklist = checklist.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : undefined,
            completedBy: !item.completed ? "Current User" : undefined,
          };
        }
        return item;
      });

      setChecklist(updatedChecklist);
      const item = updatedChecklist.find((i) => i.id === itemId);
      const action = item?.completed ? "completed" : "marked incomplete";
      toast.success(`Checklist item ${action}`);
    } catch (error) {
      toast.error("Failed to update checklist");
      console.error(error);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/nest-sales">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={14} />
            Back to Nest Sales
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main Content (2 cols) */}
        <div className="col-span-2 space-y-6">
          {/* Provisioning Checklist */}
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="text-lg font-bold mb-4">Provisioning Checklist</h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-fg">
                  {completedCount} of {totalCount}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-[8px] border border-border hover:bg-muted/50 transition"
                >
                  <button
                    onClick={() => handleToggleItem(item.id)}
                    disabled={completingId === item.id}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition ${
                      item.completed
                        ? "bg-success border-success"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {item.completed && <Check size={14} className="text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={item.completed ? "line-through text-muted-fg" : ""}>
                      <p className="font-medium text-sm">{item.label}</p>
                    </div>
                    {item.completed && item.completedAt && (
                      <p className="text-xs text-muted-fg mt-1">
                        ✓ Completed{" "}
                        {formatDate(item.completedAt, "dd MMM yyyy 'at' HH:mm")}
                        {item.completedBy && ` by ${item.completedBy}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          {sale.status === "ACTIVE" && (
            <div className="rounded-[12px] border border-border bg-background p-6">
              <h2 className="text-lg font-bold mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-3 h-3 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Trial Started</p>
                    <p className="text-xs text-muted-fg">
                      {formatDate(sale.trialStartAt, "EEEE, d MMMM yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-3 h-3 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Trial Ended & Billing Started</p>
                    <p className="text-xs text-muted-fg">
                      {formatDate(sale.billingStartAt, "EEEE, d MMMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right - Sidebar (1 col) */}
        <div className="rounded-[12px] border border-border bg-background p-5 h-fit sticky top-24 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <span className="text-xs text-muted-fg uppercase tracking-wide font-semibold">
              Status
            </span>
            <StatusBadge status={sale.status} className="inline-block" />
          </div>

          {/* Divider */}
          <div className="border-t border-border my-2" />

          {/* Financials */}
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-fg">Setup Fee</dt>
              <dd className="font-mono font-semibold">
                <CurrencyDisplay amount={sale.setupFeeAmount} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-fg">Setup Paid</dt>
              <dd className={sale.setupFeePaid ? "text-success" : "text-danger"}>
                {sale.setupFeePaid ? "✓ Yes" : "✗ No"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="text-muted-fg">Monthly</dt>
              <dd className="font-mono font-semibold">
                <CurrencyDisplay amount={sale.monthlyAmount} />
              </dd>
            </div>
          </dl>

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Dates */}
          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-muted-fg mb-1">Trial Period</dt>
              <dd className="text-foreground">
                {formatDate(sale.trialStartAt, "dd MMM")} —{" "}
                {formatDate(sale.trialEndsAt, "dd MMM yyyy")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-fg mb-1">Billing Starts</dt>
              <dd className="text-foreground">
                {formatDate(sale.billingStartAt, "dd MMM yyyy")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </PageContainer>
  );
}
