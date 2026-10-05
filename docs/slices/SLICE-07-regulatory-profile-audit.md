# SLICE-07 — Regulatory Profile and Audit

**Goal:** the first half of the Compliance Spine. What each tenant is licensed to do, and an immutable record of who did what.

**Why now:** feature gating and the funeral pack both depend on Regulatory Profile. Audit is a prerequisite for the Restricted Vault (SLICE-08) — there is no point masking data if unmasking is not recorded.

**Scope boundary:** Regulatory Profile and Audit only. Consent Ledger and Restricted Vault are SLICE-08; retention, DSR/PAIA and the breach register come later. See `docs/PLATFORM_ARCHITECTURE_SA.md` §5.1 and §5.7.

## Assumptions to confirm before coding

1. Is there an existing audit or event log in `apps.core`, or does the Outbox already carry something this should extend rather than duplicate? Report before building.
2. How does Nest currently capture company setup data? Regulatory Profile fields belong in that flow, not a settings screen bolted on later.

## 1. Regulatory Profile

Per company: VAT vendor status and number, ICASA licence class (none / Class ECS / C-ECNS / individual), FSP licence status, Department of Health Certificate of Competence, RMI/MIWA accreditation, CIPC registration, PAIA Information Officer details.

- Fields are **declared per pack** via `regulatoryGates` in the manifest — the kernel stores them, the pack says which are required for which flows.
- **Feature gating reads Regulatory Profile.** A TELECOM tenant with no licence recorded gets provisioning flows disabled **with an explanatory state**, never a silent failure and never a bare 403.
- Populated during Nest setup as a `setupStep`, gating go-live.
- **Do not validate licence numbers against any external register.** Recording what the tenant asserts is the scope; verification is not.

**Wire the existing gates to it.** The RICA guard and any other flow currently assuming a licence should read from here. Report which flows you found and which you wired.

## 2. Audit

**`AuditEvent`** — append-only. No update path, no delete path.

- Actor (user, system, or an Assist execution), company, timestamp, action, target record, before/after where meaningful, reason where the action requires one.
- **Must cover:** every state machine transition, every Assist decision and execution, every Regulatory Profile change, every permission or membership change, and — once SLICE-08 lands — every restricted-data unmask.
- Queryable by company, actor, target and date. Exportable.
- **Writes go through the Outbox, in the same transaction as the action.** An action that commits without its audit event is a bug; so is an audit event for an action that rolled back.

No UI in this slice beyond what is needed to verify the data exists.

## Tests

- An audit event is written in the same transaction as its action; a rolled-back action leaves no event.
- `AuditEvent` cannot be updated or deleted through the ORM (same pattern as the RICA queryset gate — a manager-level guard, plus a test that fails if an ungated manager is added).
- A TELECOM company with no ICASA licence recorded cannot reach provisioning, and receives an explanatory state rather than a bare 403.
- A company missing a pack-required Regulatory Profile field cannot pass the go-live gate.
- Tenant isolation on Regulatory Profile and on audit queries, including aggregates.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. All seven pack manifests must still load.

Report: which existing flows you wired to Regulatory Profile, and **every action that should emit an audit event but does not yet.** That gap list is the deliverable — do not close it in this slice.
