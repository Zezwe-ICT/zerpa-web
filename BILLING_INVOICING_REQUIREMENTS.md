# Billing & Invoicing Backend Requirements

**Document Version:** 1.0  
**Date:** May 13, 2026  
**Status:** Ready for Backend Implementation  
**Priority:** Critical for Phase 3 (Invoicing Module)  
**Scope:** MVP - Using existing openapi.yaml specs only

---

## Executive Summary

This document outlines backend requirements (database schema changes and implementation details) needed to support the **Invoicing Module** in ZERPA using the 4 API endpoints already defined in `openapi.yaml`.

**Current State:**
- Frontend invoicing components exist (create, view, list)
- Mock data is functional for testing
- API endpoints are already spec'd in openapi.yaml
- Invoice template exists but uses hardcoded values

**Scope (MVP):**
- Implement 4 existing API endpoints from openapi.yaml
- Create supporting database schema
- Basic CRUD operations only
- Future phase will add: send email, mark paid, void, branding endpoints

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints (from openapi.yaml)](#api-endpoints-from-openapiyaml)
3. [Data Types & TypeScript Interfaces](#data-types--typescript-interfaces)
4. [Business Logic](#business-logic)
5. [Implementation Checklist](#implementation-checklist)

---

## Database Schema

### 1. Create `invoices` Table

**Rationale:** Store all invoices with status tracking and audit information.

```sql
CREATE TABLE invoices (
  id VARCHAR(36) PRIMARY KEY,               -- UUID
  
  -- Identification
  invoice_number VARCHAR(50) NOT NULL UNIQUE, -- Format: ZRP-YYYY-XXXX (or custom)
  tenant_id VARCHAR(36) NOT NULL,           -- Which business this invoice is for
  
  -- Type & Status
  type VARCHAR(50),                         -- SETUP, SUBSCRIPTION, AD_HOC, etc.
  status VARCHAR(50) DEFAULT 'DRAFT',       -- DRAFT, SENT, PAID, OVERDUE, VOID
  
  -- Amounts (all in ZAR unless specified)
  subtotal DECIMAL(12,2) NOT NULL,          -- Amount before tax
  tax_amount DECIMAL(12,2) NOT NULL,        -- VAT/Tax
  total DECIMAL(12,2) NOT NULL,             -- Subtotal + tax
  tax_rate DECIMAL(5,2) DEFAULT 15.00,      -- Tax percentage
  currency VARCHAR(3) DEFAULT 'ZAR',        -- Currency code
  
  -- Business Information (denormalized snapshot)
  tenant_name VARCHAR(255) NOT NULL,        -- Company name at time of invoice
  tenant_vertical VARCHAR(50),              -- FUNERAL, AUTOMOTIVE, RESTAURANT, SPA
  
  -- Dates
  issued_date DATE NOT NULL,                -- When invoice was created
  due_date DATE NOT NULL,                   -- Payment due date
  sent_at TIMESTAMP NULL,                   -- When invoice was sent to client
  paid_at TIMESTAMP NULL,                   -- When marked as paid
  voided_at TIMESTAMP NULL,                 -- When marked as void
  
  -- Tracking
  notes TEXT,                               -- Additional notes on invoice
  payment_method VARCHAR(50),               -- How payment was made (if paid)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),                   -- User ID who created
  
  -- Indexes for queries
  KEY idx_tenant_id (tenant_id),
  KEY idx_status (status),
  KEY idx_issued_date (issued_date),
  KEY idx_invoice_number (invoice_number),
  KEY idx_due_date (due_date),
  KEY idx_paid_at (paid_at)
);
```

### 2. Create `invoice_line_items` Table

**Rationale:** Store individual line items for each invoice (products/services billed).

```sql
CREATE TABLE invoice_line_items (
  id VARCHAR(36) PRIMARY KEY,               -- UUID
  invoice_id VARCHAR(36) NOT NULL,
  
  -- Item Details
  description VARCHAR(500) NOT NULL,       -- e.g., "The Nest — Monthly Subscription"
  quantity DECIMAL(10,2) NOT NULL,         -- How many units
  unit_price DECIMAL(12,2) NOT NULL,       -- Price per unit
  total DECIMAL(12,2) NOT NULL,            -- Quantity × Unit Price
  
  -- Metadata
  line_order INT DEFAULT 0,                -- Sort order on invoice
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Relationships
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  KEY idx_invoice_id (invoice_id)
);
```

---

## API Endpoints (from openapi.yaml)

**Reference:** These 4 endpoints are already defined in [openapi.yaml](openapi.yaml#L564-L650)

**Authentication Requirement:** All endpoints require valid JWT token in `Authorization: Bearer {token}` header

### 1. List Invoices

**Endpoint:** `GET /api/v1/billing/invoices`

**Purpose:** Retrieve all invoices for a tenant with optional filtering.

**Query Parameters:**
```
?tenantId=tenant-001
```

**Response (200 OK):**
```json
[
  {
    "id": "inv-abc123",
    "invoiceNumber": "ZRP-2025-0042",
    "tenantId": "tenant-001",
    "tenantName": "Dignity Funeral Home",
    "tenantVertical": "FUNERAL",
    "type": "SUBSCRIPTION",
    "status": "SENT",
    "subtotal": 16800.00,
    "taxAmount": 2520.00,
    "total": 19320.00,
    "taxRate": 15.00,
    "currency": "ZAR",
    "issuedDate": "2025-05-13",
    "dueDate": "2025-06-13",
    "sentAt": "2025-05-13T14:00:00Z",
    "paidAt": null,
    "voidedAt": null,
    "createdAt": "2025-05-13T10:30:00Z",
    "createdBy": "user-456"
  }
]
```

---

### 2. Create Invoice

**Endpoint:** `POST /api/v1/billing/invoices`

**Purpose:** Create a new invoice in DRAFT status.

**Request Body:**
```json
{
  "tenantId": "tenant-001",
  "type": "SUBSCRIPTION",
  "issuedDate": "2025-05-13",
  "dueDate": "2025-06-13",
  "lineItems": [
    {
      "description": "The Nest — Monthly Subscription",
      "quantity": 1,
      "unitPrice": 14800.00
    },
    {
      "description": "Premium Support Add-on",
      "quantity": 1,
      "unitPrice": 2000.00
    }
  ],
  "notes": "May 2025 subscription",
  "taxRate": 15.00
}
```

**Response (201 Created):**
```json
{
  "id": "inv-abc123",
  "invoiceNumber": "ZRP-2025-0042",
  "tenantId": "tenant-001",
  "tenantName": "Dignity Funeral Home",
  "type": "SUBSCRIPTION",
  "status": "DRAFT",
  "subtotal": 16800.00,
  "taxAmount": 2520.00,
  "total": 19320.00,
  "currency": "ZAR",
  "issuedDate": "2025-05-13",
  "dueDate": "2025-06-13",
  "lineItems": [
    {
      "id": "line-001",
      "description": "The Nest — Monthly Subscription",
      "quantity": 1,
      "unitPrice": 14800.00,
      "total": 14800.00
    }
  ],
  "notes": "May 2025 subscription",
  "createdAt": "2025-05-13T10:30:00Z",
  "createdBy": "user-456"
}
```

---

### 3. Get Invoice (Single)

**Endpoint:** `GET /api/v1/billing/invoices/{id}`

**Purpose:** Retrieve a single invoice with all line items.

**Path Parameters:**
```
id = inv-abc123 (UUID)
```

**Query Parameters:**
```
?tenantId=tenant-001
```

**Response (200 OK):**
```json
{
  "id": "inv-abc123",
  "invoiceNumber": "ZRP-2025-0042",
  "tenantId": "tenant-001",
  "tenantName": "Dignity Funeral Home",
  "tenantVertical": "FUNERAL",
  "type": "SUBSCRIPTION",
  "status": "SENT",
  "subtotal": 16800.00,
  "taxAmount": 2520.00,
  "total": 19320.00,
  "taxRate": 15.00,
  "currency": "ZAR",
  "issuedDate": "2025-05-13",
  "dueDate": "2025-06-13",
  "lineItems": [
    {
      "id": "line-001",
      "description": "The Nest — Monthly Subscription",
      "quantity": 1,
      "unitPrice": 14800.00,
      "total": 14800.00
    }
  ],
  "notes": "May 2025 subscription",
  "sentAt": "2025-05-13T14:00:00Z",
  "paidAt": null,
  "voidedAt": null,
  "createdAt": "2025-05-13T10:30:00Z",
  "createdBy": "user-456",
  "updatedAt": "2025-05-13T14:00:00Z"
}
```

---

### 4. Update Invoice

**Endpoint:** `PATCH /api/v1/billing/invoices/{id}`

**Purpose:** Edit invoice details (only allowed if status is DRAFT).

**Path Parameters:**
```
id = inv-abc123
```

**Request Body:**
```json
{
  "dueDate": "2025-06-20",
  "notes": "Updated payment terms",
  "lineItems": [
    {
      "id": "line-001",
      "description": "The Nest — Monthly Subscription",
      "quantity": 1,
      "unitPrice": 14800.00
    }
  ]
}
```

**Response (200 OK):** Updated invoice object (same structure as Get Invoice)

**Error Responses:**
```
400 Bad Request: Cannot edit invoice that has been sent
401 Unauthorized: Invalid or missing JWT token
403 Forbidden: User doesn't have access to this tenant
404 Not Found: Invoice not found
```

---

## Data Types & TypeScript Interfaces

**Location:** `packages/shared-types/src/index.ts`

### Core Interfaces

```typescript
/**
 * Invoice line item
 * Represents a single product/service on an invoice
 */
export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  lineOrder?: number;
}

/**
 * Invoice
 * Represents a complete invoice with line items
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;            // e.g., ZRP-2025-0042
  tenantId: string;
  tenantName: string;
  tenantVertical?: string;          // FUNERAL | AUTOMOTIVE | RESTAURANT | SPA
  type?: string;                    // SETUP, SUBSCRIPTION, AD_HOC, etc.
  status: string;                   // DRAFT, SENT, PAID, OVERDUE, VOID
  
  // Amounts
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;                  // e.g., 15 for 15%
  currency: string;                 // e.g., ZAR
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Dates
  issuedDate: string;               // ISO date
  dueDate: string;                  // ISO date
  sentAt?: string;                  // ISO datetime
  paidAt?: string;                  // ISO datetime
  voidedAt?: string;                // ISO datetime
  
  // Metadata
  notes?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * Request to create an invoice
 */
export interface CreateInvoiceRequest {
  tenantId: string;
  type?: string;
  issuedDate: string;               // ISO date: 2025-05-13
  dueDate: string;                  // ISO date: 2025-06-13
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
  taxRate?: number;                 // Default: 15
}

/**
 * Request to update an invoice
 */
export interface UpdateInvoiceRequest {
  dueDate?: string;
  notes?: string;
  lineItems?: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}
```

---

## Business Logic

### Tax Calculation

**Logic:**
- Tax applied when invoice is created
- Tax rate stored with invoice for historical records
- Formula: `tax_amount = subtotal × (tax_rate / 100)`
- Formula: `total = subtotal + tax_amount`

**Current Default:** 15% (South Africa VAT)

### Status Rules

**Valid statuses:**
- `DRAFT` — Initial state, can be edited
- `SENT` — Invoice sent to client, cannot be edited
- `PAID` — Payment received
- `OVERDUE` — Past due date, not yet paid
- `VOID` — Cancelled

**Future phases** will add status transitions (send, mark-paid, void). For MVP, status is set manually.

---

## Implementation Checklist

**Backend Developer's MVP Todo:**

### Database Setup
- [ ] Create `invoices` table
- [ ] Create `invoice_line_items` table
- [ ] Add indexes on all `KEY` and `FOREIGN KEY` columns
- [ ] Create database migration file
- [ ] Verify foreign key relationships

### API Endpoints - Core (MVP)
- [ ] `POST /api/v1/billing/invoices` — Create invoice
- [ ] `GET /api/v1/billing/invoices` — List invoices
- [ ] `GET /api/v1/billing/invoices/{id}` — Get single invoice
- [ ] `PATCH /api/v1/billing/invoices/{id}` — Update invoice (DRAFT only)

### Business Logic
- [ ] Tax calculation (subtotal × tax_rate%)
- [ ] Status validation (only DRAFT invoices can be edited)
- [ ] Line item total calculation
- [ ] Prevent editing after status changes from DRAFT

### Authorization & Validation
- [ ] Verify JWT token on all endpoints
- [ ] Tenant isolation (users can only see their own invoices)
- [ ] Admin bypass (ZERPA admins can see all)
- [ ] Validate amounts are positive numbers
- [ ] Validate line item quantities > 0
- [ ] Validate due_date >= issued_date
- [ ] Prevent duplicate line items

### Testing
- [ ] Unit tests for tax calculation
- [ ] Unit tests for line item totals
- [ ] Integration tests for CRUD operations
- [ ] Integration tests for authorization
- [ ] Test all error scenarios (bad inputs, auth failures, not found)

### Documentation
- [ ] Update TypeScript interfaces in shared-types
- [ ] API response examples
- [ ] Error handling documentation

---

## Priority & Effort Estimate (MVP)

| Item | Priority | Effort |
|------|----------|--------|
| Database schema | CRITICAL | 1 hour |
| CRUD endpoints | CRITICAL | 4 hours |
| Tax calculation | HIGH | 30 min |
| Authorization | CRITICAL | 1 hour |
| Validation | HIGH | 1 hour |
| Testing | MEDIUM | 2 hours |
| **TOTAL** | — | **9.5 hours** |

---

## Future Enhancements (Not MVP)

These will be requested in later phases:

- [ ] `POST /api/v1/billing/invoices/{id}/send` — Send via email
- [ ] `POST /api/v1/billing/invoices/{id}/mark-paid` — Record payment
- [ ] `POST /api/v1/billing/invoices/{id}/void` — Cancel invoice
- [ ] `PUT /api/v1/companies/{id}/branding` — Update company branding
- [ ] `GET /api/v1/companies/{id}/branding` — Get company branding
- [ ] `POST /api/v1/billing/invoices/generate-number` — Auto-generate invoice numbers
- [ ] Email sending on invoice actions
- [ ] PDF generation
- [ ] Invoice payment portal
- [ ] Automated invoice scheduling

---

**Document Status:** MVP Ready for Backend Development  
**Date Prepared:** May 13, 2026  
**Scope:** 4 Core API Endpoints from openapi.yaml  
**Next Phase:** Additional endpoints will be requested after MVP completion
