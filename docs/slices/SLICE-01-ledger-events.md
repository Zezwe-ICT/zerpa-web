# SLICE-01 — Ledger event seam

**Goal:** every money-touching operation emits a structured, append-only ledger event. Accounting adapters become subscribers. Billing stops knowing that accounting exists.

**Why now:** cheap today, a rewrite of every money path later. See `docs/PLATFORM_ARCHITECTURE_SA.md` §2.2 and §4.

**Scope boundary:** this slice does **not** build a general ledger, journals, double-entry, trial balance or period close. It builds the event stream a future GL would consume.

## Assumptions to confirm before coding

Confirm against the running code; if any is wrong, say so and stop rather than guessing:

1. New Django app `apps.ledger`, or extend `apps.billing`? Brief assumes **new app `apps.ledger`** to keep billing free of accounting concerns.
2. Existing Sage/Xero export stubs live in `apps.billing` (or `apps.reporting`?). They must be **moved to subscribers**, not left calling billing internals.
3. Existing invoice/payment models and their field names — reuse, do not recreate.

## Models (`apps.ledger`)

**`LedgerEntry`** — append-only. No update path, no delete path. Corrections are new entries.

- `company` (FK, required, indexed) — isolation unit
- `event_type` — enum: `invoice_issued`, `credit_note_raised`, `payment_received`, `payment_allocated`, `collection_failed`, `collection_reversed`, `stock_consumed`, `stock_revalued`, `write_off`
- `occurred_at` (business date), `recorded_at` (system time) — keep both, they diverge
- `source_content_type` / `source_object_id` — generic FK to the originating document
- `idempotency_key` — unique per (company, event_type, source). Re-emitting must not duplicate.
- `currency` (default ZAR), `lines` (JSON or related `LedgerEntryLine`)
- `account_hint` — resolved against `AccountMap`, nullable when unmapped
- `metadata` (JSON)

**`LedgerEntryLine`** — `description`, `amount_excl`, `vat_amount`, `vat_class`, `account_hint`. Line-level VAT is required; do not compute VAT at document level.

**`AccountMap`** — per company: maps (`event_type`, `vat_class`, optional offering category) → external account code. Unmapped combinations produce an entry with `account_hint=null` and a visible unmapped state. **Never silently default to a guessed account code.**

**`LedgerDelivery`** — per (entry, adapter): `status` (pending/delivered/failed/skipped), `attempts`, `last_error`, `external_reference`. This is what makes "has this reached Sage?" a query instead of a support ticket.

## Emission

- Billing emits via a single service function — `emit_ledger_event(...)` — called inside the same transaction as the source operation, written through the existing **Outbox** pattern so emission and the domain write commit together.
- Emission points: invoice issue, credit note, payment receipt, payment allocation, collection failure, collection reversal. Stock events are out of scope until inventory-lite exists — define the enum values now, emit nothing.
- **Billing must not import any adapter.** Assert this with a test that fails on a forbidden import.

## Subscription

- `LedgerPort` interface: `deliver(entry) -> external_reference`, `supports(event_type) -> bool`.
- Rework existing Sage/Xero export stubs to implement it. They stay stubs — clearly labelled per SLICE-00.
- A worker drains pending `LedgerDelivery` rows with retry and backoff. Failures are visible in the UI, not just in logs.
- Replay: a management command can backfill a newly registered adapter from historical entries. Idempotency keys make this safe. Write a test for it — replay safety is the property that makes the §2.2 decision reversible.

## UI (minimal)

One staff screen: ledger events for the company, filterable by type, date and delivery status. Columns: date, type, source document (linked), amount, delivery status per adapter. Plus an "unmapped accounts" state that tells the tenant what to configure. No new nav entry unless the screen is real.

## Tests (required)

- Tenant isolation: company A cannot read company B's entries by id or via an empty filter.
- Idempotency: emitting the same source event twice produces one entry.
- Transactionality: a rolled-back invoice issue emits no entry.
- Import boundary: billing does not import adapters.
- Replay: backfilling an adapter over existing history creates no duplicate deliveries.
- VAT: line-level VAT sums to document VAT at 15%, including a mixed standard/zero-rated case.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. Report which tests you ran, what drift you found, and anything you had to assume.
