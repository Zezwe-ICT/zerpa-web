# ADR-0003: Vertical Pack Manifests

## Status
Accepted — 2026-09-09

## Context
Hardcoded route trees and vertical-specific UIs duplicate CRM patterns and make pack activation ambiguous.

## Decision
Ship versioned manifests in `packages/vertical-manifests` that define navigation, labels, roles, onboarding steps, dashboards, workflow templates, and assistant skills per vertical. A company installs one primary pack; optional modules may be enabled later. Canonical vertical IDs: `MSP`, `TELECOM`, `FUNERAL`, `SPA`, `RESTAURANT`, `AUTOMOTIVE`, `GENERIC`.

## Consequences
- Workspace shell (`/app/[companySlug]/...`) is manifest-driven.
- Adding a vertical is primarily a pack + domain module, not a fork of the app.
- Placeholder navigation that advertises unimplemented screens is prohibited until the pack is beta-ready.
