/**
 * @file components/modules/dashboard/dashboard-greeting.tsx
 * @description Client component that renders a time-aware personalised greeting
 * on the internal dashboard ("Good morning/afternoon/evening, [FirstName]").
 * Reads the logged-in user's fullName from the AuthContext.
 */
"use client";

import { useAuth } from "@/lib/auth/context";

export function DashboardGreeting() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <p className="text-muted-fg text-sm">
      {greeting}, {firstName}. Here&apos;s what&apos;s happening today.
    </p>
  );
}
