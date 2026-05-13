/**
 * @file app/(public)/page.tsx
 * @description Root public page. Immediately redirects to /login.
 * Exists so the domain root (zerpa.co.za) lands on the login screen.
 */
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}
