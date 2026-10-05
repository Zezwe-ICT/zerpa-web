# Discovery Notes — MSP & Telecom Design Partners

**Date:** 2026-09-09  
**Status:** Synthetic discovery baseline for Phase 0 (to be validated with live design partners)

## MSP — jobs to be done
1. Capture and triage client requests from email/portal/RMM alerts without duplicates.
2. Route by SLA priority and technician skill/availability.
3. Log time against agreements and convert billable work to invoices.
4. Track assets/sites per client for faster diagnosis.
5. Give clients a portal for tickets and invoices only for their tenant.

### Vocabulary
Ticket · Incident · Request · Problem · Change · Agreement · SLA · Asset / CI · Time entry · Queue · CSAT

### Exceptions
After-hours escalations, VIP clients, warranty vs billable, RMM alert storms, multi-site clients.

### Integrations (priority)
Email/Microsoft 365, WhatsApp, Xero/Sage, RMM webhooks (NinjaOne/Datto/N-able), Teams/Slack.

### Beta outcomes
Two MSPs complete ticket → resolution → invoice with SLA clocks and portal isolation.

## ISP / Telecom reseller — jobs to be done
1. Qualify address coverage and quote fibre/LTE/VoIP packages.
2. Capture RICA/KYC before activation.
3. Orchestrate supplier/FNO orders and field installs.
4. Activate service, start recurring billing, suspend/reactivate on non-payment.
5. Manage outages and credit SLAs.

### Vocabulary
Subscriber · Service · Circuit · CPE · SIM · Number · Feasibility · Order · Provisioning · RICA · Dunning · Porting

### Exceptions
Address not serviceable, incomplete RICA, supplier delays, partial activations, debit-order failures.

### Integrations (priority)
RADIUS/MikroTik adapters, FNO APIs, payment/debit-order providers, SMS/WhatsApp.

### Beta outcomes
One ISP + one VoIP reseller complete order → activation → recurring bill → suspend/reactivate.

## Interview checklist (live partners)
- [ ] Daily tools and spreadsheets replaced
- [ ] Must-have vs nice-to-have modules
- [ ] Compliance artifacts retained today
- [ ] Integration credentials availability
- [ ] Success metric for 90-day pilot
