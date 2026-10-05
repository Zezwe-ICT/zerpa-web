# ADR-0005: Zerpa Assist Safety

## Status
Accepted — 2026-09-09

## Context
A contextual assistant must help staff without leaking cross-tenant data or taking irreversible actions silently.

## Decision
Zerpa Assist retrieval is always filtered by company membership and role. Responses cite source record IDs. Sensitive fields are redacted. Tenant data is not used for model training by default. Actions that send messages, change state, bill, credit, suspend, delete, or make regulated decisions require explicit approval. Kill switch and per-feature opt-out are mandatory.

## Consequences
- Assistant gateway logs prompts, retrieved IDs, and proposed actions.
- Vertical packs register skills; skills cannot escalate privileges.
- Beta scorecards track acceptance/edit rate and policy violations.
