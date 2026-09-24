# SLICE-05 — Consumer Commerce Rules (CPA engine)

**Goal:** the Consumer Protection Act obligations every vertical carries, built once in the kernel instead of four times in four packs.

**Why now:** unblocked by any open decision, serves all six packs, and prevents the duplication that would otherwise appear as each pack is built. See `docs/PLATFORM_ARCHITECTURE_SA.md` §5.8.

**Scope boundary:** commercial rules only. Not billing mechanics, not the ledger seam (SLICE-01), not scheduling (SLICE-02, already built). Where this slice needs to record money moving, it defines the **emission point** and leaves a TODO referencing SLICE-01 — do not build a parallel accounting path.

**Legal note:** the rules below are implemented from the Act as researched. Nothing here is legal advice, and the tenant-configurable values (what counts as a reasonable cancellation charge, deposit percentages) are the tenant's call, not defaults Zerpa should invent. Where a value must be chosen, make it configurable with no opinionated default rather than guessing.

## Assumptions to confirm before coding

1. New app `apps.commerce`, or extend `apps.billing`? Brief assumes **`apps.commerce`**, to keep CPA rules separable from invoicing mechanics.
2. Does anything already implement deposits, cancellation fees, vouchers or estimates in `apps.msp`, `apps.telecom` or `apps.billing`? If so, **this slice absorbs it** — report before changing.
3. Confirm how `Offering` and `Agreement` are currently modelled, since policies attach to them.

## 1. Deposit and cancellation policy

**`DepositPolicy`** — attached to an Offering or Agreement. Amount or percentage, when due, refundability terms.

**`CancellationPolicy`** — graduated forfeiture by notice period (tenant-configured tiers), rebooking credit as an alternative to forfeiture.

**The hard rule:** CPA s17 allows a reasonable cancellation charge, judged on notice given and the ability to resell the slot — **but no cancellation charge at all where the consumer cannot honour the booking because of the death or hospitalisation of the person the booking was for.**

Implement that exemption as a **policy branch with a reason code**, not a manual discount an agent applies. Every vertical hits it; funeral hits it constantly. A `CancellationAssessment` records: notice given, tier applied, reason code, resulting charge, and who assessed it. When the exemption applies the charge is zero and the record says why.

## 2. Prepaid credit

**`PrepaidCredit`** — vouchers, spa packages, MSP prepaid block hours, restaurant gift cards.

- Issue date, remaining balance, redemption history.
- **Expiry may never be earlier than three years from issue** (s63). Make this a model-level floor, not a form validation — a tenant configuring 12 months must be refused.
- **Liability flag:** this is the customer's money, not revenue, until redeemed.
- Emission points for SLICE-01: `prepaid_issued` (liability up) and `prepaid_redeemed` (liability down, revenue recognised). Define the events; do not build the ledger here.

## 3. Fixed-term agreements

**`FixedTermTerms`** — 20 business days' cancellation notice (s14), reasonable penalty, automatic month-to-month continuation on expiry unless cancelled.

Business-day arithmetic must use the **South African public holiday calendar**, not calendar days and not a generic weekday count. Applies identically to MSP agreements, telecom subscriptions and spa memberships.

## 4. Repair authorisation chain (s15)

The most consequential part of this slice. A service provider may not charge for repair or maintenance work without an estimate the consumer authorised.

**`Estimate`** — line items, parts and labour, validity period. Must disclose reconditioned or grey-market parts.

**`Authorisation`** — records **which of the three elections the consumer made**: accept the estimate, set a maximum cut-off price, or decline an estimate entirely (carte blanche). Plus who authorised, when, and through which channel (in person, WhatsApp, email, portal). The channel matters because it is the evidence.

**`Variance`** — work discovered beyond the authorised scope. Requires a **new `Authorisation`** before that work can be billed.

**The invariant (12):** the invoice builder **refuses to bill unauthorised lines**. It does not warn, it does not flag, it does not let a supervisor override. Unauthorised work is unbillable under the Act, so an invoice containing it is the wrong artefact. Test this directly.

Automotive is the obvious consumer. MSP overage beyond an agreement's included hours is the same shape — check whether the existing MSP overage path should route through this rather than staying separate, and report your finding either way.

## 5. Parts warranty

**`PartsWarranty`** — minimum three months on new or reconditioned parts and labour (s57), recorded against the job and surfaced to the customer.

## Tests (required)

- Cancellation: each configured tier applies correctly by notice given.
- **Death/hospitalisation exemption produces a zero charge with a reason code**, on every pack that has a cancellation policy.
- Prepaid: expiry earlier than three years is refused at the model layer, not the form.
- Prepaid: balance cannot go negative; partial redemption leaves a correct balance.
- Fixed term: 20 business days computed across an SA public holiday and a weekend.
- **Authorisation: an invoice containing a line with no matching authorisation is refused.**
- Variance: work beyond the authorised cut-off requires a new authorisation before it becomes billable.
- Carte blanche: an explicit declined-estimate election permits billing without a line-level estimate, and is recorded as such.
- Tenant isolation on every new endpoint and aggregate.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. All seven pack manifests must still load. No new nav entries — this slice is kernel and API, not UI.

Report: which pack surfaces would need to change to use this, and whether MSP overage should route through the authorisation chain. Do not make those changes here.
