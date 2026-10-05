# SLICE-06 — Party and PartyRole

**Goal:** one person or organisation, one record, with role bindings per context. Replace account/contact/lead as the only shape.

**Why now:** blocks all four thin packs. Funeral needs a deceased and a next-of-kin as different parties in different roles on one case. Automotive needs an owner and, on panel work, a separate payer. Spa needs a client carrying restricted intake notes. Restaurant needs a guest with dietary flags. Modelled as accounts and contacts, each of those becomes a pack-specific table — which is the fork the pack model exists to prevent. See `docs/PLATFORM_ARCHITECTURE_SA.md` §4.

**Scope boundary:** the party model and its migration. Not the Restricted Vault (SLICE-08), not CRM UI changes beyond what the migration requires, not pack record rework.

## Assumptions to confirm before coding

1. Current shape of `apps.crm` — `Account`, `Site`, `Contact`, `Lead`. Confirm the actual fields and FKs before designing anything.
2. **Who points at `Account` today?** `Membership.account` (from the portal isolation fix), invoices, agreements, tickets, subscribers, funeral cases. Enumerate every FK and report the full list before writing a migration. This is the riskiest part of the slice and the place a mistake is most expensive.
3. Is `Lead` a separate model or a status on `Account`?

## Models

**`Party`** — a person or an organisation. Identity attributes only: name, type, contact details, external identifiers. **No role-specific fields.** If a field only makes sense when the party is a customer, it belongs on the role, not here.

**`PartyRole`** — binds a party to a context with a role: customer, supplier, employee, subscriber, next-of-kin, deceased, guest, vehicle owner, payer, portal user. Carries the role-specific data and its own validity period — a party can be a lead, then a customer, and the history stays queryable.

**`PartyRelationship`** — party to party, typed: employs, is next-of-kin to, is guardian of, is the billing entity for. Funeral and automotive both need this; do not model it as a nullable FK on the pack record.

Rules:
- A party with no role is valid (a record created before anyone decided what it is).
- **Role types are declared in the pack manifest**, not hardcoded in the kernel.
- Two roles on one party must not duplicate identity data. If they do, the split between `Party` and `PartyRole` is wrong — report that rather than working around it.

## Migration

Existing `Account` / `Contact` / `Lead` rows become parties with roles. This is real data with real FKs, so:

- Migrate forward; **do not drop the old models in this slice.** Keep existing endpoints working against the new shape.
- **`Membership.account` must keep resolving.** The portal isolation fix depends on it, and breaking it reopens a leak that took two passes to close.
- Report what the migration could not map cleanly rather than inventing a role to make a row fit.

## Tests

- A funeral case carries a deceased and a next-of-kin as separate parties in separate roles on the same case.
- An automotive job card carries an owner and a different payer.
- One party holding two roles stores identity data once.
- Role history: a party that was a lead and is now a customer retains both bindings with dates.
- Every existing CRM endpoint returns the same shape after migration.
- **Portal isolation still holds:** re-run `apps.tenancy.tests.PortalIsolationTests` unchanged. It must pass without modification.
- **Portal allowlist still holds:** re-run `PortalStaffAllowlistTests` unchanged.
- Tenant isolation on every new endpoint and aggregate.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. All seven pack manifests must still load. No new nav entries.

Report: the full FK inventory from assumption 2, anything the migration could not map, and whether any pack record should now use `PartyRelationship` instead of a direct FK. Do not make those pack changes here.
