# Quality & GA gates

Use this checklist before promoting a pack from pilot → beta → GA.

## Isolation & security
- [ ] Cross-tenant account/ticket/order queries return only membership-scoped data
- [ ] Missing `X-Company-Id` membership returns 403
- [ ] Email Next.js routes require `assertRouteAuth`
- [ ] Portal layout requires authenticated company context
- [ ] Assistant actions that mutate records require explicit approval

## Workflow integrity
- [ ] MSP ticket transitions reject illegal jumps
- [ ] Telecom provisioning blocked until RICA approved
- [ ] Funeral/spa/restaurant/automotive transitions follow state machines
- [ ] Recurring MSP invoices apply 15% VAT correctly

## Compliance (South Africa)
- [ ] POPIA notices and retention fields present on documents
- [ ] RICA records store masked identity values only
- [ ] VAT configuration is company-aware
- [ ] Audit events written for company create, imports, invoices, activations

## Operability
- [ ] `/health` reports database availability
- [ ] Outbox processor marks message.send events processed
- [ ] Docker compose boots `db` + `api` + `web`
- [ ] CI runs Django checks and workflow tests

## Adoption / beta scorecard
- [ ] Design partners complete first live workflow in Nest checklist
- [ ] Ticket/order completion measurable in ops report
- [ ] Assistant acceptance/edit rate tracked from proposal decisions
- [ ] No verified cross-tenant access incidents
