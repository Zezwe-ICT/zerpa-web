# Vertical CRM Research — What Each Pack Must Own

**Date:** 2026-09-09  
**Purpose:** Refine Zerpa build priorities from industry practice. Complements (does not replace) the modular platform plan.  
**Principle:** Zerpa is the **business operating system** for each vertical. Prefer integration over reinventing tools operators already run (especially MSP ticketing/RMM).

---

## Cross-cutting CRM spine (every vertical)

Every pack sits on the same core objects, renamed by manifest:

| Core concept | MSP | Telecom | Funeral | Spa | Restaurant | Automotive |
|---|---|---|---|---|---|---|
| Account / site | Client org + sites | Subscriber / premises | Family / estate | Client | Guest / group | Customer |
| Opportunity | Proposal / SOW | Quote / feasibility | Arrangement package | Membership / package | Event / catering | Estimate |
| Work item | *Optional* ticket bridge | Service order | Case | Booking | Reservation / event | Job card |
| Contract | Agreement / SLA | Service plan | Arrangement / policy* | Membership | Loyalty / house account | Service plan |
| Money | Recurring + T&M | Recurring + usage + dunning | Deposit → invoice | Deposit → POS | Deposit / tab | Estimate → invoice |
| Portal | Client portal | Subscriber portal | Family portal | Client booking | — (POS first) | Customer approvals |

\*Policy/claims is an optional regulated add-on, not core funeral CRM.

Shared platform capabilities every vertical needs: **people & roles, documents, timeline, tasks, WhatsApp/email, VAT invoices, imports, audit, Assist**.

---

## 1. MSP — internal process OS (not “another PSA desk”)

### Research takeaway
Industry practice splits **PSA** (business lifecycle: contracts, time, billing, projects, CRM) from **RMM** (monitoring, patch, remote, alerts). Mature MSPs already run ConnectWise / Autotask / Halo / Ninja / Datto. Competing head-on on ticketing alone is a weak entry.

**Zerpa MSP pack should win on the processes that sit around the desk:** sales→service handoff, client onboarding/offboarding, commercial agreements, utilisation & profitability, documentation readiness, vendor/partner coordination, and accounting sync — with **optional** ticket inbox *or* sync from an existing PSA/RMM.

### Jobs Zerpa must own
1. **Lead → proposal → signed agreement** (SOW, SLA tiers, MRR, included hours).
2. **Client onboarding project** (checklist, discovery questionnaire, site/asset import, tool deployment tracker, welcome kit, go-live gate, 30-day review / QBR).
3. **Commercial operations** (agreement amendments, renewals, credits, T&M vs block hours, invoice packs to Xero/Sage).
4. **Service delivery visibility** without owning every ticket: utilisation, SLA risk summary *imported* from desk, account health.
5. **Offboarding** (access revoke checklist, tool removal, final bill, archive, POPIA retention).
6. **Internal ops** (vCIO / QBR cadence, runbooks links, vendor contracts, technician capacity — not monitoring).

### Explicit non-goals (v1)
- Building a full RMM.
- Forcing replacement of an existing ticketing PSA when the partner already has one.
- Endpoint security / patch orchestration.

### Integration-first model
| Mode | When | Zerpa role |
|---|---|---|
| **Bridge** (preferred for design partners with a desk) | MSP has Autotask/CW/Halo | Sync clients, agreements, time, closed tickets for billing; RMM webhooks optional |
| **Lite desk** (SMB without PSA) | No existing desk | Lightweight request → assign → time → invoice; not a CW clone |
| **RMM ingest only** | Has RMM, weak PSA | Alert → work item or handoff to external ticket ID |

### Build modules (priority)
| Priority | Module | Why |
|---|---|---|
| P0 | Accounts/sites/contacts + agreements/SLA matrix + recurring billing | Commercial spine |
| P0 | **Client onboarding / offboarding workflows** | Differentiator; rarely polished in SMB tools |
| P1 | Time & utilisation → invoice allocation | Profitability |
| P1 | External ticket / RMM connector + “source system” ID on work | Avoid dual desks |
| P1 | Client portal: invoices, agreements, onboarding status, optional ticket deep-link | Trust |
| P2 | QBR pack / account health Assist skills | Expansion |
| P2 | Projects (migrations, M365 cutovers) | After commercial spine |

### MSP company onboarding in Zerpa (Nest)
Needs assessment must ask: *Do you already have a ticketing PSA? Which RMM? Which accounting?* Then install **Bridge** vs **Lite desk** pack variant.

---

## 2. ISP / Telecom reseller — BSS, not generic CRM

### Research takeaway
SA ISP/VoIP stacks (Splynx, eCirrus-class ERPs, CRM.COM-style BSS) centre on **subscriber lifecycle + billing + provisioning + RICA**, not lead boards. Zerpa should be the order-to-cash and compliance system of record, with adapters to RADIUS/MikroTik/FNO — not a carrier OSS.

### Jobs Zerpa must own
1. Lead → coverage/feasibility → quote → consent.
2. **RICA/KYC** capture, review, retention (masked IDs).
3. Order orchestration (supplier/FNO refs, field install, blockers).
4. Activation evidence → recurring bill + once-offs.
5. Debit-order / payment reconciliation, **dunning → suspend → reactivate**.
6. Outages / credit notes; CPE/SIM custody.
7. Subscriber portal (pay, status, documents).

### Build modules (priority)
| Priority | Module |
|---|---|
| P0 | Subscribers, RICA, orders, services, recurring invoice |
| P0 | Suspend/reactivate dunning |
| P1 | Feasibility/coverage status, CPE/SIM stock |
| P1 | RADIUS/FNO stub adapters → real partners |
| P2 | Number porting, usage rating (later) |

---

## 3. Funeral parlour — case OS + family experience

### Research takeaway
Funeral software (EverlyPro, Noorelia, etc.) is **case + checklist + documents + schedule + family portal + billing**, often faith/culture-specific workflows. Zerpa should not start with insurance-policy admin.

### Jobs Zerpa must own
1. First-call intake → deceased + next-of-kin.
2. Arrangement checklist (docs, burial/cremation, vendors).
3. Package quote → deposit → final invoice.
4. Chapel/hearse/staff schedule.
5. Family portal (status, uploads, e-sign, pay).
6. Aftercare / archive with sensitive-data controls.

### Non-goals (v1)
Policy/premium/claims administration (optional later pack).

---

## 4. Spa & wellness — booking + retention CRM

### Jobs Zerpa must own
1. Client profile (preferences, consents, allergies).
2. Bookings, deposits, waitlist, reminders (WhatsApp).
3. Therapist/room roster.
4. Packages / memberships / gift cards.
5. Checkout → rebook / membership upsell.
6. Consented treatment notes (non-clinical); gate medical-aesthetic separately.

### Non-goals (v1)
Full POS till replacement if they already have one — integrate first; retail stock light.

---

## 5. Restaurant — guest CRM around existing POS

### Research takeaway
Strong restaurant CRMs wrap **guest identity, reservations, events, loyalty, recovery** around a POS — they do not start by rebuilding KDS/till.

### Jobs Zerpa must own
1. Guest profiles (allergies, preferences, consent).
2. Reservations / waitlist / no-show recovery.
3. Catering / group-sales pipeline.
4. Feedback → recovery / loyalty campaigns.
5. Branch analytics; supplier signals later.

### Non-goals (v1)
Native till / KDS (keep as future add-on). Integrate local POS/payments first.

---

## 6. Automotive workshop — vehicle-centric service CRM

### Research takeaway
Workshop CRMs are **vehicle registry + job card + estimate approval + parts/labour + reminders**, often WhatsApp-first.

### Jobs Zerpa must own
1. Customer ↔ vehicle registry (make/model/reg/mileage/history).
2. Booking → inspection/photos → estimate → digital approval.
3. Job card status path + bay/tech planning.
4. Parts/labour → QA → invoice → collection.
5. Service reminders by time/mileage.

---

## Revised Zerpa build plan (on top of website audit)

### Phase A — Product honesty (from audit P0)
Keep as-is: company switcher, kill 404 nav, unify funeral surfaces, wire or flag billing, gate Nest Sales.

### Phase B — Vertical process spine (NEW priority order)

| Order | Pack | Build focus | Deliberately defer |
|---|---|---|---|
| 1 | **MSP** | Agreements, onboarding/offboarding checklist, commercial billing, Bridge mode to external tickets | Full ticketing clone |
| 2 | **Telecom** | Order→RICA→activate→bill→dunning | Carrier OSS / real-time charging |
| 3 | **Funeral** | Case checklist + family portal + docs | Policy admin |
| 4 | **Spa** | Bookings + memberships + consent | Clinical EMR |
| 5 | **Restaurant** | Guests + reservations + loyalty around POS | Native KDS |
| 6 | **Automotive** | Vehicle registry + job card + approvals | Full dealer DMS |

### Phase C — MSP-specific delivery slices
Executable plan: [`docs/plans/MSP_BUILD_PLAN.md`](../plans/MSP_BUILD_PLAN.md) (Gijima-shaped parity).  
Telecom executable plan: [`docs/plans/TELECOM_BUILD_PLAN.md`](../plans/TELECOM_BUILD_PLAN.md) (Afrihost-shaped parity).

1. **Needs assessment flag:** `hasExistingPsa` / `hasRmm` / `accountingSystem` → installs Bridge vs Lite.
2. **Client Onboarding workspace** (project-like checklist with stages: discovery → tooling → documentation → go-live → 30-day review).
3. **Agreement commercial engine** (MRR, included hours, overage rules, invoice generation).
4. **Work bridge object:** `ExternalWorkRef` (system, id, url, status) instead of forcing internal tickets.
5. **Lite request desk** only when Bridge is off.
6. **Portal:** onboarding progress + invoices + agreement docs (+ optional “open in your PSA” link).

### Phase D — Shared enablers
Document vault, WhatsApp/email timeline, imports, Assist skills per process (onboarding blockers, dunning risk, missing funeral docs — not “replace your technician”).

---

## Design-partner interview prompts (validate this research)

**MSP**
- Which PSA/RMM/accounting do you run today?
- Where does onboarding live (spreadsheet, Notion, PSA project)?
- What breaks most: renewals, hour burn, handoffs, documentation?
- Would you keep tickets in current PSA if Zerpa owned onboarding + billing?

**Telecom**
- Who is system of record for RICA today?
- FNO/RADIUS tools in use?
- Debit-order provider?

**Others**
- What is the first live transaction you need in 14 days?

---

## Success metrics by pack
| Pack | 90-day success |
|---|---|
| MSP | New client goes discovery→go-live checklist→first recurring invoice without dual spreadsheet |
| Telecom | Order→RICA→activate→first debit without Excel |
| Funeral | First call→arrangement checklist→deposit on one case |
| Spa | Book→consent→checkout→rebook |
| Restaurant | Reservation→visit note→recovery message |
| Automotive | Booking→approved estimate→invoice→reminder |
