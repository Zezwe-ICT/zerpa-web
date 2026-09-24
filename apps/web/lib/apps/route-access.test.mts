import assert from "node:assert/strict";
import { test } from "node:test";
import { appForPath, blockedApp, isAlwaysOnPath } from "./route-access.ts";

const apps = [
  { key: "invoicing", name: "Quotes & Invoicing", hrefs: ["/billing/quotes", "/billing/invoices", "/billing/products", "/billing/reconcile"] },
  { key: "subscriptions", name: "Recurring Billing", hrefs: ["/billing/automated"] },
  { key: "funeral_cases", name: "Funeral Cases", hrefs: ["/cases"] },
];

test("a longer path wins over a shorter one", () => {
  assert.equal(appForPath("/billing/automated/new", apps)?.key, "subscriptions");
  assert.equal(appForPath("/billing/invoices/abc", apps)?.key, "invoicing");
  assert.equal(appForPath("/billing", apps)?.key, "invoicing");
});

test("settings and the dashboard stay open", () => {
  assert.equal(appForPath("/billing/settings", apps), null);
  assert.equal(isAlwaysOnPath("/settings/security"), true);
  assert.equal(blockedApp("/dashboard", apps, []), null);
});

test("an uninstalled app is blocked, including nested pages", () => {
  const installed = ["invoicing"];
  assert.equal(blockedApp("/cases", apps, installed)?.name, "Funeral Cases");
  assert.equal(blockedApp("/cases/abc", apps, installed)?.key, "funeral_cases");
  assert.equal(blockedApp("/billing/invoices", apps, installed), null);
  assert.equal(blockedApp("/billing/automated", apps, [])?.key, "subscriptions");
});
