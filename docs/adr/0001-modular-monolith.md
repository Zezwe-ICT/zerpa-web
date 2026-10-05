# ADR-0001: Modular Monolith API

## Status
Accepted — 2026-09-09

## Context
Zerpa must support seven vertical packs on a shared CRM/operations kernel. Premature microservices would multiply deployment, tenancy, and transactional complexity before product-market fit.

## Decision
Implement a TypeScript modular monolith under the sibling folder `zerpa-api` (outside `zerpa-web`) with explicit domain modules (`identity`, `tenancy`, `crm`, `work`, `billing`, `automation`, `documents`, `communications`, `reporting`, `assistant`) and vertical packs under `zerpa-api/src/verticals/*`. Extract workers/queues (SQS) for async jobs; extract services only when telemetry proves a boundary needs independent scale.

## Consequences
- Single deployable API with clear package boundaries and shared PostgreSQL transactions.
- Vertical packs plug into core modules via manifests, commands, policies, and events.
- Future extraction remains possible without rewriting domain models.
