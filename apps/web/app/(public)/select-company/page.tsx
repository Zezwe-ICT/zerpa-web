/**
 * @file app/(public)/select-company/page.tsx
 * @description
 * Company selection page for users with multiple companies
 *
 * Purpose:
 * Allow users to choose which company to access when they have 2+ companies.
 * This page appears:
 * 1. After sign-in (if user has 2+ companies)
 * 2. After registration (if user just created their first company)
 *
 * Flow:
 * 1. User redirected to this page with 2+ companies
 * 2. Page loads companies from context or fetches from API if needed
 * 3. Page deduplicates companies (handles backend duplicates)
 * 4. User clicks "Enter" on a company
 * 5. selectCompany() called with company ID
 * 6. Context saves to localStorage and routes to /dashboard
 *
 * Key Features:
 * - Handles both registration and sign-in routes
 * - Auto-fetches companies via API if context is empty
 * - Client-side deduplication (Map by company name)
 * - Shows company vertical and role
 * - Shows workspace slug for URL reference
 * - Empty state: "Create Company" button if no companies
 * - Add company: Link to create additional company
 *
 * Deduplication Logic:
 * Backend sometimes returns duplicate companies with same name.
 * This page keeps only first occurrence per name using Map.
 * This prevents showing same company twice in UI.
 *
 * Network Handling:
 * - If context has companies, use them (no API call)
 * - If context empty, fetch from /companies API
 * - If fetch fails, show loading/empty screen with retry option
 * - Always ready to add companies via /onboarding
 *
 * Accessibility:
 * - Proper heading hierarchy (h1, h2)
 * - Keyboard navigable (tab through companies, enter to select)
 * - Icon labels (Building2 icon shows company context)
 * - Loading states clear (spinner + text)
 * - Empty state messaging helpful
 */

"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { MessageCircle, Building2 } from "lucide-react";
import { getCompanies } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/**
 * Component: SelectCompanyPage
 * 
 * Purpose:
 * Display list of companies user has access to and allow selection
 *
 * State:
 * - displayCompanies: Array of companies to show (from context or fetched)
 * - isFetching: Loading state for API fetch
 *
 * Context:
 * - companies: Companies from auth context (source of truth)
 * - selectCompany: Function to select company and route to dashboard
 * - isLoading: Global auth hydration status
 *
 * Router:
 * - Push to /dashboard after company selection
 * - Push to /onboarding for creating new company
 *
 * @component
 * @returns {React.ReactElement} - Company selection grid or empty state
 */
export default function SelectCompanyPage() {
  const { companies, selectCompany, isLoading } = useAuth();
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [displayCompanies, setDisplayCompanies] = useState(companies || []);

  /**
   * Effect: Fetch companies from API if context is empty
   * 
   * Purpose:
   * Handle both registration and sign-in routes:
   * - After registration: Companies fetched in register() context function
   * - After sign-in: signIn() function already fetches companies
   * 
   * But this effect acts as a safety net:
   * If user lands here and context is empty (race condition, cache miss, etc.),
   * fetch companies via API call.
   *
   * Logic:
   * 1. Check if companies in context is empty
   * 2. If empty: Fetch from API via getCompanies()
   * 3. If not empty: Use context companies
   * 4. Show loading spinner while fetching
   * 5. Update displayCompanies state
   * 6. Show empty state if no companies (prompts user to create)
   *
   * Dependencies:
   * - [companies]: Re-run if context companies change
   *
   * Time Complexity: O(n) for array copy, O(m) for API fetch
   * Space Complexity: O(n) for copy of companies array
   */
  useEffect(() => {
    const fetchCompaniesIfNeeded = async () => {
      // Check if we need to fetch (context empty)
      if (!companies || companies.length === 0) {
        setIsFetching(true);
        try {
          // Fetch from API
          const fetched = await getCompanies();
          const companiesList = Array.isArray(fetched) ? fetched : [];
          setDisplayCompanies(companiesList);
        } catch (err) {
          // Network/auth error, show empty state
          console.error("[SELECT-COMPANY] Failed to fetch companies:", err);
          setDisplayCompanies([]);
        } finally {
          setIsFetching(false);
        }
      } else {
        // Context has companies, use them
        setDisplayCompanies(companies);
      }
    };

    fetchCompaniesIfNeeded();
  }, [companies]);

  /**
   * Memo: Deduplicate companies by name
   * 
   * Purpose:
   * Backend sometimes returns duplicate companies with same name.
   * This could happen if:
   * - Company record was imported twice
   * - Sync error during company creation
   * - User invited to same company multiple times
   *
   * Deduplication Strategy:
   * Use Map with company name as key
   * Keep only first occurrence per name
   * Preserve all other data (id, vertical, role, slug)
   *
   * Algorithm:
   * 1. Init empty Map to track seen names
   * 2. For each company:
   *    - If name not in map: Add it
   *    - If name in map: Skip (keep first occurrence)
   * 3. Convert Map values back to array
   *
   * Why Map over Set:
   * Map stores name → company object
   * Need full company object for rendering, not just name
   *
   * Time Complexity: O(n) where n = number of companies
   * Space Complexity: O(n) for Map
   *
   * Notes:
   * - Case-sensitive match (ACME != acme)
   * - Whitespace-sensitive (ACME Co != ACME  Co)
   * - If duplicates need merging (e.g., combine roles), do here
   *
   * Dependencies:
   * - [displayCompanies]: Re-deduplicate when companies change
   *
   * @returns {Array} - Deduplicated companies array
   */
  const uniqueCompanies = useMemo(() => {
    if (!displayCompanies) return [];
    
    // Map: company name → company object
    const seen = new Map<string, typeof displayCompanies[0]>();
    
    // Keep only first occurrence per name
    for (const company of displayCompanies) {
      if (!seen.has(company.name)) {
        seen.set(company.name, company);
      }
    }
    
    return Array.from(seen.values());
  }, [displayCompanies]);

  // Loading state during hydration or fetch
  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {/* Spinner animation */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-fg">Loading companies...</p>
        </div>
      </div>
    );
  }

  // Empty state: No companies found
  // This happens when:
  // 1. User just registered but hasn't completed company creation
  // 2. User has no companies (but shouldn't happen after sign-in)
  if (!uniqueCompanies || uniqueCompanies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            {/* Empty state icon */}
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-fg" />
            <h1 className="text-2xl font-bold mb-2">No Companies</h1>
            <p className="text-muted-fg mb-6">
              You don't have any companies yet. Create one to get started.
            </p>
            {/* CTA: Create first company */}
            <Button onClick={() => router.push("/onboarding")} className="w-full">
              Create Company
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main layout: Company selection grid
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-4">
      <div className="w-full max-w-3xl">
        {/* Page heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Select Company</h1>
          <p className="text-muted-fg text-lg">
            You have access to {uniqueCompanies.length} compan
            {uniqueCompanies.length === 1 ? "y" : "ies"}. Choose which one you'd like to work on.
          </p>
        </div>

        {/* Companies grid (1 col on mobile, 2 cols on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {uniqueCompanies.map((company) => (
            <Card
              key={company.id}
              className="p-6 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
              onClick={() => selectCompany(company.id)}
            >
              {/* Company header with icon and name */}
              <div className="flex items-start gap-4 mb-4">
                {/* Icon badge */}
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Building2 size={24} className="text-primary" />
                </div>
                
                {/* Company info: name and vertical */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {company.name}
                  </h2>
                  {company.vertical && (
                    <p className="text-sm text-muted-fg capitalize mt-1">
                      {/* Replace underscores with spaces (FUNERAL_HOME → funeral home) */}
                      {company.vertical.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Company metadata: role and workspace slug */}
              <div className="space-y-2 mb-6">
                {/* User's role in this company */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-fg">Role</span>
                  <span className="font-medium text-foreground capitalize">
                    {/* Show OWNER as "Owner", capitalize other roles */}
                    {(company.role || "Member").toLowerCase()}
                  </span>
                </div>
                
                {/* Workspace identifier (URL slug) */}
                {company.slug && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-fg">Workspace</span>
                    <span className="font-mono text-xs text-muted-fg truncate ml-2">
                      {company.slug}
                    </span>
                  </div>
                )}
              </div>

              {/* Select company button */}
              <Button
                onClick={(e) => {
                  // Prevent event bubbling to parent Card click handler
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

        {/* Footer: Add another company */}
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
