# ZERPA — Billing Module: API & Database Schema

Backend requirements to move the Billing module off its temporary in-memory
front-end store and onto the real API.

> **Context.** The frontend for the whole Billing module (Quotes, Invoices,
> Products & Services, Automated Invoices, Billing Settings) is already built and
> shipping. Each data function currently runs against a module-level in-memory
> store seeded from mock fixtures. This document lists the **endpoints** and
> **database tables** the backend must provide so those functions can be swapped
> to real `apiRequest(...)` calls with no UI changes.
>
> **Not Django.** The reference spec (`ZERPA_BILLING_SPEC.md`) mentioned Django /
> Celery / WeasyPrint — ignore that. This project's API is **Express + Prisma**
> under `/api/v1` (see `API/openapi.yaml`, `Progress.md`). Schemas below are
> stack-neutral; column names use snake_case, JSON payloads use camelCase to
> match the existing `Invoice` contract.

---

## 1. Conventions

| Aspect | Rule |
|---|---|
| Base URL | `/api/v1` |
| Auth | `Authorization: Bearer <jwt>` on every endpoint |
| Tenant scoping | `?tenantId=<companyId>` query param (as existing billing endpoints). All rows are scoped to the owning company/tenant. |
| JSON casing | **camelCase** (matches existing `Invoice` schema and the frontend types) |
| IDs | UUID (string) |
| Money | Decimal(12,2), ZAR only for v1 |
| Dates | `date` = `YYYY-MM-DD`; timestamps = ISO-8601 UTC |
| Errors | Existing envelope: `{ error, message, details }` with `AuthError` / `ForbiddenError` / `ValidationError` / `NotFoundError` responses |
| Source of truth for shapes | `packages/shared-types/src/index.ts` |

**Customers.** Billing documents reference a **customer**, which in this app is a
`CLOSED_WON` lead (see `lib/data/billing-customers.ts`). `customerId` /
`tenantId` on billing rows is that lead/customer id. No new customer table is
required — reuse the existing `leads` / customer entity. A read projection
endpoint is listed in §4.7.

---

## 2. Entities & relationships

```
BillingSettings (1 per company)

ProductService ──< QuoteLineItem >── Quote ──(convert)──> Invoice
        │                                                   │
        └──────< InvoiceLineItem >──────────────────────────┤
        │                                                   │
        └──< AutomatedConfigLineItem >── AutomatedInvoiceConfig
                                              │
                                              └──< AutomatedInvoiceOneTimeAddition

Invoice ──< Payment
Invoice ── quoteId ──> Quote            (source = 'converted_quote')
Invoice ── automatedConfigId ──> AutomatedInvoiceConfig (source = 'automated')

Customer (existing CLOSED_WON lead) ──< Quote / Invoice / AutomatedInvoiceConfig
```

---

## 3. Database schema

Enums first, then tables. All tables also carry `tenant_id` (FK → company/tenant)
and, where sensible, `created_by` (FK → users).

### 3.1 Enums

```
product_category      : managed_service | once_off | hardware | licence | project | other
product_billing_cycle : monthly | annually | once_off
discount_type         : none | percent | fixed
quote_status          : draft | sent | accepted | declined | expired | converted | void
invoice_status        : DRAFT | APPROVED | SENT | PAID | OVERDUE | PARTIALLY_PAID | CANCELLED | VOID
invoice_source        : manual | converted_quote | automated
invoice_type          : SETUP | SUBSCRIPTION | AD_HOC
payment_method        : eft | cash | card | other
automation_recurrence : monthly_indefinite | monthly_fixed_term | once
generation_mode       : draft | auto_send
one_time_status       : pending | billed | cancelled
```

### 3.2 `product_services`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | scope |
| name | text | required |
| description | text | default line-item description |
| category | product_category | |
| unit | text NULL | e.g. "month", "hour", "device" |
| unit_price | decimal(12,2) | ZAR |
| tax_rate | decimal(5,2) | default 15 |
| billing_cycle | product_billing_cycle | |
| is_active | boolean | default true (soft-delete = false) |
| created_at / updated_at | timestamptz | |

Index: `(tenant_id, is_active)`, `(tenant_id, category)`.

### 3.3 `quotes`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| quote_number | text | unique per tenant+year, `QUO-YYYY-XXXX` |
| customer_id | uuid FK → customer/lead | |
| customer_name | text | denormalised snapshot |
| contact_person | text NULL | |
| contact_email | text NULL | |
| status | quote_status | default `draft` |
| reference | text NULL | |
| issue_date | date | |
| expiry_date | date | "VALID UNTIL" |
| currency | text | default `ZAR` |
| sales_rep | text NULL | |
| subject | text NULL | |
| scope_of_work | text NULL | |
| terms_and_conditions | text NULL | |
| payment_terms | text NULL | |
| notes | text NULL | printed |
| internal_notes | text NULL | staff-only |
| discount_type | discount_type | default `none` |
| discount_value | decimal(12,2) | default 0 |
| subtotal | decimal(12,2) | computed server-side |
| discount_amount | decimal(12,2) | computed |
| tax_total | decimal(12,2) | computed |
| total | decimal(12,2) | computed |
| converted_invoice_id | uuid FK → invoices NULL | set on conversion |
| created_by | uuid FK NULL | |
| sent_at | timestamptz NULL | |
| created_at / updated_at | timestamptz | |

Index: `(tenant_id, status)`, `(tenant_id, customer_id)`, unique `(tenant_id, quote_number)`.

### 3.4 `quote_line_items`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| quote_id | uuid FK → quotes (cascade delete) | |
| product_service_id | uuid FK NULL | null = custom line |
| description | text | |
| quantity | decimal(12,2) | |
| unit | text NULL | |
| unit_price | decimal(12,2) | |
| discount_percent | decimal(5,2) | default 0 |
| tax_rate | decimal(5,2) | default 15 |
| line_total | decimal(12,2) | `qty × price × (1 − disc%)`, tax excl. |
| sort_order | int | |

### 3.5 `invoices`

Extends the **existing minimal** `invoices` table — add the columns below if not
present (all additive, nullable/defaulted so existing rows stay valid).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | existing |
| tenant_id | uuid FK | existing (= customerId) |
| invoice_number | text | `INV-YYYY-XXXX` (legacy rows may be `ZRP-…`) |
| customer_name | text | denormalised (`tenantName`) |
| customer_vertical | text | (`tenantVertical`) FUNERAL/AUTOMOTIVE/RESTAURANT/SPA |
| type | invoice_type | |
| status | invoice_status | **note expanded enum** |
| source | invoice_source | default `manual` |
| quote_id | uuid FK → quotes NULL | when converted |
| automated_config_id | uuid FK → automated_invoice_configs NULL | |
| reference | text NULL | |
| contact_email | text NULL | |
| sales_rep | text NULL | |
| subject | text NULL | |
| subtotal | decimal(12,2) | |
| tax_amount | decimal(12,2) | (`taxTotal`) |
| total | decimal(12,2) | |
| tax_rate | decimal(5,2) NULL | default 15 |
| currency | text | default ZAR |
| discount_type | discount_type | default none |
| discount_value | decimal(12,2) | default 0 |
| discount_amount | decimal(12,2) | computed |
| amount_paid | decimal(12,2) | derived from payments |
| balance_due | decimal(12,2) | `total − amount_paid` |
| issued_date | date | |
| due_date | date | |
| paid_at / sent_at / voided_at | timestamptz NULL | |
| notes | text NULL | |
| internal_notes | text NULL | |
| created_by | uuid FK NULL | |
| created_at / updated_at | timestamptz | |

Index: `(tenant_id, status)`, `(tenant_id, source)`, `(tenant_id, customer_id)`, `(tenant_id, due_date)`.

### 3.6 `invoice_line_items`

Same shape as `quote_line_items` but FK `invoice_id`. Keep a `line_total`
column; also retain the legacy `total` field in the API response (mirror of
`line_total`) for backward compatibility with existing consumers.

### 3.7 `payments`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| invoice_id | uuid FK → invoices (cascade) | |
| tenant_id | uuid FK | |
| amount | decimal(12,2) | |
| payment_date | date | |
| method | payment_method | |
| reference | text NULL | |
| notes | text NULL | |
| created_by | uuid FK NULL | |
| created_at | timestamptz | |

On insert/delete, recompute the invoice `amount_paid` / `balance_due` and
transition `status` (`PAID` when `amount_paid ≥ total`, else `PARTIALLY_PAID`).

### 3.8 `automated_invoice_configs`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | internal label |
| customer_id | uuid FK | |
| customer_name | text | snapshot |
| is_active | boolean | default true |
| recurrence | automation_recurrence | |
| start_date | date | |
| end_date | date NULL | null for indefinite |
| day_of_month | int | 1–28 |
| generation_mode | generation_mode | |
| payment_terms_days | int | default 30 |
| subject_template | text | supports `{month}`,`{year}`,`{client_name}` |
| notes_template | text NULL | |
| internal_notes | text NULL | |
| next_run_date | date | computed |
| last_run_date | date NULL | |
| created_by | uuid FK NULL | |
| created_at / updated_at | timestamptz | |

### 3.9 `automated_invoice_config_line_items`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| config_id | uuid FK (cascade) | |
| product_service_id | uuid FK NULL | |
| custom_description | text NULL | overrides catalogue |
| custom_unit_price | decimal(12,2) NULL | overrides catalogue |
| description | text | resolved description |
| unit | text NULL | |
| unit_price | decimal(12,2) | |
| tax_rate | decimal(5,2) | default 15 |
| quantity | decimal(12,2) | |
| sort_order | int | |

### 3.10 `automated_invoice_one_time_additions`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| config_id | uuid FK (cascade) | |
| billing_month | date | first-of-month |
| product_service_id | uuid FK NULL | |
| description | text | |
| quantity | decimal(12,2) | |
| unit | text NULL | |
| unit_price | decimal(12,2) | |
| tax_rate | decimal(5,2) | default 15 |
| notes | text NULL | internal |
| status | one_time_status | default `pending` |
| created_by | uuid FK NULL | |
| created_at | timestamptz | |

### 3.11 `billing_settings` (singleton per tenant)

One row per company. Fields (all as in `BillingSettings` type):
`invoice_prefix`, `quote_prefix`, `default_payment_terms_days`,
`default_vat_rate`, `default_quote_validity_days`,
`invoice_email_subject_template`, `invoice_email_body_template`,
`quote_email_subject_template`, `company_name`, `company_vat_number`,
`company_registration_number`, `company_postal_address`,
`company_delivery_address`, `bank_name`, `bank_account_number`,
`bank_branch_code`, `bank_branch_name`, `bank_swift_code`,
`proof_of_payment_email`, `logo_url`, `footer_notes`,
`overdue_reminder_days` (int[]).

### 3.12 `billing_counters` (numbering)

Guarantees gap-free sequential numbers per tenant/year/prefix.

| Column | Type |
|---|---|
| tenant_id | uuid |
| prefix | text (`INV` / `QUO`) |
| year | int |
| next_seq | int |

PK `(tenant_id, prefix, year)`. Allocate with a transactional
`SELECT … FOR UPDATE` (or atomic increment) so numbers never collide.

---

## 4. REST API endpoints

Each block notes the **frontend data function** that will call it (in
`apps/web/lib/data/*`). Server computes all money totals — never trust totals
from the client.

### 4.1 Products & Services — `lib/data/products.ts`

| Method | Path | Body / Query | Frontend fn |
|---|---|---|---|
| GET | `/api/v1/billing/products?includeArchived=true` | — | `getProducts`, `getActiveProducts` (`includeArchived=false`) |
| GET | `/api/v1/billing/products/{id}` | — | `getProductById` |
| POST | `/api/v1/billing/products` | `ProductService` (no id) | `createProduct` |
| PATCH | `/api/v1/billing/products/{id}` | partial `ProductService` | `updateProduct` |
| POST | `/api/v1/billing/products/{id}/archive` | — | `archiveProduct` (sets `isActive=false`) |
| POST | `/api/v1/billing/products/{id}/restore` | — | `restoreProduct` |

### 4.2 Quotes — `lib/data/quotes.ts`

| Method | Path | Body / Query | Frontend fn |
|---|---|---|---|
| GET | `/api/v1/billing/quotes` | `?status=&customerId=&search=` | `getQuotes` |
| GET | `/api/v1/billing/quotes/{id}` | — | `getQuoteById` |
| POST | `/api/v1/billing/quotes` | Quote (no id/number; line items incl.) | `createQuote` — server assigns `quoteNumber`, computes totals |
| PATCH | `/api/v1/billing/quotes/{id}` | partial Quote (incl. lineItems) | `updateQuote` — recompute totals |
| PATCH | `/api/v1/billing/quotes/{id}/status` | `{ status }` | `updateQuoteStatus` (sets `sentAt` when `sent`) |
| POST | `/api/v1/billing/quotes/{id}/duplicate` | — | `duplicateQuote` (new draft, new number) |
| DELETE | `/api/v1/billing/quotes/{id}` | — | `deleteQuote` |
| POST | `/api/v1/billing/quotes/{id}/convert` | `{ vertical? }` → returns **Invoice** | `convertQuoteToInvoice` |

**Convert semantics:** create a DRAFT invoice (`source='converted_quote'`,
`quoteId` set), clone line items, set quote `status='converted'` and
`convertedInvoiceId`. Return the new invoice.

### 4.3 Invoices — `lib/data/invoices.ts`

The internal Billing UI uses these (distinct from the existing client-portal
`getInvoices`/`getInvoiceById`, which stay as-is).

| Method | Path | Body / Query | Frontend fn |
|---|---|---|---|
| GET | `/api/v1/billing/invoices` | `?status=&source=&customerId=&search=` | `getBillingInvoices` |
| GET | `/api/v1/billing/invoices/{id}` | — | `getBillingInvoiceById` |
| POST | `/api/v1/billing/invoices` | Invoice (no id/number) | `createManualInvoice` — assign `INV-` number, compute totals |
| PATCH | `/api/v1/billing/invoices/{id}` | partial Invoice (incl. lineItems) | `updateBillingInvoice` |
| PATCH | `/api/v1/billing/invoices/{id}/status` | `{ status }` | `updateBillingInvoiceStatus` / `sendBillingInvoice` (`SENT`) / `voidBillingInvoice` (`VOID`) |
| POST | `/api/v1/billing/invoices/{id}/payments` | `{ amount, paymentDate, method, reference?, notes? }` → returns updated **Invoice** | `recordInvoicePayment` |

> `createInvoiceFromQuote` is fulfilled by the quote **convert** endpoint (§4.2);
> no separate call is needed.

Status rules the server owns:
- `amount_paid ≥ total` → `PAID`; `0 < amount_paid < total` → `PARTIALLY_PAID`.
- setting `SENT` stamps `sent_at`; `VOID`/`CANCELLED` stamps `voided_at`.

### 4.4 Automated Invoices — `lib/data/automated-invoices.ts`

| Method | Path | Body / Query | Frontend fn |
|---|---|---|---|
| GET | `/api/v1/billing/automated-configs` | — | `getAutomatedConfigs` |
| GET | `/api/v1/billing/automated-configs/{id}` | — | `getAutomatedConfigById` |
| POST | `/api/v1/billing/automated-configs` | AutomatedInvoiceConfig (no id) | `createAutomatedConfig` — compute `nextRunDate` |
| PATCH | `/api/v1/billing/automated-configs/{id}` | partial config (incl. lineItems) | `updateAutomatedConfig` |
| PATCH | `/api/v1/billing/automated-configs/{id}/active` | `{ isActive }` | `toggleAutomatedConfigActive` |
| DELETE | `/api/v1/billing/automated-configs/{id}` | — | `deleteAutomatedConfig` |
| POST | `/api/v1/billing/automated-configs/{id}/one-time-additions` | addition (no id) → returns updated config | `addOneTimeAddition` |
| PATCH | `/api/v1/billing/automated-configs/{id}/one-time-additions/{additionId}/cancel` | — | `cancelOneTimeAddition` |

### 4.5 Billing Settings — `lib/data/billing-settings.ts`

| Method | Path | Body | Frontend fn |
|---|---|---|---|
| GET | `/api/v1/billing/settings` | — | `getBillingSettings` (auto-create defaults if none) |
| PUT | `/api/v1/billing/settings` | partial `BillingSettings` | `updateBillingSettings` |

### 4.6 Numbering (internal)

No public endpoint. Number allocation happens inside the create handlers for
quotes and invoices using `billing_counters`. Prefixes come from
`billing_settings` (`invoicePrefix` / `quotePrefix`).

### 4.7 Billing customers (read projection) — `lib/data/billing-customers.ts`

Already satisfied by the existing CRM endpoint; no new endpoint required:

```
GET /api/v1/crm/leads?stage=CLOSED_WON&tenantId=...
```

The frontend maps each lead → `BillingCustomer { id, name, vertical,
contactPerson, contactEmail, contactPhone, vatNumber?, postalAddress?,
deliveryAddress?, paymentTermsDays? }`. **Optional enhancement:** if the
customer/lead record can store billing fields (VAT number, postal/delivery
address, default payment terms), expose them here so quotes/invoices/PDFs
prefill correctly instead of using seed defaults.

---

## 5. Background jobs (parity with spec — optional for v1)

Implement with a scheduler (node-cron / a worker), **not** Celery:

| Job | Cadence | Action |
|---|---|---|
| `generateAutomatedInvoices` | daily 06:00 SAST | For each active config with `nextRunDate = today`: build invoice from base line items + `pending` one-time additions (that month), create as DRAFT or auto-send per `generationMode`, mark additions `billed`, advance `nextRunDate`, deactivate finished fixed-term/once configs. |
| `markOverdueInvoices` | daily | `SENT`/`PARTIALLY_PAID` past `due_date` → `OVERDUE`. |
| `sendOverdueReminders` | daily | Per `billing_settings.overdueReminderDays`. Phase 2. |

These are not required to ship the UI — the frontend already models the data;
they automate generation later.

---

## 6. Frontend cut-over checklist

For each module, replace the in-memory store body with `apiRequest(...)` (the
function signatures already match the endpoints above):

- [ ] `lib/data/products.ts`
- [ ] `lib/data/quotes.ts`
- [ ] `lib/data/invoices.ts` (the `getBillingInvoices` / `createManualInvoice` /
      `recordInvoicePayment` / etc. block only — leave portal functions)
- [ ] `lib/data/automated-invoices.ts`
- [ ] `lib/data/billing-settings.ts`
- [ ] `lib/data/billing-customers.ts` (add billing fields to the lead projection)

No component or page changes are required. Keep server-side total computation
authoritative; the client's `lib/utils/billing-calc.ts` is only for live preview.

---

*Companion to `ZERPA_BILLING_SPEC.md`. Types: `packages/shared-types/src/index.ts`.
API conventions: `API/openapi.yaml`.*
