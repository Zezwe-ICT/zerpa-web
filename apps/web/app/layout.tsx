/**
 * @file app/layout.tsx
 * @description Root Next.js layout. Wraps the entire app in AuthProvider (global
 * auth state) and mounts the Sonner toast stack. Sets HTML metadata, Open Graph
 * tags and global CSS variables.
 */
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/context";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zerpa ERP",
    template: "%s | Zerpa ERP",
  },
  description: "Modern ERP platform for Funeral, Automotive, Restaurant & Spa industries",
  keywords: ["ERP", "CRM", "Billing", "Invoicing", "Business Management"],
  authors: [{ name: "Zerpa" }],
  creator: "Zerpa",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "Zerpa ERP",
    description: "Modern ERP platform for business management",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
