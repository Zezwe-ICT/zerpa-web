# ADR-0004: Workflow State Machines vs Automation Rules

## Status
Accepted — 2026-09-09

## Context
Business-critical transitions (ticket resolution, service activation, invoice void, RICA approval) must be enforceable and auditable. Free-form automation can bypass controls.

## Decision
Critical paths use explicit workflow state machines with required fields, permissions, and side effects. Automations are trigger/condition/action rules that may create tasks, send messages, score records, or enqueue jobs—but cannot skip required transitions or regulated approvals.

## Consequences
- Vertical packs define state machines for their primary work items.
- Automation builder is safe-by-default and template-seeded per pack.
- Assistants propose transitions; humans (or approved policies) execute them.
