"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { getVerticalManifest } from "@/lib/verticals";

export default function CompanyWorkspacePage() {
  const params = useParams<{ companySlug: string }>();
  const router = useRouter();
  const { companies, company, setCompany } = useAuth();

  const matched = useMemo(
    () => companies.find((entry) => entry.slug === params.companySlug),
    [companies, params.companySlug],
  );

  useEffect(() => {
    if (!matched) return;
    if (company?.id !== matched.id) {
      setCompany(matched);
    }
  }, [matched, company?.id, setCompany]);

  if (!matched) {
    return (
      <PageContainer>
        <PageHeader title="Workspace not found" subtitle="Select a company you have access to." />
        <Button asChild>
          <Link href="/select-company">Choose company</Link>
        </Button>
      </PageContainer>
    );
  }

  const manifest = getVerticalManifest(matched.vertical);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={matched.name}
        subtitle={`${manifest.name} workspace`}
        action={<Button onClick={() => router.push("/dashboard")}>Open dashboard</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[12px] border border-border bg-background p-6">
          <h2 className="section-title mb-2">Enabled modules</h2>
          <p className="text-sm text-muted-fg mb-4">
            This workspace is driven by the installed vertical manifest for the selected company.
          </p>
          <div className="flex flex-wrap gap-2">
            {manifest.modules.map((module) => (
              <span key={module} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-fg">
                {module.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[12px] border border-border bg-background p-6">
          <h2 className="section-title mb-2">Launch flows</h2>
          <div className="space-y-2 text-sm">
            {manifest.navigation.slice(0, 6).map((item) => (
              <Link key={item.id} href={`/${item.href}`} className="flex items-center justify-between rounded-[8px] border border-border px-3 py-2 hover:bg-surface">
                <span>{item.label}</span>
                <span className="text-xs text-muted-fg">Open</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
