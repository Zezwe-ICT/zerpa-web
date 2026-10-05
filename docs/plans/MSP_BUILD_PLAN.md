# MSP Build Plan — Gijima-shaped managed-services OS

**Status:** Active  
**Date:** 2026-09-10  
**Owner:** Platform + MSP pack  
**North star:** An SMB/mid-market MSP runs signed agreement → onboarding → ticket/SLA (Lite or Bridge) → time → recurring invoice → client portal → 30-day/QBR review **without a second spreadsheet**.  
**Parity target:** Gijima managed-services *operating loops* (not sovereign cloud / SOC / SI).  
**Related:** `docs/discovery/VERTICAL_CRM_RESEARCH.md`, `docs/discovery/MSP_TELECOM_BASELINE.md`, `docs/gates/BETA_ACCEPTANCE.md`, canvas `msp-gijima-parity`.

---

## 1. Baseline (today)

| Area | State |
|---|---|
| Agreements | Create/list; SLA minutes; MRR → recurring invoice job |
| Onboarding | Checklist + stage transitions |
| Tickets | Lite desk CRUD + time; FE/API transition mismatch |
| Bridge | `ExternalWorkRef` manual; desk mode cosmetic |
| RMM | Unauthenticated generic webhook → ticket |
| Portal | Invoices only |
| Missing | Offboarding, included hours/overage, sites, Xero/Sage, real PSA sync, `sla_breached` compute |

---

## 2. Non-goals (this plan)

- Full RMM / patch / EDR product
- Operating a 24/7 SOC or Sentinel as a service
- Sovereign cloud / data centre product
- Cloning ConnectWise/Halo ticket depth
- Enterprise SIAM consulting practice
- SAP / Oracle / HCM suites

---

## 3. Design partners

| Partner | Mode | Must prove |
|---|---|---|
| MSP-A (SMB, no PSA) | **Lite** | Ticket → resolution → invoice + portal |
| MSP-B (has Halo or Autotask) | **Bridge** | Keep desk in PSA; Zerpa owns onboarding + agreements + billing |

Nest must capture: `deskMode`, `existingPsa`, `existingRmm`, `accountingSystem`.

---

## 4. Phased delivery

### Phase M0 — Honesty & correctness (Week 1)

**Goal:** Stop shipping broken desk semantics before adding features.

| ID | Slice | Acceptance criteria |
|---|---|---|
| M0.1 | Align ticket state machine FE ↔ API | UI only offers `TICKET_TRANSITIONS` legal edges; illegal returns 400; vitest + API tests green |
| M0.2 | Compute `sla_breached` | On transition and list; dashboard `slaAtRisk` uses live field |
| M0.3 | Secure RMM webhook | Shared secret / HMAC; company resolved from signed mapping; reject anonymous; dedupe by external alert id |
| M0.4 | Nest gates desk mode | Bridge: hide “new internal ticket” primary CTA (deep-link / ExternalWorkRef first); Lite: full desk |

**Exit:** Beta gate “illegal transitions rejected” + safe RMM ingest.

---

### Phase M1 — Commercial spine (Weeks 2–3)

**Goal:** Agreements behave like managed-services contracts.

| ID | Slice | Acceptance criteria |
|---|---|---|
| M1.1 | Agreement commercial fields | `includedHours`, `overageRate`, `billingCadence`, amendment note, renew/cancel status |
| M1.2 | Recurring billing v2 | Invoice = MRR + billable overage (from time in period); remove hard-coded R450 stub; 15% VAT retained |
| M1.3 | Account sites | `Site` under CRM Account; assets + tickets optionally site-scoped |
| M1.4 | Agreement detail workspace | Staff can view SLA, MRR, hours burn, linked onboardings, invoices |
| M1.5 | Accounting export stub → Xero **or** Sage | Push issued recurring invoice (one provider in M1; second in M2) |

**Exit:** Design partner can issue month-end invoice from agreement + time without Excel.

---

### Phase M2 — Lifecycle (Weeks 3–4)

**Goal:** Estate takeover and exit are first-class.

| ID | Slice | Acceptance criteria |
|---|---|---|
| M2.1 | Onboarding polish | Default checklist templates; discovery questionnaire fields; blocker list; go-live gate requires checklist % |
| M2.2 | Asset import | CSV import preview → Asset rows for account/site |
| M2.3 | Offboarding workflow | Mirror stages: revoke → tools → final bill → archive; POPIA retention flag |
| M2.4 | Portal lifecycle | Client sees onboarding % + agreement PDF/link + invoices |

**Exit:** New client discovery→go-live→first recurring invoice on one account without dual spreadsheet (research 90-day metric).

---

### Phase M3 — Bridge v1 + portal trust (Weeks 5–6)

**Goal:** Mid-market partner keeps PSA; Zerpa owns commercial truth.

| ID | Slice | Acceptance criteria |
|---|---|---|
| M3.1 | Pick one PSA | Halo **or** Autotask (decide with MSP-B); adapter interface `PsaPort` |
| M3.2 | ExternalWorkRef sync | Upsert open/closed tickets; `external_url` deep-link; last_synced_at |
| M3.3 | Time import for billing | Closed/billable time from PSA → allocatable to agreement period |
| M3.4 | Portal Work | List open tickets (internal or bridged summary) + SLA status + “Open in PSA” |
| M3.5 | Portal Support CTA fix | Dashboard links to tickets/status, not invoices |

**Exit:** MSP-B runs month close in Zerpa while techs live in PSA.

---

### Phase M4 — Delivery maturity (Weeks 7–10)

**Goal:** Service manager day-one board without becoming ITIL theatre.

| ID | Slice | Acceptance criteria |
|---|---|---|
| M4.1 | Request vs Incident | Separate types + optional SLA profiles on agreement |
| M4.2 | Utilisation dashboard | Billable minutes / capacity; MRR; open onboardings; SLA at risk |
| M4.3 | Knowledge links | Runbook URL on ticket + onboarding step (no full KB yet) |
| M4.4 | QBR pack (Assist) | Approval-gated summary: tickets, SLA, hours, assets, risks |
| M4.5 | Email intake (optional) | M365/IMAP → ticket with dedupe; behind feature flag |
| M4.6 | Second accounting connector | Whichever of Xero/Sage was deferred |

**Exit:** Beta acceptance MSP checklist fully met + QBR demo for one partner.

---

### Phase M5 — Stretch (post-beta)

Only after M0–M4 stable:

- Problem / Change work types (linked tickets)
- Dispatcher / capacity board
- CSP license line-items (partner centre integrate)
- Multi-PSA connectors
- Projects (M365 cutover)
- SIAM-lite ExternalWorkRef rollup
- Sentinel/partner SOC alert → ticket (ingest only)

---

## 5. Shared enablers (coordinate with Telecom)

| Enabler | MSP need | Owner |
|---|---|---|
| Document vault | Agreement + onboarding docs | Core |
| Portal shell upgrades | Nav + live KPIs | Core |
| WhatsApp Business API | Client updates (Assist draft) | Core (P1) |
| Outbox + audit | All transitions | Core (exists) |
| VAT invoicing | Recurring packs | Billing (exists; deepen) |

---

## 6. Test & gate map

| Beta gate | Plan IDs |
|---|---|
| Two partners: ticket → resolution → invoice | M0, M1, M3 (Bridge path), Lite path |
| Agreements → recurring VAT invoices | M1.2 |
| RMM webhook open/dedupe | M0.3 |
| Portal company-scoped invoices | Exists; harden in M2.4 |
| Assist approval gating | M4.4 + existing Assist |

Add automated tests per slice; no slice Done without API test + empty/error UI states (PRODUCT_ENGINEERING_SPEC DoD).

---

## 7. Sequencing vs Telecom

| Week | MSP | Telecom (parallel) |
|---|---|---|
| 1 | M0 | T0 honesty |
| 2–3 | M1 | T1 catalog + RICA vault |
| 3–4 | M2 | T2 order workspace |
| 5–6 | M3 Bridge | T3 RADIUS + collect |
| 7–10 | M4 | T4 portal ClientZone-lite |

MSP remains launch priority; shared Document + Payment ports land when Telecom T3 needs them (MSP consumes accounting first).

---

## 8. Definition of Done (pack beta)

- [ ] MSP-A Lite: ticket → time → invoice → portal  
- [ ] MSP-B Bridge: onboarding + agreement billing; PSA deep-links work  
- [ ] Offboarding completable on one churned account  
- [ ] `sla_breached` accurate; utilisation visible  
- [ ] Nest Bridge vs Lite behaviour differs  
- [ ] No unauthenticated RMM ingest  
- [ ] Docs: runbook for design partners updated  
