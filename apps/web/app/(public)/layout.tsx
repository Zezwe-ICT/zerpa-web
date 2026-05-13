/**
 * @file app/(public)/layout.tsx
 * @description Layout for the public route group: /login, /register, /onboarding,
 * /select-company. No authentication required. Provides a full-height background wrapper.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
