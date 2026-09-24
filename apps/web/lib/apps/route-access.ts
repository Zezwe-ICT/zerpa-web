/** Which installed app owns a staff URL, so switched-off apps cannot be opened by typing the address. */

export interface AppRoute {
  key: string;
  name: string;
  hrefs: string[];
}

const ALWAYS_ON = ["/dashboard", "/clients", "/apps", "/reports", "/settings", "/records", "/billing/settings", "/capture"];

export function isAlwaysOnPath(pathname: string): boolean {
  const path = clean(pathname);
  return ALWAYS_ON.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function clean(pathname: string): string {
  const path = pathname.split("?")[0].replace(/\/$/, "");
  return path || "/";
}

export function appForPath(pathname: string, apps: AppRoute[]): AppRoute | null {
  const path = clean(pathname);
  if (path === "/billing/settings" || path.startsWith("/billing/settings/")) return null;
  let best: AppRoute | null = null;
  let bestLen = 0;
  for (const app of apps) {
    for (const href of app.hrefs) {
      if (path === href || path.startsWith(`${href}/`)) {
        if (href.length > bestLen) {
          best = app;
          bestLen = href.length;
        }
      }
    }
  }
  if (!best && path === "/billing") {
    return apps.find((app) => app.key === "invoicing") ?? null;
  }
  return best;
}

/** The app that owns this path when it is not installed. Null means the page may open. */
export function blockedApp(pathname: string, apps: AppRoute[], installed: string[]): AppRoute | null {
  const owner = appForPath(pathname, apps);
  if (!owner || installed.includes(owner.key)) return null;
  return owner;
}
