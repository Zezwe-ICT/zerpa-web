"use client";

import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/lib/api/books";
import { toast } from "sonner";

const FILES = [
  { provider: "sage", label: "Sage journal CSV" },
  { provider: "xero", label: "Xero journal CSV" },
  { provider: "pastel", label: "Pastel CSV" },
  { provider: "simplepay", label: "SimplePay people CSV" },
];

export default function AccountingPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Accounting export"
        subtitle="A file your accountant can import into Sage, Xero, Pastel, or SimplePay. Nothing is posted into those systems."
      />
      <div className="flex flex-wrap gap-2">
        {FILES.map((file) => (
          <Button
            key={file.provider}
            variant="outline"
            onClick={async () => {
              try {
                await downloadFile(`/billing/accounting/export?provider=${file.provider}`, `zerpa-${file.provider}.csv`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not download the file");
              }
            }}
          >
            {file.label}
          </Button>
        ))}
      </div>
    </PageContainer>
  );
}
