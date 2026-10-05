# SLICE-02 — Resource and booking kernel

**Goal:** one scheduling primitive that serves funeral, spa, restaurant, automotive *and* MSP/telecom dispatch. Built once, specced against all of them.

**Why this shape:** four of six packs are fundamentally resource-booking businesses. If this is extrapolated from MSP technician dispatch alone, it will need a workaround per pack and the pack model fails. See `docs/PLATFORM_ARCHITECTURE_SA.md` §9.1.

**Scope boundary:** scheduling and conflict detection only. Not billing, not the CPA deposit/cancellation engine (SLICE-04), not stock consumption.

## Assumptions to confirm before coding

1. Does any scheduling model already exist in `apps.msp` (dispatcher) or `apps.telecom` (installer checklist)? If yes, **this slice absorbs and replaces it** — do not build a parallel model. Report what you found.
2. New app `apps.scheduling`, or extend `apps.core`? Brief assumes `apps.scheduling`.

## The four shapes this must serve

Design against all four before writing a model. If a shape needs a special case, the model is wrong.

| Pack | Resource | Booking unit | Hard constraint |
|---|---|---|---|
| FUNERAL | Chapel, hearse, mortuary fridge, staff | Service slot, hours | A hearse cannot be at two services; chapel turnaround time between services |
| SPA | Treatment room, therapist, equipment | Appointment, 30–120 min | Therapist must be qualified for the treatment; room must suit it; back-to-back needs turnaround |
| RESTAURANT | Table, section, covers capacity | Sitting within a service period | Capacity is per-section and per-period, not per-slot; tables combine and split |
| AUTOMOTIVE | Bay, lift, technician | Job, open-ended duration | A job holds a bay until released; duration is an estimate that drifts |
| MSP/TELECOM | Technician, installer | Visit window | Travel time between sites; regional coverage |

## Models (`apps.scheduling`)

**`ResourceType`** — declared by the pack manifest, not hardcoded. Carries: whether it is capacity-based (restaurant covers) or exclusive (a hearse), whether it requires capability matching, default turnaround.

**`Resource`** — company-scoped, typed, with `capabilities` (a therapist's qualifications, a bay's lift rating), `capacity` where capacity-based, and availability.

**`AvailabilityRule`** — operating hours, service periods (lunch/dinner), staff shifts, blackout dates, public holidays (SA calendar).

**`ResourceBooking`** — links a work item to one or more resources for a time range. Multi-resource is the normal case, not an edge case: a funeral service books chapel *and* hearse *and* staff atomically, and a partial booking is invalid.

**`BookingConflict`** — detection must cover: double-booking an exclusive resource, exceeding capacity on a capacity-based one, capability mismatch, violating turnaround, and booking outside availability. Return **all** conflicts, not the first — an operator needs to see everything before rebooking.

## Required behaviours

- **Atomic multi-resource booking.** All resources or none. Test with a funeral service booking chapel + hearse + two staff where the hearse is taken.
- **Capacity vs exclusive** are both first-class. A restaurant section holding 40 covers across a dinner period is not an exclusive slot.
- **Open-ended holds.** An automotive job holds a bay until released, with no known end time. The model must not require `end_at` at creation.
- **Capability matching.** A booking against a therapist unqualified for the treatment is a conflict, not a warning.
- **Timezone:** Africa/Johannesburg throughout. Store UTC, present local. SA has no DST — do not add logic for it.
- **Tenant isolation:** resources and bookings are company-scoped; conflict detection must never consider another company's bookings.

## Tests (required)

- One test per shape in the table above, using that vertical's realistic constraint.
- Atomic failure: partial multi-resource booking rolls back entirely.
- Capacity boundary: the 41st cover in a 40-cover section is rejected.
- Capability mismatch rejected.
- Turnaround violation rejected.
- Tenant isolation on both resource list and conflict detection.
- Concurrency: two simultaneous bookings for the same exclusive resource — exactly one succeeds.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. Additionally: **all six pack manifests must still load** (see SLICE-03). Report which of the four shapes forced a model change, because that is the finding worth keeping.
