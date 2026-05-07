"use client";

import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function SelectCompanyPage() {
  const { companies, selectCompany, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold mb-2">No Companies</h1>
            <p className="text-gray-600 mb-6">
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Company</h1>
          <p className="text-gray-600">
            You have access to {companies.length} compan{companies.length === 1 ? "y" : "ies"}. Choose which one you'd like to work on.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => selectCompany(company.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {company.name}
                  </h2>
                  {company.vertical && (
                    <p className="text-sm text-gray-500 capitalize">
                      {company.vertical.replace("_", " ")}
                    </p>
                  )}
                </div>
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
          <p className="text-sm text-gray-600 mb-3">
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
