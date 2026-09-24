# SLICE-03 — Pack conformance harness

**Goal:** make it mechanically impossible for the kernel to drift MSP/Telecom-shaped.

**Why:** funeral, spa, restaurant and automotive are thin. While only two packs exercise the kernel, every kernel decision is made on evidence from two verticals, and the other four each end up needing a workaround. Workarounds become forks. This slice is cheap insurance against that.

**Scope boundary:** declarations and CI only. **No UI, no new screens, no nav entries.** A skeleton manifest that renders a navigable but empty pack would violate the no-placeholder-nav invariant.

## Tasks

### 1. Formalise the manifest schema

Extract the manifest schema into a validatable form in `packages/vertical-manifests` (JSON Schema or equivalent, plus a matching type in `packages/shared-types`). Fields per `docs/PLATFORM_ARCHITECTURE_SA.md` §6, including `stockBehaviour`, `regulatoryGates` and `documentChains`.

If the existing MSP and Telecom manifests do not conform, **that is a finding about the schema, not a reason to bend the manifests** — report the gap before changing either.

### 2. Write skeleton manifests

For GENERIC, FUNERAL, SPA, RESTAURANT, AUTOMOTIVE. Declarations only:
- work item types and their state machines (from §9.1 operating loops)
- resource types (from SLICE-02's table)
- offering types
- restricted data classes
- regulatory gates (FUNERAL: no insurance capability, Health certificate required; AUTOMOTIVE: RMI/MIWA status)
- document chains (FUNERAL: DHA-1663 → DHA-1680 → BI-14)
- `navigation: []` — empty, deliberately

These are **declarations of intent, not implementations**. Mark each `implemented: false` so nothing surfaces in the UI and nothing claims to work.

### 3. CI conformance test

A test that loads all seven manifests (including MSP and TELECOM) against the schema and fails on any that will not validate. Wire it into the affected-app test run so it cannot be skipped.

### 4. Kernel expressiveness check

For each skeleton manifest, assert that its declared work item types, resource types and document chains can be **expressed against current kernel models** without a pack-specific field. Where one cannot, do not add the field — write it up. Those gaps are the real output of this slice and they should feed SLICE-02 and the CPA engine slice.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`, plus a written gap report at `docs/audits/PACK_CONFORMANCE_<date>.md` listing every place a non-MSP pack could not be expressed in the current kernel. Do not fix those gaps in this slice.

**Check before reporting done:** no new nav entries, no new routes, no screen that implies an unbuilt pack works.
