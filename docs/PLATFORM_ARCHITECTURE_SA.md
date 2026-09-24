# Zerpa Platform Architecture (SA-first)

**Status:** draft v0.5, 2026-09-15
**Sits alongside:** `docs/PRODUCT_ENGINEERING_SPEC.md` (v3) and ADRs 0001–0005. Does not supersede them.
**Not related to:** the historical `docs/ARCHITECTURE.md` (funeral-first, different stack). Ignore that file.
**Stack assumed:** Django 5 + DRF modular monolith (`zerpa-api`), Next.js 15 (`zerpa-web`). Running code wins over this document.

**Changed in v0.2:** Zerpa is stated as an ERP. The general-ledger question is answered explicitly (§2.2) rather than left open: ops-first now, native GL on a trigger. Added the `LedgerEntry` event seam (§4), inventory-lite (§4), an own-vs-integrate table (§2.3), and revised build sequence (§10).

**Changed in v0.5:** Added the commercial model as an explicit open decision with SA pricing benchmarks and the metering/entitlement work it forces either way (§2.8), and support access under POPIA's operator regime (§5.10). See also `docs/DESIGN_PARTNER_PLAN.md`.

**Changed in v0.4:** Integration-first stated as a rule with a test (§2.5), plus `SystemOfRecord` and the mirror model (§2.6) and an open decision on MSP Lite desk (§2.7).

**Changed in v0.3a:** Added §6A — pack selection at company setup, login and company switching, dashboard resolution, and why changing pack after go-live is a migration rather than a setting.

**Changed in v0.3:** Researched the four thin packs (funeral, spa, restaurant, automotive) properly. Two findings turned out to be kernel-level, not pack-level: a **Consumer Commerce Rules engine** for CPA obligations that every vertical carries (§5.8), and a **regulated document chain** pattern that gates service delivery (§5.9). Section 9 is rewritten with real per-vertical operating loops. Build sequence moves the resource kernel earlier and adds pack conformance (§10).

---

## 0. The one-paragraph version

Zerpa is an ERP for South African businesses — one shared kernel, installable vertical packs, in the shape of Odoo or Zoho rather than a point solution. It differs from them in two deliberate ways. First, **compliance primitives live in the kernel**: a DebiCheck mandate with dispute evidence, a RICA vault that gates activation, a POPIA consent ledger with proof, a VAT invoice built to survive SARS's Digital VAT Model, a WhatsApp channel with opt-in and cost accounting. A chart of accounts and a 15% VAT rate are localisation; these are not, and a global ERP has no reason to build them. Second, **Zerpa does not own the general ledger on day one.** Money-touching operations emit ledger events through an abstraction; accounting packages consume them. A native GL is a planned, trigger-gated addition, not an assumption baked into the first release. Everything else — verticals as declarative packs, all third parties behind ports, Assist as approval-gated copilot — follows from those two choices.

---

## 1. Research findings that changed the design

Each row states the finding, the source, and what it forces in the architecture. Sources are named so they can be re-verified; nothing here is a legal opinion.

| # | Finding | Source | Architectural consequence |
|---|---|---|---|
| 1 | SARS published a VAT Modernisation consultation paper (Aug 2026) proposing a Decentralised Continuous Transaction Control & Exchange model: structured invoices validated by accredited service providers before data reaches SARS. Comments close 16 Oct 2026. Pilots 2026/27, implementation expected from ~2030, large-taxpayer B2B first. No mandate, no final spec yet. | SARS consultation paper, Aug 2026; summaries at vatupdate.com, taxspoc.com, innovatetax.com | Invoice becomes an **immutable structured fiscal document** with a stable schema + a `FiscalPort` seam. **Do not build a SARS integration now.** Build the document so one can be bolted on. Also a live input to the GL decision — see §2.2. |
| 2 | From 13 Apr 2026 the debit order dispute window is 60 calendar days (was 365) across EFT, Registered Mandate and DebiCheck; disputes inside the window auto-reverse. Correctly matched DebiCheck collections remain non-disputable. Scheme rules moved PASA → SARB on 11 Aug 2026. | netcash.co.za, directdebit.co.za, businesstech.co.za, stitch.money (Aug 2026) | **Mandate is a first-class object** with authentication method, stored evidence, and a dispute state machine. Collections reference a mandate; a collection that drifts from mandate terms must be blocked, not just logged. |
| 3 | PayShap: 839m+ transactions / R774bn since Mar 2023, 14 participating banks. PayShap Request (request-to-pay) live since Oct 2024, ISO 20022 aligned. | PayInc via businessmediamags.co.za; stitch.money state-of-PayShap 2026 | **Collection strategy per agreement**, not a single rail. `CollectPort` covers debit order, card, request-to-pay, EFT reconciliation. |
| 4 | Information Regulator moved to proactive own-initiated compliance assessments in its 2026/27 plan, targeting financial services, insurance & health, retail, telecoms and public sector. Health information regulations in force 6 Mar 2026, no grace period. Enforcement notices issued against private bodies; fines R100k–R5m; max R10m. Fines have followed failure to comply with an enforcement notice. | inforegulator.org.za media statements; Werksmans; MJ Kotze enforcement tracker; braintree.co.za | POPIA obligations become **product surfaces**: consent ledger, restricted-data vault, retention engine, data subject request workflow, breach register. Telecom and Funeral packs sit inside named target sectors. |
| 5 | ECA s5: ECNS/ECS providers require an ICASA licence. Smaller ISPs and VoIP resellers commonly hold Class ECS, sometimes with C-ECNS for own last mile. | icasa.org.za licensing pages; telecoms-channel.co.za (Mar 2026) | **Regulatory Profile per company** (licences held, VAT vendor status, FSP status). Features unlock against it. A tenant without the relevant licence should not be able to run the flow that assumes one. |
| 6 | A funeral parlour collecting premiums for a benefit payable on death is conducting insurance: needs FSP licensing and an underwriting insurer. Separately, a Dept of Health Certificate of Competence is mandatory for mortuary standards under the National Health Act. Industry review by PA/FSCA is ongoing. | Masthead; FSCA/PA Joint Communication 7 of 2024; National Health Act summaries | The FUNERAL pack's **boundary becomes a hard product gate**: arrangement, logistics, invoicing. No premium schedules, no benefit records, no claims. Enforce in code and in the manifest, not in a README. |
| 7 | Eskom passed 365 consecutive days without load shedding (16 May 2026) and cleared winter 2026 without shedding. EAF up to ~67.8%. | Eskom statement 16 May 2026; SAnews Sep 2026 | **De-prioritise offline-first.** Resilient retry + optimistic UI is enough. Do not spend a quarter on local-first sync. |
| 8 | WhatsApp: SA marketing templates ≈ $0.04–0.06 each (2026); utility messages 80–90% cheaper; service replies inside the 24h window free. Meta business verification requires CIPC registration for SA entities. | growthpulsemedia.co.za (May 2026); afrotools.com | `NotifyPort` models **template vs session, opt-in proof, and per-message cost**. Message cost is tenant-billable data, not an invisible infra detail. |
| 9 | **CPA s15** — a service provider may not charge for repair or maintenance work without an estimate the consumer authorised. The consumer elects one of three options upfront: an estimate, a maximum cut-off price, or carte blanche. Additional work beyond the estimate needs fresh authorisation or it is unsolicited and unbillable. s57 warrants new/reconditioned parts and labour for at least three months. s65 makes the provider liable for property in its possession. | CPA 68 of 2008 (saflii); RMI; SEESA; NCC commentary | **Automotive's core state machine is statutory**, not a design choice. Estimate → election → authorisation → variance → re-authorisation, with unauthorised work structurally unbillable. This is the single strongest product claim in the automotive pack. |
| 10 | **CPA s17** — a supplier may take a reasonable advance deposit and charge a reasonable cancellation fee for bookings, judged on notice given and ability to resell the slot. **No cancellation fee at all** where the consumer cannot honour the booking due to death or hospitalisation of the person it was for. **s63** — prepaid vouchers expire on redemption or after three years, and voucher money is not the supplier's own. **s14** — fixed-term agreements cancellable on 20 business days' notice with a reasonable penalty. | CPA 68 of 2008 (saflii); NCC Advisory Note 12 of 2021; thedtic | A **Consumer Commerce Rules engine in the kernel** (§5.8), not four copies of the same logic. Deposits, cancellation scales, voucher liability and fixed-term notice apply across spa, restaurant, funeral, automotive *and* MSP/telecom agreements. |
| 11 | Death registration runs DHA-1663 (notification, with an undertaker section) → DHA-1680 (death report) → **BI-14 burial order, without which burial cannot legally take place**. Deaths must be reported within 72 hours. Unnatural deaths go to SAPS and forensic pathology first. Repatriation needs an unabridged certificate (DHA-132). The undertaker is a legally recognised party to this chain and their registration number appears on the form. | DHA forms; homeaffairsguide.co.za (Mar 2026); idchecker.co.za; Births and Deaths Registration Act 51 of 1992 | A **regulated document chain that gates the service date** (§5.9). The funeral pack's arrangement cannot reach "service scheduled" without BI-14. This is a gate, not a checklist item. |

### Deliberate non-goals confirmed by the research
- No SARS filing integration until the spec is published and accreditation exists.
- No funeral policy/claims administration, ever, under the current licence assumptions.
- No local-first/offline sync engine.
- No full RMM, carrier OSS, POS till, or ConnectWise-depth PSA. Integrate.

---

## 2. What kind of ERP

### 2.1 The shape

Zerpa is an ERP in the Odoo/Zoho sense: one shared kernel and database, installable modules, no forked application per industry, and enough breadth that a business runs its operations in one place instead of five. Where it diverges is scope of ownership, and that is a decision rather than an omission.

### 2.2 Decision: the general ledger

**Decision: Zerpa does not own the general ledger in v1. It emits ledger events from day one and adds a native GL on a defined trigger.**

Reasoning, in weight order:

1. **Asymmetric failure.** A wrong ticket state is annoying; a wrong trial balance is existential, for the customer at audit and for Zerpa's reputation the moment it is noticed. An accounting core is not conceptually hard — it is hard because it must be right across period close, reversals, reconciliation and prior-period adjustment, every time. MSP and Telecom are locally complete with stubs and not yet design-partner proven. Adding the one subsystem where correctness is non-negotiable, before proving the ones where it is merely important, is the wrong order.
2. **The accountant holds a veto.** SA SME accountants work in Pastel, Sage and Xero. Owning the GL means winning an argument with a third party who has no incentive to switch, on every deal. Feeding their tool means never having that argument.
3. **Most of the integration benefit is recoverable without the GL.** What customers feel is: no double capture, invoices land in accounting without retyping, payments reconcile back to the ops record. A well-built sync delivers that. The genuine loss is real-time statutory margin and P&L inside Zerpa — partly covered by an ops-side reporting layer that does not claim to be statutory.
4. **Scope risk is the likeliest cause of death,** ahead of any architectural mistake. Six packs plus a compliance spine plus an honesty pass is already the limit.

**Triggers that flip this decision.** Build the native GL when *any one* becomes true:
- a design partner declines to buy without it (pipeline evidence beats reasoning here, and should override this section);
- reconciliation/sync support load exceeds roughly one day per week;
- SARS's published Digital VAT Model spec makes clearance impractical without a native ledger.

"It would feel more like a real ERP" is **not** a trigger.

### 2.3 Own vs integrate

| Capability | Zerpa owns | Rationale |
|---|---|---|
| CRM, work, agreements, scheduling, portals | **Own** | The product |
| Recurring billing, invoicing, VAT at line level | **Own** | Feeds everything; fiscal document is a compliance asset |
| Collections, mandates, dunning | **Own** | SA-specific, and the moat |
| POPIA / RICA / licence compliance spine | **Own** | The moat |
| Inventory-lite (stock on hand, movements, valuation) | **Own** | Caskets, spa retail, parts, MSP hardware. Ops, not accounting |
| Purchasing / supplier orders | **Own (later)** | Natural extension of inventory-lite |
| General ledger, AP, bank rec, period close, statutory reporting | **Integrate now, own on trigger** | §2.2 |
| Payroll (PAYE, UIF, SDL, EMP201/EMP501, IRP5, ETI, bargaining councils) | **Integrate — permanently** | Annual tax-table changes must ship on time or customers get penalised. Sage and SimplePay own this. A permanent maintenance tax for no differentiation |
| Manufacturing / MRP / deep warehousing | **Never** | Odoo's depth, and irrelevant to all six verticals |
| RMM, carrier OSS, POS till, PSA depth | **Integrate** | Operators already run these |

### 2.5 Build vs integrate — the test

**Zerpa is the connective layer for internal process, not a replacement for systems a business already runs well.** A tenant should not have to migrate off working software to get value. Equally, "integrate everything" is not a strategy — a platform that owns no records is a dashboard, and dashboards do not retain customers.

The test, applied per capability:

**Build it when it is connective or regulated.**
- It spans systems no single tool owns (an agreement that drives billing, entitlement and SLA across a PSA, an RMM and an accounting package).
- It carries a South African obligation (mandates, consent, RICA, CPA authorisation, retention, licence gating).
- It is the operating loop itself — the sequence that makes the business run, which no point tool models end to end.
- Nobody sells it in SA at SME price.

**Integrate it when it is a system of record someone already runs well.**
- Ticketing/PSA, accounting, RMM, POS, payroll, e-sign, coverage, payment rails.
- The tenant already pays for it, their staff already know it, and switching cost is the objection that kills the deal.

**The honest caution:** every feature feels justified from the inside. If a proposed build is neither connective nor regulated, and a tenant could buy it standalone tomorrow, it is scope creep wearing a business case. Write the justification into the slice brief or do not build it.

### 2.6 Systems of record and the mirror

Integration-first only works if "who owns this record" is explicit, per company, per capability.

**`SystemOfRecord`** — a per-company registry: for each capability (ticketing, accounting, devices, bookings, payments), which system is authoritative — Zerpa, or a named external system via a port. Set during Nest setup, visible in the UI.

Consequences that must hold:
- **Zerpa never silently becomes the source of truth for a capability it does not own.** If the PSA owns tickets, Zerpa's copy is a **mirror**: read-mostly, clearly labelled, with writes either pushed through the port or disabled.
- **Mirrors carry freshness.** Last synced, sync status, and a visible stale state. A mirror pretending to be live data is worse than no mirror.
- **Conflict rule is declared, not improvised.** For mirrored records the external system wins by default; exceptions are explicit.
- **Zerpa-owned records are never mirrors.** Agreements, mandates, consent, RICA cases, document chains, authorisations and invoices are authoritative in Zerpa or they do not work at all. This is the retention layer — it is what a tenant cannot get from stitching their existing tools together.
- A capability with no system declared is **not silently assumed to be Zerpa's**. It is a setup step.

### 2.7 MSP desk: Bridge first, Lite as fallback

**Decision needed (see §11).** The MSP pack currently ships a Lite desk with its own ticket state machine. Under §2.5 that is a system of record Zerpa should not be building.

Recommended position: **PSA Bridge is the default path.** Lite desk is repositioned as the explicit fallback for MSPs who run no PSA at all — email and WhatsApp, which is common at the small end of the SA market — and is named and presented as a fallback, never as a ticketing product. It stays deliberately shallow: no feature work beyond what the MSP operating loop requires, and no roadmap. Any pressure to deepen it is the signal to sell the Bridge instead.

The alternative is to cut it, which is cleaner architecturally and closes the door on MSPs with no PSA. Pick one and write it down — leaving it ambiguous is how it quietly grows into ConnectWise.

### 2.8 Commercial model — open, with architectural consequences

**Not decided. Must be, before the ledger seam ships**, because metering is the same class of retrofit as the GL: cheap now, a rewrite through every money path later.

**SA benchmarks (research, not a recommendation).** All ZAR, 2026, from vendor and comparison sources — verify before using any of it commercially:
- SA-built SME ERP: QuickEasy BOS publishes R820/user/month ex VAT with a R1,230 monthly minimum.
- CRM mid-tier: roughly R300–R500/user/month for Zoho and Pipedrive; enterprise (Salesforce, Dynamics 365 Sales Pro) R1,170–R1,350/user/month.
- SA-priced niche CRM: BizAI at R499/month flat, explicitly positioned on ZAR pricing, POPIA and WhatsApp.
- Accounting: Sage Accounting Start ≈ R240/month; Xero Starter ≈ R590/month.
- M365 Business Standard ≈ R219–R250/user/month — a useful anchor for what SA SMEs already accept as a per-seat line item.

**The consistent signal:** ZAR-denominated pricing is itself a selling point, because USD billing moves the tenant's cost when the rand moves and vendors do not absorb it. Zerpa should price in ZAR and say so.

**Options and what each forces:**

| Model | Fits | Architectural requirement |
|---|---|---|
| Per company, flat by pack | Simple, predictable, matches the go-live gate | Entitlements only |
| Per user/seat | Familiar to SA SMEs from M365 | Seat counting, membership-change proration |
| Per pack module | Matches the manifest model | Entitlement per pack + per capability |
| Usage-based (collections, WhatsApp messages, Assist runs) | Aligns cost to value, covers real per-tenant cost | **Full metering in the kernel** |
| Hybrid base + usage | Most likely fit | All of the above |

**Cost to pass through, whatever is chosen.** `NotifyPort` and Assist spend real money per tenant — SA WhatsApp marketing templates run roughly $0.04–0.06 each, utility messages far less, and Assist runs cost per invocation. Today neither is metered. A tenant on a flat plan running large WhatsApp campaigns is an unpriced liability.

**What to build now regardless of the decision:**
- `UsageMeter` — append-only counters per company per metric (messages by class, collections attempted, Assist runs, active seats, storage). Emitted alongside `LedgerEntry`, same Outbox discipline.
- `Entitlement` — per company: which packs, which capabilities, which limits. Feature gating reads Regulatory Profile **and** Entitlement. A tenant past a limit gets a clear state, never a silent failure.
- Zerpa as its own tenant: subscription, trial, failed payment, suspension, offboarding with data export. Zerpa runs dunning for other businesses and currently has no plan for its own.

### 2.4 Against Odoo and Zoho

| | Odoo / Zoho | Zerpa |
|---|---|---|
| Unit of sale | Apps + implementation partner | One vertical pack, self-serve through Nest |
| Verticalisation | Studio customisation per client, per partner | Versioned manifest shipped by Zerpa, upgradeable |
| SA compliance | VAT rate, chart of accounts, payroll add-ons | Mandates, RICA, consent, retention, licence gating in the kernel |
| Accounting | Native GL | Ops-first, GL on trigger (§2.2) |
| Time to value | Weeks to months of configuration | Go-live checklist measured in days |
| Migration demand | Move your processes into the suite | Keep your systems; Zerpa connects and adds the regulated layer |
| Where they beat us | Manufacturing, inventory depth, ecommerce, payroll, statutory accounting | — |

---

## 3. Layer model

```
┌─────────────────────────────────────────────────────────────┐
│ Surfaces        Staff app · Portal · Platform admin · Nest   │
│                 (Next.js, manifest-driven)                   │
├─────────────────────────────────────────────────────────────┤
│ Vertical Packs  MSP · TELECOM · FUNERAL · SPA · RESTAURANT   │
│                 · AUTOMOTIVE · GENERIC                       │
│                 (Django module + versioned manifest)         │
├─────────────────────────────────────────────────────────────┤
│ Zerpa Assist    skills · proposals · decisions (gated)       │
├─────────────────────────────────────────────────────────────┤
│ Compliance      Regulatory Profile · Consent Ledger ·        │
│ Spine           Restricted Vault · Mandate Vault · Fiscal    │
│   (SA moat)     Docs · Retention · DSR/PAIA · Breach · Audit │
├─────────────────────────────────────────────────────────────┤
│ Zerpa Core      Tenancy · Party · Catalogue · Agreement ·    │
│                 Work · Schedule · Stock · Billing ·          │
│                 LedgerEvents · Documents · Workflow · Outbox │
├─────────────────────────────────────────────────────────────┤
│ Ports           Psa · Rmm · Provision · Coverage · Collect ·  │
│                 Fiscal · Ledger · Notify · Identity · Sign   │
└─────────────────────────────────────────────────────────────┘
```

Rule: **a pack may compose kernel objects and declare behaviour; it may not reach around the kernel to the database, and it may not call a provider SDK directly.** Every provider call goes through a port.

---

## 4. Zerpa Core — kernel objects

All owned rows carry `companyId`. Names are indicative; match existing Django models where they already exist.

**Tenancy.** `Organization → Company → Location`, `Membership(user, company, role, permissions)`. Company is the isolation unit. Tenant context resolves from authenticated membership only. An empty filter must never widen to company-wide or cross-company reads — this is the single most important invariant in the system and deserves a test per viewset, not a middleware you hope works.

**Party.** `Party` (person or organisation) with `PartyRole` bindings: customer, subscriber, supplier, employee, family contact, guest. One person can be a customer in one pack and a contact in another without duplication. Packs label parties; they do not subclass them.

**Catalogue.** `Offering` with subtypes: `Service` (MSP block hours), `Plan` (telecom recurring), `Package` (funeral), `Treatment` (spa), `MenuItem` (restaurant), `LabourOp`/`Part` (automotive). Shared pricing, VAT class, cost, margin, availability rules.

**Agreement.** The commercial contract: parties, offerings, term, billing cycle, escalation, included quantities, overage rules, collection strategy, cancellation terms. MSP agreements, telecom subscriptions, funeral packages-on-account and spa memberships are all Agreements. This is where most vertical duplication would otherwise happen.

**Work.** `WorkItem` (generic ops record) + `WorkItemType` declared by the pack: Ticket, Order, Case, Booking, Job card, Reservation. Every type binds an explicit **state machine** declared in the pack manifest and enforced server-side. FE buttons render from the machine; they never hardcode transitions.

**Schedule.** `Resource` (technician, chapel, hearse, therapy room, table, bay, lift) + `ResourceBooking` with conflict detection. Funeral, spa, restaurant and automotive are all resource-scheduling businesses wearing different clothes. Build this once, properly, before the funeral pack — it is the single highest-leverage kernel investment remaining.

**Stock (inventory-lite).** `StockItem`, `StockLocation`, `StockMovement`, valuation (weighted average unless a pack argues otherwise). Consumption is driven by work items: a job card consumes parts, an arrangement consumes a casket, a treatment consumes retail product. **Deliberately excludes** MRP, bills of materials, multi-warehouse transfer planning and landed-cost apportionment. If a tenant needs those, they are not a Zerpa tenant.

**Billing.** `BillingSchedule → InvoiceRun → Invoice (immutable) → CreditNote → Allocation → Payment`. VAT computed at line level with a VAT class per line. Invoices are never edited after issue.

**Ledger events — the GL seam.** Every money-touching operation emits a structured, append-only `LedgerEntry` event: invoice issued, credit note raised, payment allocated, collection failed, stock consumed, stock revalued, write-off. Each event carries company, date, source document reference, line-level amounts, VAT class and an account-mapping hint resolved against a per-company `AccountMap`.

This is the whole point of the §2.2 decision, so it must hold:
- **Billing never calls an accounting adapter directly.** It emits events.
- **`LedgerPort` adapters (Sage, Xero) consume events.** They are subscribers, not the interface billing knows about.
- **A future native GL consumes the same events** and posts double-entry journals. Nothing upstream changes when it arrives.
- Events are **idempotent and replayable** — a new adapter (or the native GL) can be backfilled from history rather than requiring a migration.
- Reconciliation state lives with the event, so "what has and has not reached the accounting package" is a queryable fact, not a support ticket.

Cost of this seam today: a few days. Cost of not having it when the trigger fires: a rewrite of every money-touching path.

**Documents.** `Document` with classification, retention policy, access log. Backed by the Restricted Vault when classification requires it.

**Workflow & Events.** `Automation` (trigger / condition / action) and transactional `Outbox`. Automations may create tasks, messages and jobs. They may **not** skip a required transition or a regulated approval — enforce this at the action registry, so it is structurally impossible rather than a code review convention.

---

## 5. The Compliance Spine — the SA moat

This is what makes Zerpa hard to replicate and hard for Odoo to bolt on. Every item is shared by all packs.

### 5.1 Regulatory Profile
Per company: VAT vendor status and number, ICASA licence class (none / Class ECS / C-ECNS / individual), FSP licence status, Department of Health Certificate of Competence, CIPC registration, PAIA Information Officer details. **Feature gating reads from here.** A TELECOM tenant with no licence recorded gets provisioning flows disabled with an explanatory state, not a silent failure. Nest captures this at sale; it is not an afterthought in settings.

### 5.2 Consent & Communication Ledger
Append-only record of every opt-in and opt-out: data subject, purpose, channel, timestamp, source artefact, proof. Direct marketing under POPIA is opt-in and the burden of proof sits with the responsible party, so proof must be retrievable in one query. `NotifyPort` refuses to send marketing-class messages without a matching consent record. Service and transactional messages are a separate class with separate rules.

### 5.3 Restricted Data Vault
For ID numbers, RICA documents, death certificates, health notes, bank references. Field-level encryption, masked by default in list and detail views, unmask is an audited action with a reason, need-to-know permission separate from ordinary record access, and a retention timer per class. `DATA_CLASSIFICATION.md` already defines the classes; the vault is its enforcement.

### 5.4 Mandate Vault
`Mandate(party, type: debicheck|eft_debit|registered_mandate|card|rtp, authentication_evidence, terms{amount, frequency, day, adjustment_rules}, status)`. A collection instruction must reference an active mandate and must be validated against its terms before submission. `Dispute` has its own state machine with the 60-day window as a first-class date calculation. This is the difference between a collections module and a billing table with a "debit order" checkbox.

### 5.5 Fiscal Document Service
The invoice as a structured, immutable, versioned document: supplier and recipient identity, VAT numbers, line-level VAT class, totals, sequence integrity. `FiscalPort` is a no-op today. When SARS publishes the standard and accreditation opens, it becomes a real adapter without touching billing logic. Design the document to hold a `fiscal_status` and `clearance_reference` from day one; leave them null.

### 5.6 Retention, DSR/PAIA, Breach
Retention policies per data class, an erasure/anonymisation job that respects legal hold, a data subject request workflow with a clock, and a breach register with a s22 notification flow. These are small features individually and a very strong sales story collectively — especially for MSPs, who are asked about their own compliance posture by their clients.

### 5.7 Audit
Every restricted-data view, every Assist approval, every mandate change, every state transition. Immutable, queryable, exportable.

### 5.10 Support access (break-glass)

**Zerpa is an operator under POPIA, not a responsible party, for tenant data.** Section 21 requires a written contract with each tenant obliging Zerpa to maintain s19 security measures and to notify the tenant immediately on reasonable grounds to believe personal information was accessed by an unauthorised person. Section 20 says an operator may process personal information only with the knowledge or authorisation of the responsible party, treating it as confidential. The responsible party stays accountable for its operator's non-compliance — which is exactly why tenants will ask hard questions about this before signing.

Support staff reading a tenant's RICA documents, a family's death certificate or a spa client's intake notes **is processing**. It needs designing before it is needed, not at 11pm during an incident.

**`SupportSession`** — every staff access to tenant data outside the tenant's own membership:
- **Scoped**: one company, a stated reason, a named record set where possible. Never platform-wide.
- **Time-boxed**: expires automatically. No standing access.
- **Authorised**: tenant-initiated (support request) or tenant-approved. Break-glass without prior approval is a separate, rarer path that notifies the tenant immediately and is reviewed after the fact.
- **Least privilege**: read-only by default. Acting as the tenant is a distinct escalation with its own record.
- **Restricted data stays restricted**: a support session does not bypass the Restricted Vault. Unmasking inside a session is separately audited, and some classes should be un-unmaskable by support entirely.
- **Visible to the tenant**: a log they can read themselves, not just one Zerpa can produce on request. This is a trust asset, not just a control.
- **Audited immutably**: who, when, why, what was viewed, what was changed.

The corresponding commitments (breach notification path, sub-operator list, data location, deletion on termination) belong in Zerpa's operator agreement. That is a legal document and needs a lawyer — it is named here so it is not forgotten, not drafted here.

### 5.8 Consumer Commerce Rules (CPA engine)
POPIA governs data; the CPA governs the commercial transaction. Every vertical carries CPA obligations and they are the same obligations, so they belong in the kernel once.

**`DepositPolicy` / `CancellationPolicy`** — attached to an Offering or Agreement. Graduated forfeiture by notice period, rebooking credit, and a hard rule: **no cancellation charge where the reason is death or hospitalisation of the person the booking was for.** That exemption is not a discount an agent applies by hand; it is a policy branch with a reason code, because every vertical hits it and funeral hits it constantly.

**`PrepaidCredit`** — vouchers, spa packages, MSP prepaid block hours, restaurant gift cards. Carries issue date, a three-year expiry floor, remaining balance, and a **liability flag**: this is the customer's money, not revenue, until redeemed. Feeds `LedgerEntry` on issue and on redemption as two different event types. Getting this wrong is both a CPA breach and a revenue-recognition error.

**`FixedTermTerms`** — 20 business days' notice, reasonable penalty, automatic month-to-month continuation on expiry unless cancelled. Applies to MSP agreements, telecom subscriptions and spa memberships identically.

**`Estimate` → `Authorisation` → `Variance`** — the CPA s15 chain. The `Authorisation` records which of the three elections the consumer made (estimate / maximum cut-off / carte blanche), by whom, when, and through what channel. Work beyond the authorised scope requires a new `Authorisation` before it can be billed, and the invoice builder must **refuse to bill unauthorised lines** rather than warn about them. Automotive is the obvious consumer; MSP overage beyond included hours is the same shape.

**`PartsWarranty`** — minimum three months on new or reconditioned parts and labour; reconditioned or grey-market parts must be disclosed on the estimate.

### 5.9 Regulated Document Chains
Some verticals cannot legally deliver the service until a statutory document exists. This is a gating pattern, not paperwork.

`DocumentChain` declares an ordered set of required artefacts, who may produce each, and which work-item transition each one unblocks. The funeral pack declares DHA-1663 → DHA-1680 → BI-14, with BI-14 gating the transition to a scheduled service, and a separate branch for unnatural deaths routed via SAPS and forensic pathology. Telecom's RICA pack is the same pattern, already half-built — generalise it rather than writing a second one. Automotive's pre-work inspection under s65 is a lighter instance.

Chains are declared in the pack manifest and enforced server-side. A chain step may be marked `external_dependency` (Home Affairs, SAPS, an FPL) so the UI shows waiting-on-third-party as a real state rather than an overdue task.

---

## 6. Pack contract

A pack is **a Django module + a versioned manifest**. The manifest declares:

```
id                MSP | TELECOM | FUNERAL | SPA | RESTAURANT | AUTOMOTIVE | GENERIC
version           semver; pinned per company; upgrade is a migration
labels            party/work/offering label overrides per locale
navigation        sections, routes, icons — only for implemented screens
roles             role → permission matrix
workItemTypes     type → state machine (states, transitions, guards, SLA hooks)
offeringTypes     catalogue subtypes + pricing rules
resourceTypes     schedulable resources
stockBehaviour    whether/how work items consume stock
dashboardWidgets  widget id → order → required permission (see §6A.3)
setupSteps        what must be completed before go-live (see §6A.2)
documentChains    statutory artefact chains and the transitions they gate (§5.9)
requiredPorts     which ports must be configured before go-live
restrictedClasses which data classes this pack touches
regulatoryGates   what Regulatory Profile fields must be present to enable which flows
assistSkills      skill id → scope → approval class
portalSurfaces    what the customer/family/subscriber sees
seed              demo data
```

Hard rules:
- A pack **cannot** introduce a nav entry for an unimplemented screen.
- A pack **cannot** define a transition the API does not enforce.
- A pack **cannot** declare an Assist skill with auto-execute on a mutating action.
- A pack **cannot** emit ledger events directly; it triggers kernel billing/stock operations that emit them.
- Deprecated aliases resolve at load: `AUTO → AUTOMOTIVE`, `TECH → MSP | GENERIC`.

**Open decision — multi-pack tenants.** The current model is one vertical pack per company. In South Africa a large share of MSPs also resell fibre, LTE and VoIP, which is TELECOM behaviour inside an MSP tenant. Recommendation: keep **one primary pack** (drives nav, labels, default roles) and allow **secondary capability packs** that contribute record types and ports but not navigation identity. This needs a decision before the funeral pack, because it changes the manifest resolver. Flagged, not assumed.

---

## 6A. Pack selection, account setup and vertical scoping

### 6A.1 The pack belongs to the company, not the user or the session

A user does not "choose a vertical at login". **The company has a pack; the user logs into a company.** This distinction matters:

- A user with one membership lands straight in that company, with its pack resolved. No picker.
- A user with several memberships gets a **company picker** at login (or a switcher in the top bar). Choosing the company resolves the pack as a consequence. An MSP bookkeeper who also does the books for a spa sees two companies, not two verticals.
- The session carries `companyId`. The manifest resolves server-side from that company's pinned pack and version. **The client never sends a pack identifier** — same reasoning as never trusting a browser-supplied `tenantId`.

Getting this wrong the other way — a vertical selector in the user's profile — produces a user who can point a spa tenant at the MSP pack and see nav for records that do not exist.

### 6A.2 Account setup (Nest)

Pack selection happens once, at company creation, inside Nest:

1. **Choose the vertical.** Plain-language descriptions of what each pack does and, just as importantly, what it does not. The funeral card must say it handles arrangements and not policies; the restaurant card must say guest CRM around a POS, not a till. Setting expectations here prevents the worst churn.
2. **`GENERIC` is the holding state** while setup is incomplete, so a half-configured company is never in a broken vertical state.
3. **Pack-declared setup steps.** The manifest declares what this vertical needs before go-live: required Regulatory Profile fields (ICASA licence for TELECOM, Health certificate for FUNERAL, RMI/MIWA for AUTOMOTIVE), required ports, resource types to define, catalogue seed, roles to assign.
4. **Go-live gate.** A company is not live until its pack's required steps pass. Before that it is in setup, with seeded demo data clearly marked as demo.

### 6A.3 Dashboard and navigation resolution

Both resolve from the manifest, server-side, in one place:

- **Navigation** renders only sections the pack declares *and* the membership's role permits. Two filters, both server-side.
- **The dashboard is a manifest-declared widget set.** Each pack declares which widgets, in what order. MSP sees SLA breaches, utilisation and unbilled time. TELECOM sees orders awaiting RICA, failed collections, open faults. FUNERAL sees today's services, arrangements waiting on BI-14, chapel and hearse conflicts. SPA sees today's bookings, therapist utilisation, expiring vouchers. AUTOMOTIVE sees jobs awaiting authorisation, bay occupancy, variance approvals. RESTAURANT sees tonight's covers, deposits outstanding, large-party bookings.
- **A widget the pack does not declare is never rendered**, and a widget whose underlying feature is unimplemented is never declared. This is the no-placeholder-nav invariant applied to the dashboard.
- **Nav is resolved server-side and sent as a resolved tree — never a full nav list filtered on the client.** The tempting shortcut is a single navigation config in the frontend with `if (pack === 'MSP')` guards. That ships every vertical's screen names to every tenant, leaks pack identity and product roadmap in the bundle, and drifts the moment someone adds a section without a guard. The API returns *this company's* nav. The client renders what it is given and knows nothing about the other packs.
- **Labels come from the manifest too.** A spa does not have "tickets" and an MSP does not have "bookings". Shared kernel objects, different words, resolved server-side.
- **Widget data is company-scoped at the query, not filtered in the component.** A dashboard is the easiest place in the product to leak another tenant's aggregate, because aggregates feel anonymous and often skip the scoping that detail views get. Every widget query needs its own isolation test.

### 6A.4 Changing pack after go-live

**A pack change is a migration, not a setting.** Once a company has work items, agreements and invoices under one pack's record types and state machines, switching packs orphans them. Treat it as: platform-admin action, explicit data review, an audit record of who did it and why. There is no self-serve vertical dropdown in company settings, and adding one later will be requested — say no.

The realistic cases are narrower than they look: a tenant who picked wrong during setup (before any real data — allow freely while in `GENERIC`/setup), and a tenant who genuinely diversified (that is the multi-pack question above, not a pack switch).

---

## 7. Ports catalogue

| Port | Purpose | Stub today | Real candidates |
|---|---|---|---|
| `PsaPort` | Ticket/time bridge | Halo, Autotask, ConnectWise | same |
| `RmmPort` | Device/alert intake | webhook | Ninja, Datto, **Allocentra** |
| `ProvisionPort` | Service activation | radius, mikrotik, manual_fno | FNO APIs, RADIUS |
| `CoveragePort` | Address → feasibility | stub | FNO coverage APIs |
| `CollectPort` | Mandates + collections | PayFast, Netcash | + DebiCheck provider, PayShap Request |
| `FiscalPort` | Structured fiscal docs | **no-op** | future SARS accredited service provider |
| `LedgerPort` | **Ledger-event subscriber** | Sage, Xero export stubs | same; native GL becomes a peer subscriber on trigger |
| `PayrollPort` | Payroll hand-off | none yet | Sage Payroll, SimplePay |
| `NotifyPort` | Messaging | stub | WhatsApp BSP, SMS, SES |
| `IdentityPort` | ID/company verification | manual | CIPC lookup, ID verification bureau |
| `SignPort` | Signature on agreements/mandates | stub | e-sign provider |

Ports are stubs in CI. Every stub must be **visibly a stub in the UI** — this is a named item in the honesty pass.

---

## 8. Assist architecture

Three objects, no shortcuts:

1. `AssistProposal` — skill id, scope (company + records), a structured **diff** of what would change, rationale, cost estimate where relevant.
2. `AssistDecision` — human identity, timestamp, accept/reject/modify, immutable.
3. `AssistExecution` — runs only from an accepted decision; emits audit; reuses the same service layer and state machines as a human action, never a privileged path.

Approval classes: `read_only` (auto), `draft` (auto-creates an unsent draft), `mutating` (always requires a decision). There is no configuration that turns a `mutating` skill into an automatic one. Suspension, credits, deletion, sending, billing, stock adjustment and any RICA determination are permanently `mutating`.

---

## 9. Pack-by-pack composition

Each pack is expressed as bindings onto kernel objects. If a pack needs a new kernel object, that is a signal the kernel is wrong.

| Pack | WorkItem types | Offerings | Resources | Stock | Restricted classes | Key ports | Boundary |
|---|---|---|---|---|---|---|---|
| **MSP** | Ticket, Project, Onboarding | Service, block hours, licences | Technicians | Hardware resale | Client credentials | Psa, Rmm, Ledger, Collect | Not an RMM, not ConnectWise-depth |
| **TELECOM** | Order, RICA case, Fault, Port request | Plan, once-off, hardware | Installers | CPE, routers, SIMs | ID docs, RICA proofs | Coverage, Provision, Collect, Notify | Not carrier OSS, not national FNO retail |
| **FUNERAL** | First call, Arrangement, Service | Package, casket, transport | Chapel, hearse, staff | Caskets, consumables | Death certificate, next-of-kin ID | Notify, Collect, Sign | **No policies, premiums, benefits or claims** |
| **SPA** | Booking, Course of treatments | Treatment, membership, product | Room, therapist | Retail + back-bar | Health/intake notes | Notify, Collect | Not a POS till |
| **RESTAURANT** | Reservation, Event, Guest case | Menu item, function package | Table, section, staff | Minimal (not F&B stock control) | Guest dietary notes | Notify | Guest CRM *around* the POS |
| **AUTOMOTIVE** | Job card, Estimate, Approval | Labour op, part, service plan | Bay, lift, technician | Parts | Vehicle owner ID | Notify, Sign, Ledger | Not a DMS clone |

Funeral, spa, restaurant and automotive share one shape: **resource booking + approval + invoice**. Building `Resource`/`ResourceBooking` properly collapses four packs into configuration.

### 9.1 Operating loops per pack

Each pack's north star, stated as the loop a real operator runs. These are the acceptance targets.

**MSP** — signed agreement → onboard → Lite desk or PSA Bridge → time capture → recurring invoice → client portal, without a second spreadsheet. *(unchanged from the existing build plan)*

**TELECOM** — coverage → quote → RICA → provision → debit → suspend/reactivate → portal pay, without Excel. *(unchanged)*

**FUNERAL** — first call (often 2am, by phone, from a distressed family) → collection of the deceased and mortuary intake → arrangement conference with the family → package and extras selected → **statutory document chain (DHA-1663 → DHA-1680 → BI-14)** → chapel, hearse and staff scheduled → service delivered → invoice and account settlement → family portal for documents.
Gates: no scheduled service without BI-14. Unnatural death branches to SAPS/FPL and the arrangement waits on an external dependency. Repatriation adds DHA-132 and a destination-country branch.
**Hard boundary:** no policies, premiums, benefit records or claims. If a tenant asks for premium collection against a promised death benefit, that is an FSP-licensed insurance activity and Zerpa does not do it. Enforce at the manifest level so it cannot be configured in.

**SPA** — enquiry or online booking → therapist and room allocated → **deposit taken under a CPA-compliant policy** → intake/health notes captured (restricted class) → treatment delivered, back-bar stock consumed → retail sold → **package or voucher redeemed against a prepaid balance** → rebooking prompt → membership billed on a fixed term.
The CPA engine does the heavy lifting: deposit policy, cancellation scale, the death/hospitalisation exemption, three-year voucher expiry, prepaid liability, 20-day membership notice. Intake notes are health-adjacent and sit in the Restricted Vault.
**Boundary:** not a POS till. The treatment and retail lines produce an invoice; if the tenant needs a cash drawer and a card terminal at a counter, they keep their POS.

**RESTAURANT** — reservation (walk-in, phone, or an online channel) → table and section allocated across a service period → deposit for large parties or functions → guest arrives, covers seated → guest history and preferences updated → function packages quoted and invoiced → no-show and cancellation handled under policy → marketing to opted-in guests only.
This is the thinnest regulatory story of the six and the honest framing is **guest CRM and function sales around the POS**, not restaurant management. The POS owns the bill. Zerpa owns who the guest is, what they booked, what they're owed, and what you're allowed to send them. Dietary and allergy notes are restricted-class.
**Open:** whether reservations integrate with an existing SA booking channel or are captured natively. Needs a design partner before committing.

**AUTOMOTIVE** — booking → vehicle received with **pre-work inspection recorded** (s65) → diagnosis → **estimate issued** → **consumer elects estimate / cut-off / carte blanche and authorises** (s15) → parts reserved and consumed → work performed on a bay by a technician → **variance found → re-authorisation before further work** → quality check → invoice (unauthorised lines cannot be billed) → parts warranty recorded (s57, three months minimum) → service reminder.
Insurance and warranty work is a second commercial party: the payer is not the customer. Model `payer` separately from `customer` on the job card, because approval comes from the insurer while the vehicle belongs to the consumer. RMI/MIWA accreditation status sits in the Regulatory Profile — many insurers will not put a non-accredited workshop on a panel.
**Boundary:** not a DMS. No vehicle sales, F&I, or dealership stock.

### 9.2 What this proved about the kernel

Researching the four thin packs surfaced two things that would have become forks if each pack had been built in isolation:

1. **CPA obligations are identical across all six verticals** and were about to be written four times. They are now §5.8, in the kernel.
2. **Funeral's statutory document chain is the same pattern as telecom's RICA flow.** RICA is already half of a general `DocumentChain`. Generalising it (§5.9) means funeral, and later any regulated pack, is configuration.

Both were invisible while only MSP and Telecom existed. That is the argument for the conformance work in §10 — the kernel drifts toward whichever packs are exercising it.

---

## 10. Build sequence

Unchanged vertical order, with the architectural work slotted in.

1. **Now — honesty pass (MSP/Telecom).** Tenant isolation tests per viewset. FE/API state machine parity check. Every stub visibly labelled. Quality/GA checklist. No new stretch features.
2. **Then — `LedgerEntry` event seam.** Days, not weeks. Billing emits events; existing Sage/Xero export stubs become subscribers. Do this early precisely because it is cheap now and expensive later.
3. **Then — pack conformance harness.** Skeleton manifests for GENERIC, FUNERAL, SPA, RESTAURANT and AUTOMOTIVE — declarations only, no UI — validated in CI against the manifest schema. Cheap, and the only mechanical defence against the kernel drifting MSP-shaped. Every subsequent kernel change must keep all six manifests loading.
4. **Then — Compliance Spine v1.** Regulatory Profile, Consent Ledger, Restricted Vault enforcement, Audit. Retrofits onto MSP/Telecom; prerequisite for Funeral.
5. **Then — `Resource`/`ResourceBooking` kernel + inventory-lite**, specced against all four future packs at once rather than extrapolated from technician dispatch. Prerequisite for four packs.
6. **Then — Consumer Commerce Rules engine (§5.8) + `DocumentChain` (§5.9).** Generalise the existing RICA flow into `DocumentChain` rather than writing a second one for funeral.
7. **Then — Mandate Vault + dispute machine.** The April 2026 rule change makes this urgent for any Telecom design partner collecting by debit order. **Move this ahead of items 5–6 if a telecom design partner with live debit-order collections appears** — a real customer beats an architectural risk that has not bitten yet.
8. **Then — Funeral pack**, with the FSCA boundary and the BI-14 gate enforced in the manifest and in code.
9. **Then** spa, restaurant, automotive as configuration over the resource kernel and the CPA engine.
10. **Trigger-gated** — native general ledger (§2.2 triggers), purchasing/supplier orders.
11. **Deferred** — `FiscalPort` implementation (wait for the SARS spec), multi-pack tenancy (decide first).
12. **Never** — payroll, MRP, statutory accounting depth beyond the GL.

Nest must capture, at sale: MSP deskMode / existing PSA / RMM / accounting, telecom FNO list / RADIUS / debit provider, **and now the Regulatory Profile fields and which accounting package the tenant runs**. A design partner whose licence, VAT status and accounting package are unknown cannot be taken to go-live.

---

## 11. Assumptions and open questions

Nothing below has been assumed in the design; each needs the owner's answer.

1. **Multi-pack tenancy** — primary + secondary capability packs, or strictly one pack? Blocks the manifest resolver.
2. **Does Zerpa ever touch client money?** Collections currently assume the tenant's own merchant/collection account via `CollectPort`. If Zerpa aggregates funds, the regulatory picture changes entirely and needs advice before any code.
3. **Is the GL trigger already met?** If sales conversations are already asking "does it do my books?", that is stronger evidence than §2.2's reasoning and should move the decision. Track the question explicitly in Nest.
4. **Allocentra as `RmmPort` adapter** — first-party integration, arm's length, or out of scope for now?
5. **Hosting and data residency** — POPIA cross-border transfer obligations depend on where the data sits. Where is production hosted?
6. **Zerpa ICT (PTY) LTD vs Zezwe ICT** — one entity renamed, or two? Determines who signs operator agreements with tenants and whose VAT number appears on invoices.
7. **Who is the registered Information Officer**, and does Zerpa sign operator agreements with tenants? A sales blocker for any telecoms or health-adjacent tenant.
8. **Funeral pack design partner** — is one identified? The boundary rules are only as good as a real operator testing them.
9. **Restaurant reservations** — integrate an existing booking channel or capture natively? Blocks the restaurant pack and needs a design partner's answer, not ours.
10. **Automotive insurance panel work** — is panel/warranty work in scope for v1? It makes `payer` a separate party from `customer` on every job card, which is a model decision not a feature toggle.
11. **Commercial model** — per company, per seat, per pack, usage-based, or hybrid? Blocks nothing today but must be settled before the ledger seam, because metering is a retrofit through every money path (§2.8).
12. **Does Zerpa sign operator agreements with tenants, and who drafts them?** POPIA s21 makes this mandatory, not optional, and a telecom or funeral tenant will ask on the first call.
13. **SARS consultation** — comments close 16 Oct 2026. Worth a submission as a software provider? It shapes the standard Zerpa will implement.

---

## 12. Invariants (never regress)

1. Empty company filter never returns company-wide or cross-tenant data.
2. Missing membership / `X-Company-Id` → 403.
3. FE actions match server-enforced state machines exactly.
4. `skipRica` only under DEBUG/tests.
5. Assist mutating actions always require an explicit human decision.
6. No nav entry for an unimplemented screen.
7. Restricted data: need-to-know, masked, audited, retained to policy.
8. Automations cannot skip a required transition or a regulated approval.
9. No pack calls a provider SDK directly.
10. Invoices are immutable after issue.
11. Billing never calls an accounting adapter directly — it emits ledger events; adapters subscribe.
12. Work beyond an authorised estimate cannot be billed. The invoice builder refuses unauthorised lines; it does not warn about them.
13. A work item cannot pass a transition its pack's `DocumentChain` gates until the required artefact exists.
14. Prepaid credit is a liability, not revenue, until redeemed — and never expires earlier than three years from issue.
15. Every kernel change must leave all six pack manifests loading in CI.
16. The pack resolves server-side from the company on the authenticated session. The client never supplies a pack identifier.
17. Dashboard widget queries are company-scoped at the query, never filtered in the component — aggregates leak more quietly than detail views.
18. A pack change on a company with real data is a platform-admin migration with an audit record, never a settings dropdown.
19. A capability Zerpa does not own is a mirror: labelled as such, carrying freshness, with the external system winning conflicts by default.
20. Zerpa-owned records (agreements, mandates, consent, RICA cases, document chains, authorisations, invoices) are never mirrors.
21. Any new build must be justified as connective or regulated (§2.5) in its slice brief, or it does not get built.
22. Staff access to tenant data happens only inside a scoped, time-boxed, audited `SupportSession` that the tenant can see. No standing platform-wide access to tenant records.
23. A support session never silently bypasses the Restricted Vault.
24. Per-tenant costs (messaging, Assist) are metered as they are incurred, whether or not they are currently billed.
