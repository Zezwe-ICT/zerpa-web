import assert from "node:assert/strict";
import { test } from "node:test";
import { buildNotificationEmail } from "./templates.ts";

test("customer mail has a pay button and no settings footer", () => {
  const built = buildNotificationEmail({
    audience: "customer",
    name: "Nomsa Mokoena",
    companyName: "Notify Co",
    subject: "You accepted QUO-1",
    body: "Please pay the deposit.",
    link: "http://localhost:3000/pay/abc",
    buttonLabel: "Pay the deposit",
  });
  assert.match(built.html, /Pay the deposit/);
  assert.doesNotMatch(built.html, /Settings → Notifications/);
  assert.match(built.text, /Pay the deposit: http:\/\/localhost:3000\/pay\/abc/);
});

test("staff mail still points back into Zerpa", () => {
  const built = buildNotificationEmail({
    name: "Owner",
    subject: "Quote accepted",
    body: "Open it.",
    link: "http://localhost:3000/billing/quotes/1",
  });
  assert.match(built.html, /Open in Zerpa/);
  assert.match(built.html, /Settings → Notifications/);
});
