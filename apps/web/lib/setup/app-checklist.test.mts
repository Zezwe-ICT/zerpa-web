import assert from "node:assert/strict";
import test from "node:test";
import { openSteps } from "./app-checklist.ts";

test("a hand-added customer does not finish the import step", () => {
  const steps = openSteps("customers", { customers: 6, importDone: false });
  assert.deepEqual(steps.map((step) => step.id), ["import"]);
});

test("customers checklist closes after a customer and a saved skip", () => {
  assert.deepEqual(openSteps("customers", { customers: 1, importDone: true }), []);
});

test("invoicing stays open for card payments when the bank account is already there", () => {
  const steps = openSteps("invoicing", {
    details: true,
    logo: true,
    bank: true,
    products: 1,
    quotes: 1,
    paymentsOn: false,
  });
  assert.deepEqual(steps.map((step) => step.id), ["payments"]);
});

test("a failed payments check does not invent an open step", () => {
  const steps = openSteps("invoicing", {
    details: true,
    logo: true,
    bank: true,
    products: 1,
    quotes: 1,
    paymentsOn: null,
  });
  assert.deepEqual(steps, []);
});

test("sales asks for stages and a lead only when both are missing", () => {
  assert.deepEqual(
    openSteps("sales", { leadStages: 0, leads: 0 }).map((step) => step.id),
    ["stages", "lead"],
  );
  assert.deepEqual(openSteps("sales", { leadStages: 4, leads: 2 }), []);
});
