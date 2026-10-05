# SLICE-08 — Consent Ledger and Restricted Data Vault

**Goal:** the second half of the Compliance Spine. Proof of what a data subject agreed to, and enforcement of who may see what.

**Depends on:** SLICE-07 (Audit must exist first — masking without recording unmasks is theatre) and SLICE-06 (parties are who consent attaches to).

**Scope boundary:** consent and restricted data. Retention, data subject requests and the breach register are a later slice. See `docs/PLATFORM_ARCHITECTURE_SA.md` §5.2, §5.3, and `docs/DATA_CLASSIFICATION.md`.

## Assumptions to confirm before coding

1. `docs/DATA_CLASSIFICATION.md` already defines the classes. **Read it first and implement what it says.** If it is out of date or contradicts the architecture doc, report the conflict rather than picking one.
2. Enumerate what restricted data exists in the schema today — RICA documents, ID numbers, bank references, and the funeral/spa fields on the thin models. Report before building.
3. Does `NotifyPort` currently distinguish marketing from transactional messages? Consent enforcement depends on that distinction existing.

## 1. Consent Ledger

**`ConsentRecord`** — append-only. Data subject (a `Party`), purpose, channel, timestamp, source artefact, proof. Opt-outs are new records, never edits to old ones.

- Direct marketing under POPIA is opt-in, and the burden of proof sits with the responsible party. **Proof must be retrievable in one query**, per subject, per purpose.
- **`NotifyPort` refuses to send marketing-class messages without a matching consent record.** Refuses, not warns.
- Service and transactional messages are a separate class with separate rules. Do not collapse them into one check.

## 2. Restricted Data Vault

For ID numbers, RICA documents, death certificates, health and intake notes, bank references.

- **Field-level encryption** at rest.
- **Masked by default** in list and detail views. The unmasked value is a separate, explicit request.
- **Unmasking requires a reason** and writes an `AuditEvent` naming actor, record, class and reason.
- **Need-to-know permission is separate from ordinary record access.** A user who can open a subscriber cannot necessarily see their ID document.
- Retention timer per class, recorded now even though the retention engine comes later.

**Wire the existing restricted fields to it.** RICA documents already exist and are presumably stored plainly — report what you found and what you migrated.

## Tests

- A marketing-class send with no consent record is refused; a transactional send is not.
- An opt-out after an opt-in wins, and both records survive.
- A restricted field returns masked for a user with record access but no need-to-know permission.
- Unmasking without a reason is refused.
- Every unmask writes an audit event naming actor, record, class and reason.
- Encrypted fields are unreadable in a raw database dump.
- Tenant isolation on consent and restricted-data queries, including aggregates.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. All seven pack manifests must still load.

Report: **every restricted field found in the schema**, which you migrated into the vault, and any that could not be migrated without breaking an existing flow. Do not leave a field plain without saying so explicitly.
