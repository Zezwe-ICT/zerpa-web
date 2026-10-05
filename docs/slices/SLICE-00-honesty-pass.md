# SLICE-00 — Honesty pass on MSP and Telecom

**Type:** audit and remediation. **Not** a feature slice.
**Rule:** do not add features. If you find a gap that needs a feature, write it in the report and stop.
**Revised:** adds mirror/system-of-record honesty (Task 4), dashboard aggregate isolation (Task 1), and the MSP desk positioning check (Task 5).

## Why

MSP (M5) and Telecom (T6) are locally complete with stubs. That is not GA and not design-partner proven. This slice establishes what is actually true before anything else is built on top.

## Task 1 — Tenant isolation audit

For every DRF viewset/serializer in `apps.msp`, `apps.telecom`, `apps.billing`, `apps.crm`, `apps.documents`:

- Confirm the queryset is scoped by company derived from authenticated membership, not from a request header or body alone.
- Confirm an **empty or absent filter does not widen** to company-wide or cross-company results.
- Confirm nested/related lookups (`?agreement=`, `?subscriber=`, portal endpoints) cannot be used to read another company's row by id.
- Write a test per viewset: user in company A, id from company B → 404 or 403, never 200.

**Include every aggregate, count, total, chart feed and dashboard widget query.** These leak more quietly than detail views because a number feels anonymous, and they routinely skip the scoping a list endpoint gets. One isolation test per aggregate, not one for the group.

Output: table of endpoint · scoping mechanism · test added · verdict (pass/leak/unclear).

## Task 2 — FE/API state machine parity

For each work item type in MSP and Telecom:

- Extract the server-enforced transition map.
- Extract what the frontend renders as available actions.
- Diff them. Any button the API would reject, and any legal transition with no UI path, is a finding.

Output: per-type diff table. Fix the frontend to render from the machine rather than hardcoding, where the fix is mechanical.

## Task 3 — Stub honesty

Every port stub (`PsaPort`, `ProvisionPort`, `CollectPort`, `NotifyPort`, `CoveragePort`, Sage/Xero export, `FiscalPort`) must be **visibly a stub in the UI** — a badge, an explicit state, or a disabled control with a reason. A stub that renders as if it worked is the single most dangerous thing in the codebase right now.

Output: list of stubs · current UI treatment · change made.

## Task 4 — Mirror and system-of-record honesty

Per `docs/PLATFORM_ARCHITECTURE_SA.md` §2.6. For every surface displaying data that originates in an external system — PSA tickets via Bridge, RMM devices and alerts, accounting balances, FNO/provisioning state, collection outcomes:

- Identify which system is authoritative for that record today. Is it declared anywhere, or assumed in code?
- Confirm the surface is **labelled as a mirror** and shows freshness: last synced, sync status, and a visible stale state.
- Confirm **writes** either push through the port or are disabled. A local edit that silently diverges from the authoritative system is a finding, and a serious one.
- Confirm no Zerpa-owned record (agreement, mandate, consent, RICA case, document chain, authorisation, invoice) is being treated as a mirror of something external.

Output: table of surface · authoritative system · declared or assumed · freshness shown · write behaviour · verdict. Where nothing declares the system of record, note it — that is input to the `SystemOfRecord` slice, not something to build here.

## Task 5 — MSP desk positioning

`docs/PLATFORM_ARCHITECTURE_SA.md` §2.7 is an open decision: Lite desk becomes the explicit no-PSA fallback, or it is cut. **Do not decide it and do not change behaviour.**

Report only:
- How deep the Lite desk actually is today: models, transitions, SLA handling, UI surface area.
- How it is currently presented — does any copy, nav label or marketing surface read as a ticketing product rather than a fallback?
- What a tenant on PSA Bridge sees. Are both paths live simultaneously, and is it clear which is authoritative?

This is the input the owner needs to settle §2.7.

## Task 6 — Gate checklists

Walk `docs/gates/QUALITY_GA_CHECKLIST.md` and `docs/gates/BETA_ACCEPTANCE.md`. Mark each line evidenced / not evidenced / unclear, with the file or test that evidences it. **Do not mark anything green on assumption.**

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`, plus a written report at `docs/audits/HONESTY_PASS_<date>.md` containing all six outputs and a residual-risk section.

Report findings even where you could not fix them. An accurate list of what is broken is the deliverable here — a clean report that skipped the hard endpoints is worse than no audit.
