# Beta acceptance scorecards

Build plans: [`docs/plans/MSP_BUILD_PLAN.md`](../plans/MSP_BUILD_PLAN.md) · [`docs/plans/TELECOM_BUILD_PLAN.md`](../plans/TELECOM_BUILD_PLAN.md)

## MSP beta
- Two design-partner MSPs can run ticket → resolution → invoice
- Agreements generate recurring invoices with VAT
- RMM webhook can open/deduplicate tickets
- Client portal shows company-scoped invoices
- Assist skills available with approval gating
- *(Plan adds: Bridge vs Lite behaviour differs; offboarding path; sla_breached accurate)*

## Telecom beta
- One ISP and one reseller can complete order → RICA → provision → activate → recurring bill
- Suspend/reactivate dunning path works without bypassing RICA history
- Outages and services are visible in staff UI
- Subscriber portal exposes invoices
- *(Plan adds: no prod skipRica; CollectPort payment; portal services/orders/pay)*

## Remaining packs
- Funeral case intake and transition path works against Django API
- Spa booking, restaurant reservation, and automotive job card paths are API-backed and navigable
- Placeholder navigation removed for supported pack routes
