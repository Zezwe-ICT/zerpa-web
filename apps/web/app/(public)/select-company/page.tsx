"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { MessageCircle, Building2 } from "lucide-react";
import { getCompanies } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function SelectCompanyPage() {
  const { companies, selectCompany, isLoading } = useAuth();
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [displayCompanies, setDisplayCompanies] = useState(companies || []);

  // Fetch companies on mount if not loaded
  useEffect(() => {
    const fetchCompaniesIfNeeded = async () => {
      if (!companies || companies.length === 0) {
        setIsFetching(true);
        try {
          const fetched = await getCompanies();
          const companiesList = Array.isArray(fetched) ? fetched : [];
          setDisplayCompanies(companiesList);
        } catch (err) {
          console.error("[SELECT-COMPANY] Failed to fetch companies:", err);
          setDisplayCompanies([]);
        } finally {
          setIsFetching(false);
        }
      } else {
        setDisplayCompanies(companies);
      }
    };

    fetchCompaniesIfNeeded();
  }, [companies]);

  // Deduplicate companies by name to handle backend duplicates
  const uniqueCompanies = useMemo(() => {
    if (!displayCompanies) return [];
    const seen = new Map<string, typeof displayCompanies[0]>();
    for (const company of displayCompanies) {
      if (!seen.has(company.name)) {
        seen.set(company.name, company);
      }
    }
    return Array.from(seen.values());
  }, [displayCompanies]);

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-fg">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (!uniqueCompanies || uniqueCompanies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-fg" />
            <h1 className="text-2xl font-bold mb-2">No Companies</h1>
            <p className="text-muted-fg mb-6">
              You don't have any companies yet. Create one to get started.
            </p>
            <Button onClick={() => router.push("/onboarding")} className="w-full">
              Create Company
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Select Company</h1>
          <p className="text-muted-fg text-lg">
            You have access to {uniqueCompanies.length} compan{uniqueCompanies.length === 1 ? "y" : "ies"}. Choose which one you'd like to work on.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {uniqueCompanies.map((company) => (
            <Card
              key={company.id}
              className="p-6 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
              onClick={() => selectCompany(company.id)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Building2 size={24} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {company.name}
                  </h2>
                  {company.vertical && (
                    <p className="text-sm text-muted-fg capitalize mt-1">
                      {company.vertical.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-fg">Role</span>
                  <span className="font-medium text-foreground capitalize">
                    {company.role || "Member"}
                  </span>
                </div>
                {company.slug && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-fg">Workspace</span>
                    <span className="font-mono text-xs text-muted-fg truncate ml-2">
                      {company.slug}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  selectCompany(company.id);
                }}
                className="w-full"
              >
                Enter →
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-fg mb-3">
            Need to create another company?
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/onboarding")}
            className="w-full max-w-xs"
          >
            + Add New Company
          </Button>
        </div>
      </div>
    </div>
  );
}
