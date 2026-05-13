/**
 * @file app/(client-portal)/layout.tsx
 * @description Root layout for the client-portal route group. Acts as a
 * transparent pass-through; each vertical sub-layout (funeral, automotive,
 * restaurant, spa) adds its own top nav and branding.
 */
export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
