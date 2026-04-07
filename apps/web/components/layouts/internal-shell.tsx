"use client";

import { InternalSidebar } from "./internal-sidebar";
import { InternalTopBar } from "./internal-top-bar";

interface InternalShellProps {
  children: React.ReactNode;
  topBarTitle?: string;
}

export function InternalShell({ children, topBarTitle }: InternalShellProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <InternalSidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <InternalTopBar title={topBarTitle} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
