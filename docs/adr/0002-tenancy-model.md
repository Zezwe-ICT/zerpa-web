# ADR-0002: Tenancy and Company Scoping

## Status
Accepted — 2026-09-09

## Context
Users can own or join multiple companies. Browser-supplied `tenantId` and `localStorage` company state are not trustworthy for authorization.

## Decision
Model hierarchy as `organization → company → location`. Every owned record carries `companyId` (and optionally `locationId`). Tenant context is derived exclusively from authenticated membership (JWT + membership lookup). PostgreSQL row-level security is applied as defense in depth. Cross-company relationships must fail validation.

## Consequences
- OpenAPI list endpoints no longer authorize solely via caller-supplied `tenantId`.
- Company switcher updates active membership context; server revalidates on every request.
- Multi-company executives can request consolidated views only across companies they belong to.
