"use client";

import { PageLoader } from "@/components/brand/zerpa-loader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { APPS_CHANGED, getCompanyApps, type CatalogApp } from "@/lib/api/apps";
import { blockedApp, isAlwaysOnPath, type AppRoute } from "@/lib/apps/route-access";

function toRoutes(apps: CatalogApp[]): AppRoute[] {
  return apps.map((app) => ({ key: app.key, name: app.name, hrefs: app.nav.map((item) => item.href) }));
}

/** Replaces the page when the address belongs to an app this company has switched off. */
export function AppRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { company } = useAuth();
  const [loaded, setLoaded] = useState<{ routes: AppRoute[]; installed: string[] } | null>(null);

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    const load = () =>
      getCompanyApps(company.id)
        .then((res) => {
          if (!cancelled) setLoaded({ routes: toRoutes(res.apps), installed: res.installed });
        })
        .catch(() => {
          if (!cancelled) setLoaded({ routes: [], installed: [] });
        });
    load();
    window.addEventListener(APPS_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(APPS_CHANGED, load);
    };
  }, [company?.id]);

  const blocked = loaded ? blockedApp(pathname, loaded.routes, loaded.installed) : null;
  if (!loaded && !isAlwaysOnPath(pathname)) {
    return <PageLoader />;
  }
  if (!blocked) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock size={20} className="text-muted-fg" />
      </div>
      <h1 className="text-xl font-semibold">{blocked.name} is switched off</h1>
      <p className="mt-2 text-sm text-muted-fg">
        This page is part of {blocked.name}, which is not installed for {company?.name || "this business"}.
        Turn the app on to open it. Anything you already saved stays put.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild>
          <Link href="/apps">Turn it on</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
