import { redirect } from "next/navigation";

/** Polished mock route retired — use the Django-backed cases workspace. */
export default function FuneralCasesRedirect() {
  redirect("/cases");
}
