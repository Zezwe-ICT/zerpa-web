# Telecom Build Plan — Afrihost-shaped connectivity BSS

**Status:** Active  
**Date:** 2026-09-10  
**Owner:** Platform + Telecom pack  
**North star:** A regional fibre/LTE reseller completes coverage → quote → RICA → FNO/RADIUS activate → debit → suspend/reactivate → portal pay **without Excel**.  
**Parity target:** Afrihost connectivity *operating loops* (ClientZone-class self-serve) — not hosting/cPanel/cloud, not national multi-FNO retail.  
**Related:** `docs/discovery/VERTICAL_CRM_RESEARCH.md`, `docs/discovery/MSP_TELECOM_BASELINE.md`, `docs/gates/BETA_ACCEPTANCE.md`, canvas `telecom-afrihost-parity`.

---

## 1. Baseline (today)

| Area | State |
|---|---|
| Subscriber / Order / RICA / Service / Outage | Models + list APIs; thin UIs |
| Provision | `radius_stub` invents circuit id |
| Activate | Creates one RECURRING invoice (no schedule) |
| Dunning | API suspend/reactivate only; no UI; no payment check |
| Portal | Static dashboard + invoices |
| Missing | Catalog, coverage engine, RICA docs vault, real adapters, debit collection, package change, FE/API order state alignment |

---

## 2. Non-goals (this plan)

- Carrier OSS / core network control plane
- Real-time online charging (early)
- Rebuilding Afrihost hosting / cPanel / domains
- National retail brand + mobile app store presence
- Wiring every SA FNO before one path works end-to-end
- Number porting / heavy usage rating (Phase T5+)

---

## 3. Design partners

| Partner | Profile | Must prove |
|---|---|---|
| ISP-A | Fibre reseller (1–2 FNOs) | Order → RICA → FNO/manual board → activate → debit |
| ISP-B | WISP / LTE (RADIUS/MikroTik) | Activate/suspend on RADIUS; recurring collect |

Nest must capture: FNO list, RADIUS/MikroTik yes/no, debit-order provider (Netcash/PayFast/other).

---

## 4. Adapter contracts (build once)

Define ports before partner-specific code:

```text
CoveragePort     address → { fno, products[], status }
ProvisionPort    order → { circuitId, externalRef, status }  // FNO or RADIUS
CollectPort      invoice → { paymentRef, status }            // PayFast / Netcash / debit
NotifyPort       (later) WhatsApp/SMS templates
```

Stubs remain for CI; production forbids `skipRica`.

---

## 5. Phased delivery

### Phase T0 — Honesty & correctness (Week 1)

**Goal:** One coherent order machine and safe RICA defaults.

| ID | Slice | Acceptance criteria |
|---|---|---|
| T0.1 | Unify order states FE ↔ API | Shared machine: `lead → qualified → quoted → rica_pending → provisioning → installing → active ↔ suspended` (+ failed/cancelled); UI buttons match API |
| T0.2 | Disable prod `skipRica` | Only allowed in `DEBUG`/test; beta gate: cannot provision without approved RICA |
| T0.3 | Reporting `arrears` KPI | Manifest KPI wired (even if 0 until collect exists) |
| T0.4 | Create UX | Staff can create Subscriber + Order from UI (helpers already in `telecom.ts`) |

**Exit:** Demo path works without API-only curls; RICA gate enforced.

---

### Phase T1 — Catalog, coverage, RICA vault (Weeks 2–3)

**Goal:** Afrihost-like “address → package” commercial start.

| ID | Slice | Acceptance criteria |
|---|---|---|
| T1.1 | Product catalog | Plans: fibre/LTE/VoIP; once-off + MRR; optional `fnoCode`; VAT-aware |
| T1.2 | Coverage table v1 | Address/area → FNO + available plan ids (CSV import OK); sets `coverage_status` |
| T1.3 | Quote on order | Order binds `planId`; fees snapshot from catalog |
| T1.4 | RICA document vault | ID + PoA as Document FKs; masked ID retained; reviewer sees docs; retention_until enforced in policy docs |
| T1.5 | Subscriber workspace | Single page: services, orders, RICA, invoices, timeline (replace list-only ops) |

**Exit:** Staff can sell a covered address into a RICA-pending order with vaulted docs.

---

### Phase T2 — Fulfilment workspace (Weeks 3–4)

**Goal:** Ops can run installs when auto-FNO isn’t ready (Afrihost reality: fallback team).

| ID | Slice | Acceptance criteria |
|---|---|---|
| T2.1 | Order detail + blockers | Blocker JSON editable; install dates; `upstream_order_ref` |
| T2.2 | Manual FNO board | Queue: rica approved → awaiting FNO; mark submitted / delayed / ready |
| T2.3 | ProvisionPort + RADIUS stub→MikroTik path | At least one real `ProvisionPort` impl for ISP-B **or** documented manual complete that still writes circuit/service |
| T2.4 | CPE/SIM fields UX | Capture serial/ICCID on activate; stock list optional thin table |
| T2.5 | Outage resolve | Status transitions; link impacted service ids; staff UI complete |

**Exit:** Order can move installing→active with real or ops-confirmed circuit id.

---

### Phase T3 — Money loop (Weeks 5–6)

**Goal:** Month-to-month collect + dunning like Afrihost cash discipline.

| ID | Slice | Acceptance criteria |
|---|---|---|
| T3.1 | Billing schedule | Once-off invoice on order confirm; recurring schedule on activate (not one-shot stub) |
| T3.2 | CollectPort v1 | PayFast **or** Netcash debit (pick with partners); reconcile webhook → invoice PAID |
| T3.3 | Dunning UI | Arrears queue; suspend calls ProvisionPort/RADIUS; reactivate on PAID |
| T3.4 | Credit note stub | Manual credit against outage (accounting export later) |
| T3.5 | Remove activate one-shot coupling | Activate ≠ sole invoice creator; scheduler owns recurrence |

**Exit:** Beta “first debit without Excel” + suspend/reactivate without bypassing RICA history.

---

### Phase T4 — ClientZone-lite portal (Weeks 7–8)

**Goal:** Subscriber self-serve for the connectivity loop.

| ID | Slice | Acceptance criteria |
|---|---|---|
| T4.1 | Portal services | List active/suspended services + plan name + status |
| T4.2 | Portal orders | Track order status (no internal blockers leakage) |
| T4.3 | Portal pay | Pay now / view invoices (CollectPort) |
| T4.4 | Portal docs | Download RICA/contract docs they uploaded or were issued |
| T4.5 | Outage banner | Open outages affecting their services |
| T4.6 | Kill static KPI shell | Dashboard from live APIs |

**Exit:** Telecom beta portal gate exceeded (invoices + status + pay).

---

### Phase T5 — ClientZone parity stretch (Weeks 9–12)

| ID | Slice | Acceptance criteria |
|---|---|---|
| T5.1 | Package change / cancel | Proration; new ProvisionPort modify where supported |
| T5.2 | Public coverage widget | Embeddable address check for ISP website |
| T5.3 | WhatsApp/SMS status | Order stage + outage templates via NotifyPort |
| T5.4 | Second FNO adapter | Or second payment rail |
| T5.5 | Field installer role UX | Mobile-friendly checklist for install evidence |

---

### Phase T6 — Later (post-parity)

- Multi-FNO catalog at address (Vuma/Openserve/Frogfoot…)
- LTE/mobile top-up + usage views
- Number porting (VoIP)
- Waitlist / notify-when-covered
- WHMCS/cPanel deep-link for hosting add-on (integrate, don’t rebuild)
- Usage rating / FUP

---

## 6. Shared enablers (coordinate with MSP)

| Enabler | Telecom need | When |
|---|---|---|
| Document vault | RICA ID/PoA | T1 |
| CollectPort / payments | Debit + pay-now | T3 (MSP uses accounting export in parallel) |
| Portal shell | Live nav/KPIs | T4 |
| WhatsApp | Status + care | T5 |
| Assist skills | order blockers, dunning risk | After T2/T3 data exists |

---

## 7. Test & gate map

| Beta gate | Plan IDs |
|---|---|
| Order → RICA → provision → activate → recurring bill | T0–T3 |
| Suspend/reactivate without bypassing RICA history | T0.2, T3.3 |
| Outages + services in staff UI | T2.5 + existing services page harden |
| Subscriber portal invoices | T4 (expand beyond invoices) |

Mandatory tests: RICA-before-provision (exists); add CollectPort webhook idempotency; order transition matrix; portal tenant isolation.

---

## 8. Sequencing vs MSP

| Week | Telecom | MSP (parallel) |
|---|---|---|
| 1 | T0 | M0 |
| 2–3 | T1 | M1 |
| 3–4 | T2 | M2 |
| 5–6 | T3 | M3 |
| 7–8 | T4 | M3/M4 overlap |
| 9–12 | T5 | M4 |

If capacity forces a single track: finish **MSP M0–M2** before Telecom T3 (payments), but do **not** delay Telecom T0–T1 — catalog/RICA vault unblocks demos.

---

## 9. Definition of Done (pack beta)

- [ ] ISP-A: covered address → RICA vault → order → activate → recurring invoice  
- [ ] ISP-B: RADIUS activate/suspend works on non-pay  
- [ ] CollectPort reconciles at least one live or sandbox payment  
- [ ] Portal shows services + orders + pay  
- [ ] No production `skipRica`  
- [ ] Order FE/API states identical  
- [ ] Partner runbook: FNO manual board + RADIUS config  
