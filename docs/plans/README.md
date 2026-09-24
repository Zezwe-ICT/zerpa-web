# Flagship build plans — index

**Date:** 2026-09-10  
**Packs:** MSP (Gijima-shaped) · Telecom (Afrihost-shaped)

| Plan | Path | North star |
|---|---|---|
| MSP | [`MSP_BUILD_PLAN.md`](./MSP_BUILD_PLAN.md) | Agreement → onboard → desk/Bridge → bill → portal |
| Telecom | [`TELECOM_BUILD_PLAN.md`](./TELECOM_BUILD_PLAN.md) | Coverage → RICA → provision → debit → portal |

## Parallel calendar (default)

| Week | MSP | Telecom | Status |
|---|---|---|---|
| 1 | M0 Honesty | T0 Honesty | **Done** |
| 2–3 | M1 Commercial | T1 Catalog + RICA vault | **Done (local)** |
| 3–4 | M2 Lifecycle | T2 Fulfilment | **Done (local)** |
| 5–6 | M3 Bridge + portal | T3 Money loop | **Done (local)** |
| 7–10 | M4 Maturity | T4 Portal · T5 stretch | **M4+T4+T5 done (local)** · M4.5/M4.6 done |
| 11+ | M5 stretch | T6 later | **M5/T6 stretch done (local)** |

### Week 1 shipped (2026-09-10)
- M0.1–M0.4 and T0.1–T0.4 complete (see prior notes)

### Week 2–3 shipped (2026-09-10)
- M1.1 Agreement `includedHours` / `overageRate` / cadence / amendment notes
- M1.2 Recurring billing uses included hours (no hard-coded R450 overage stub)
- M1.3 CRM `Site` model + `/crm/sites` API; assets optional `siteId`
- M1.4 Agreement detail workspace (`/agreements/[id]`) with hours burn + invoices
- T1.1 Telecom plans catalog API + UI on Orders
- T1.2 Coverage zones + lookup
- T1.3 Orders bind `planId` and snapshot fees
- T1.4 RICA vault Document FKs (+ auto stub docs by name)
- T1.5 Subscriber workspace (`/subscribers/[id]`)

### Week 3–4 shipped (2026-09-10)
- M2.1 Discovery questionnaire + go-live gate (≥75% checklist)
- M2.2 Asset CSV import (`entity=assets` preview/commit) + Assets UI
- M2.3 Offboarding kind (revoke→tools→final_bill→archive) + POPIA flag
- M2.4 Portal `/portal/msp/summary` + live MSP dashboard (onboarding %, agreements, tickets)
- T2.1 Order GET/PATCH: blockers, install date, upstream ref
- T2.2 Manual FNO board (`/telecom/fno-board` + status chips)
- T2.3 `ProvisionPort` + radius / mikrotik / manual_fno adapters
- T2.5 Outage resolve transitions + staff UI

### Week 5–6 shipped (2026-09-10)
- M3.1 `PsaPort` + Halo / Autotask stubs
- M3.2 `POST /msp/external-work/sync` upserts ExternalWorkRef with deep links
- M3.3 `POST /msp/psa/time-import` → billable TimeEntry for overage
- M3.4 Portal `/msp/work` — internal tickets + bridged PSA + “Open in PSA”
- M3.5 Dashboard Support CTA → `/msp/work` (not invoices)
- T3.1 Once-off on `rica_pending`; `BillingSchedule` on activate (not one-shot stub)
- T3.2 `CollectPort` PayFast/Netcash + `/webhooks/payments/:provider` → PAID
- T3.3 Dunning queue UI + payment-gated reactivate + RADIUS suspend
- T3.4 Credit note stub (`/billing/credits`)

### Week 7–8 shipped (2026-09-10)
- M4.1 Request vs incident + agreement `slaProfiles` applied at ticket create
- M4.2 `/reports/msp/utilisation` + Reports utilisation board
- M4.3 Runbook URL on tickets + onboarding checklist steps
- M4.4 QBR Assist skill (`qbr-pack`) + Generate QBR on agreement detail
- T4.1–T4.6 Telecom ClientZone-lite: `/portal/telecom/summary`, layout nav, live dashboard + outage banner, services, orders, pay, docs

### Weeks 9–12 shipped (2026-09-10)
- T5.1 Package change / cancel + monthly proration debit/credit (`/telecom/services/:id/change-plan|cancel`)
- T5.2 Public coverage widget `GET /public/telecom/:slug/coverage` + embed page `/coverage/[slug]`
- T5.3 NotifyPort WhatsApp/SMS stubs on order/outage/change/cancel → MessageLog + outbox
- T5.4 Portal pay rail picker (PayFast + Netcash)
- T5.5 Field installer `/installs` checklist; activate gated on complete checklist
- M4.5 Email intake webhook `/webhooks/msp/email` (feature-flagged + secret + dedupe)
- M4.6 Sage (+ Xero) accounting export stubs on `invoice.issued` via `process_outbox`

### Post-beta stretch shipped (2026-09-10)
- M5.1 Linked Problem/Change tickets (`parentTicketId` + children on detail)
- M5.2 ExternalWorkRef SIAM rollup (`/msp/external-work/rollup`)
- M5.3 Security/Sentinel webhook `/webhooks/msp/security` (dedupe)
- M5.4 ConnectWise PSA stub alongside Halo/Autotask
- T6.1 Multi-FNO compare (`plansByFno` on public + internal coverage)
- T6.2 Coverage waitlist + notify-when-covered (`CoverageWaitlist`)

### Stretch wave 2 shipped (2026-09-10)
- M5 Dispatcher board `/reports/msp/dispatcher` + `/dispatcher` UI; assignee PATCH
- M5 M365 cutover projects (`kind=project`, `PRJ-*`, cutover checklist)
- M5 CSP `licenseLines` on agreements → recurring invoice line items + Partner Centre URL setting
- T6 LTE usage + top-up + FUP overage (`/services/:id/usage|top-up`)
- T6 Number porting queue (`/telecom/ports` + `/porting`)
- T6 WHMCS/cPanel deep-links (`/telecom/settings` → portal hosting)

## Shared platforms to schedule explicitly

1. **Document vault** — Telecom T1 (RICA) + MSP M2 (agreements)  
2. **CollectPort / payments** — Telecom T3; MSP keeps Xero/Sage export in M1  
3. **Portal shell** — both M2/M3 and T4  
4. **WhatsApp NotifyPort** — after money loops (M4 / T5)

## Canvases

- MSP parity: workspace `msp-gijima-parity.canvas.tsx`  
- Telecom parity: workspace `telecom-afrihost-parity.canvas.tsx`  
- Combined execution board: `msp-telecom-build-plans.canvas.tsx`
