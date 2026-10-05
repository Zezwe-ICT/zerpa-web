# Zerpa Product & Engineering Specification

**Version:** 3.0 · **Date:** 2026-09-09 · **Status:** Canonical (supersedes conflicting guidance in older docs)

## 1. Product intent
Zerpa is a South Africa–first multi-vertical business platform. Companies install a **Vertical Pack** on a shared CRM/operations kernel (Odoo/Zoho-style modularity without forking apps).

### Launch sequence
1. Platform foundation  
2. MSP beta  
3. ISP / telecom reseller (`TELECOM`) beta  
4. Funeral  
5. Spa  
6. Restaurant  
7. Automotive  

### Layers
- **Zerpa Core** — companies, people, CRM, work, billing, documents, workflows, portals, audit  
- **Vertical Packs** — domain records + opinionated UX  
- **Zerpa Assist** — tenant-scoped, approval-gated copilot  

## Architecture
See ADRs in `docs/adr/`. Modular TypeScript monolith in the sibling **`zerpa-api`** repository folder (not under `zerpa-web`), PostgreSQL, transactional outbox + workers, Next.js workspace (`apps/web`), shared types (`packages/shared-types`), manifests (`packages/vertical-manifests`).

```
Zerpa-dev/
├── zerpa-api/          # Express modular monolith API
└── zerpa-web/          # Next.js UI + shared packages
```


## 3. Workspace UX
- Staff: `/app/[companySlug]/...` (manifest-driven nav)  
- Platform admin: `/admin/...`  
- Customer portal: `/portal/[companySlug]/...` (authenticated, company-scoped)  

Patterns: role dashboard · list/board/calendar · record workspace · guided workflow · portal.

## 4. Onboarding (Nest)
Resumable 9-step setup: account → company/location → pack assessment → team → import → integrations → branding/VAT → Nest checklist → go-live + 30-day adoption.

## 5. Security baseline
- Membership-derived tenant context (never trust browser `tenantId` alone)  
- MFA, POPIA controls, audit logs, RLS  
- Guard all email/API routes  
- Portal invoices scoped by company membership, not vertical alone  

## 6. Document precedence
When older files conflict (`ZERPA_FRONTEND_SPECIFICATION.md`, `Progress.md`, `BUSINESS_ONBOARDING_FRAMEWORK.md`, `ARCHITECTURE.md`), **this document and ADRs win**. Legacy docs remain historical references until rewritten.

## 7. Definition of done (module)
Migration · API contract · permission matrix · audit events · loading/empty/error UX · analytics · docs · retention/export · tests · seeded demo · ops alerts.
