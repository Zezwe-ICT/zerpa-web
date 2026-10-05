/**
 * Installable apps (Odoo-style). The catalogue lives in the API (apps/tenancy/app_catalog.py).
 */
import { apiRequest } from "./client";

export interface AppNavItem {
  label: string;
  href: string;
}

export interface CatalogApp {
  key: string;
  name: string;
  category: string;
  icon: string;
  tagline: string;
  description: string;
  depends: string[];
  nav: AppNavItem[];
  recommended: boolean;
  reason: string;
  installed: boolean;
}

export interface AppCatalog {
  categories: Array<{ key: string; label: string }>;
  apps: CatalogApp[];
  recommended: string[];
}

export interface CompanyApps extends AppCatalog {
  installed: string[];
  canManage: boolean;
  added?: string[];
  removed?: string[];
}

/** Fired after apps change so the sidebar can rebuild. */
export const APPS_CHANGED = "zerpa:apps-changed";

const hdr = (companyId: string) => ({ "X-Company-Id": companyId });

export const getAppCatalog = (vertical: string) =>
  apiRequest<AppCatalog>(`/apps/catalog?vertical=${encodeURIComponent(vertical || "GENERIC")}`);

export const getCompanyApps = (companyId: string) =>
  apiRequest<CompanyApps>(`/companies/${companyId}/apps`, { headers: hdr(companyId) });

export const changeCompanyApps = (companyId: string, body: { install?: string[]; uninstall?: string[] }) =>
  apiRequest<CompanyApps>(`/companies/${companyId}/apps`, { method: "POST", body, headers: hdr(companyId) });

/** Keys plus everything they depend on (mirrors the API so the UI can preview changes). */
export function withDependencies(keys: string[], apps: CatalogApp[]): string[] {
  const byKey = new Map(apps.map((a) => [a.key, a]));
  const wanted = new Set<string>();
  const stack = keys.filter((k) => byKey.has(k));
  while (stack.length) {
    const key = stack.pop()!;
    if (wanted.has(key)) continue;
    wanted.add(key);
    stack.push(...byKey.get(key)!.depends);
  }
  return apps.map((a) => a.key).filter((k) => wanted.has(k));
}

/** Installed apps that also go if `keys` are removed (including `keys`). */
export function dependentsOf(keys: string[], installed: string[], apps: CatalogApp[]): string[] {
  const byKey = new Map(apps.map((a) => [a.key, a]));
  const removing = new Set(keys);
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of installed) {
      if (!removing.has(key) && byKey.get(key)?.depends.some((d) => removing.has(d))) {
        removing.add(key);
        changed = true;
      }
    }
  }
  return installed.filter((k) => removing.has(k));
}
