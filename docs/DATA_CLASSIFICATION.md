# Zerpa Data Classification

| Class | Examples | Controls |
|-------|----------|----------|
| **Public** | Marketing pages, public pricing | CDN cache OK |
| **Internal** | Product analytics aggregates | Staff RBAC |
| **Confidential** | Customer names, invoices, tickets, bookings | Company-scoped RBAC, TLS, audit |
| **Restricted** | ID numbers, RICA docs, death certificates, health/allergy notes, bank refs | Need-to-know roles, encryption at rest, retention schedules, access logs |
| **Secrets** | API keys, SMTP, JWT secrets, integration tokens | Vault/env only; never store client credentials in clear text |

## POPIA notes (South Africa first)
- Record lawful purpose and consent where required.
- Support data-subject access, correction, and deletion workflows.
- Operator agreements required for processors (email, storage, AI providers).
- Breach workflow and retention policies are mandatory before GA.
