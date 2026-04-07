# ZERPA ERP — FRONTEND WEB APP SPECIFICATION
### Build Document for AI Agent | Version 2.0 | Stack: Next.js 15 · Tailwind CSS v4 · shadcn/ui · AWS Cognito (Amplify SDK v6)

> **Architect Notes:** This document is the single source of truth for building the `apps/web` Next.js frontend. It is written frontend-first — all pages use mock data until the AWS backend is live. Read every section before writing a single component. This spec covers the Zerpa Internal Staff Dashboard, Client-Facing Portals, and the full Invoicing module (including client invoice creation, sending, and payment tracking).
>
> **v2.0 Design Note:** The design system has been fully modernised. All functionality from v1.0 is preserved exactly. Only the visual layer has changed — new tokens, typography, spacing scale, and component patterns. The brand is Zerpa. Invoice numbers use the `ZRP-YYYY-XXXX` format.

---

## TABLE OF CONTENTS

1. [Frontend Overview](#1-frontend-overview)
2. [Design System & Theming](#2-design-system--theming)
3. [App Router Structure](#3-app-router-structure)
4. [Mock Data Strategy](#4-mock-data-strategy)
5. [Authentication & Route Guards](#5-authentication--route-guards)
6. [Shared Layouts & Navigation](#6-shared-layouts--navigation)
7. [Internal Dashboard — Zerpa Staff](#7-internal-dashboard--zerpa-staff)
8. [CRM Module — Leads & Contacts](#8-crm-module--leads--contacts)
9. [Nest Sales Module](#9-nest-sales-module)
10. [Billing & Invoicing Module](#10-billing--invoicing-module)
11. [Client Invoice Portal](#11-client-invoice-portal)
12. [Vertical — Funeral Parlour (Priority 1 — Flagship)](#12-vertical--funeral-parlour-priority-1--flagship)
13. [Vertical — Automotive (Priority 2)](#13-vertical--automotive-priority-2)
14. [Vertical — Restaurant (Priority 3)](#14-vertical--restaurant-priority-3)
15. [Vertical — Spa / Wellness (Priority 3)](#15-vertical--spa--wellness-priority-3)
16. [Shared Components Library](#16-shared-components-library)
17. [State Management & Data Fetching](#17-state-management--data-fetching)
18. [Environment & Configuration](#18-environment--configuration)
19. [Folder Structure](#19-folder-structure)
20. [Sprint Build Order](#20-sprint-build-order)

---

## 1. FRONTEND OVERVIEW

### 1.1 What We Are Building

The `apps/web` Next.js 15 application serves two distinct user groups:

| Portal | Users | Purpose |
|--------|-------|---------|
| **Internal (Zerpa HQ)** | Zerpa staff — admins, agents, sales, support | Full ERP: CRM, billing, invoicing, Nest sales, HR, settings |
| **Client Portal** | External clients — tenant admins and staff | Vertical-specific dashboards: funeral, automotive, restaurant, spa |
| **Public** | Unauthenticated visitors | Landing page, login redirect |

### 1.2 Frontend-First Build Approach

**All pages are built with mock data first.** No AWS accounts are required to build or run the frontend. When the backend goes live, only the data layer (API calls) changes — UI, routing, and component logic stay the same.

Mock data lives in `lib/mock/` — one file per module. Every component imports from mock data today; tomorrow it imports from the API client.

### 1.3 Vertical Priority (Sales-Driven UI)

All lead lists, dashboards, and navigation ordering must reflect the sales priority hierarchy:

| Priority | Vertical | Badge |
|----------|----------|-------|
| **1 — FLAGSHIP** | Funeral Parlour | Violet `FLAGSHIP` |
| **2 — SECONDARY** | Automotive | Blue `PRIORITY` |
| **3 — STANDARD** | Restaurant | Emerald `STANDARD` |
| **3 — STANDARD** | Spa / Wellness | Emerald `STANDARD` |

Funeral Parlour always appears first in every list, dropdown, filter, and navigation item.

---

## 2. DESIGN SYSTEM & THEMING

### 2.1 Stack

- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — component library (Button, Table, Dialog, Sheet, Badge, Card, Form, Input, Select, Tabs, etc.)
- **Lucide React** — icon set (consistent `size={16}` outlined style, `stroke-width={1.5}`)
- **next/font** — `Outfit` (body + UI), `Instrument Serif` (display headings only), `JetBrains Mono` (code/numbers/IDs)

### 2.2 CSS Custom Properties (globals.css)

Define all tokens as CSS variables. Tailwind v4 reads these via `@theme`.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* ── Backgrounds ──────────────────────────── */
  --color-background:   #ffffff;
  --color-surface:      #fafaf8;
  --color-surface-2:    #f3f3ef;

  /* ── Text ─────────────────────────────────── */
  --color-foreground:   #0d0d14;
  --color-foreground-2: #3a3a4a;
  --color-muted-fg:     #7a7a8c;

  /* ── Borders ──────────────────────────────── */
  --color-border:       #e4e4e0;
  --color-border-2:     #d0d0ca;

  /* ── Brand ────────────────────────────────── */
  --color-primary:      #1d3461;   /* Zerpa navy — buttons, sidebar active, logo */
  --color-primary-fg:   #ffffff;
  --color-primary-hover:#0f2040;
  --color-primary-tint: rgba(29,52,97,0.08);
  --color-primary-ring: rgba(29,52,97,0.20);

  /* ── Semantic ─────────────────────────────── */
  --color-success:      #15803d;
  --color-success-bg:   rgba(21,128,61,0.08);
  --color-success-ring: rgba(21,128,61,0.20);

  --color-warning:      #b45309;
  --color-warning-bg:   rgba(180,83,9,0.08);
  --color-warning-ring: rgba(180,83,9,0.20);

  --color-danger:       #b91c1c;
  --color-danger-bg:    rgba(185,28,28,0.08);
  --color-danger-ring:  rgba(185,28,28,0.20);

  --color-info:         #1d4ed8;
  --color-info-bg:      rgba(29,78,216,0.08);
  --color-info-ring:    rgba(29,78,216,0.20);

  /* ── Vertical accents ─────────────────────── */
  --color-funeral:      #6d28d9;   /* Violet — Flagship */
  --color-funeral-bg:   rgba(109,40,217,0.08);
  --color-automotive:   #1d4ed8;   /* Blue — Priority */
  --color-automotive-bg:rgba(29,78,216,0.08);
  --color-restaurant:   #065f46;   /* Emerald — Standard */
  --color-restaurant-bg:rgba(6,95,70,0.08);
  --color-spa:          #065f46;   /* Emerald — Standard */
  --color-spa-bg:       rgba(6,95,70,0.08);

  /* ── Typography ───────────────────────────── */
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-sans:    'Outfit', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* ── Radius ───────────────────────────────── */
  --radius-sm:  4px;
  --radius:     6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;

  /* ── Shadows ──────────────────────────────── */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 48px rgba(0,0,0,0.11), 0 4px 12px rgba(0,0,0,0.06);
}
```

### 2.3 Typography Scale

Load fonts in `app/layout.tsx`:

```typescript
import { Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300","400","500","600","700"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  style: ["normal","italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400","500"],
});
```

**Scale — use these Tailwind classes consistently:**

```
page-title    → font-display text-3xl font-normal tracking-tight        (e.g. "Billing")
section-title → font-sans text-xl font-semibold tracking-tight          (card titles, dialog headings)
body-lg       → font-sans text-sm font-normal text-foreground           (standard body)
body-sm       → font-sans text-xs font-normal text-muted-fg             (labels, hints, timestamps)
label         → font-sans text-xs font-semibold uppercase tracking-wide text-muted-fg
mono          → font-mono text-sm                                        (IDs, amounts, invoice numbers)
mono-sm       → font-mono text-xs                                        (tags, codes, tiny values)
```

### 2.4 Colour Palette — Quick Reference

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#1d3461` | Sidebar active, primary buttons, logo mark |
| `primary-fg` | `#ffffff` | Text on primary |
| `background` | `#ffffff` | Page background |
| `surface` | `#fafaf8` | Sidebar, card hover, input backgrounds |
| `surface-2` | `#f3f3ef` | Deeper surfaces, table header rows |
| `border` | `#e4e4e0` | All borders |
| `border-2` | `#d0d0ca` | Hover state borders, form focus rings |
| `foreground` | `#0d0d14` | Primary text |
| `muted-fg` | `#7a7a8c` | Secondary text, placeholders |
| `success` | `#15803d` | Paid, Active |
| `warning` | `#b45309` | Pending, Overdue |
| `danger` | `#b91c1c` | Error, Void, Delete |
| `funeral` | `#6d28d9` | Flagship vertical accent |
| `automotive` | `#1d4ed8` | Priority vertical accent |
| `restaurant` | `#065f46` | Standard vertical accent |

### 2.5 Status Badge System

All status badges use the `StatusBadge` component with this config:

```typescript
// components/ui/status-badge.tsx
import { cn } from "@/lib/utils";

type BadgeVariant = {
  label: string;
  className: string;
};

export const STATUS_CONFIG: Record<string, BadgeVariant> = {
  // ── Invoice statuses ──────────────────────────────────────
  DRAFT: {
    label: "Draft",
    className: "bg-surface-2 text-muted-fg border border-border font-mono text-xs",
  },
  SENT: {
    label: "Sent",
    className: "bg-info-bg text-info border border-info-ring font-mono text-xs",
  },
  PAID: {
    label: "Paid",
    className: "bg-success-bg text-success border border-success-ring font-mono text-xs",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-danger-bg text-danger border border-danger-ring font-mono text-xs",
  },
  VOID: {
    label: "Void",
    className: "bg-surface-2 text-muted-fg border border-border line-through font-mono text-xs",
  },

  // ── Lead pipeline stages ──────────────────────────────────
  NEW: {
    label: "New",
    className: "bg-surface-2 text-foreground-2 border border-border text-xs",
  },
  CONTACTED: {
    label: "Contacted",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  QUALIFIED: {
    label: "Qualified",
    className: "bg-info-bg text-info border border-info-ring text-xs",
  },
  PROPOSAL: {
    label: "Proposal",
    className: "bg-[rgba(109,40,217,0.08)] text-funeral border border-[rgba(109,40,217,0.20)] text-xs",
  },
  NEGOTIATION: {
    label: "Negotiation",
    className: "bg-[rgba(234,88,12,0.08)] text-orange-700 border border-[rgba(234,88,12,0.20)] text-xs",
  },
  CLOSED_WON: {
    label: "Won",
    className: "bg-success-bg text-success border border-success-ring text-xs font-semibold",
  },
  CLOSED_LOST: {
    label: "Lost",
    className: "bg-danger-bg text-danger border border-danger-ring text-xs",
  },

  // ── Vertical priority ─────────────────────────────────────
  FLAGSHIP: {
    label: "Flagship",
    className: "bg-funeral-bg text-funeral border border-[rgba(109,40,217,0.20)] text-xs font-semibold tracking-wide uppercase font-mono",
  },
  PRIORITY: {
    label: "Priority",
    className: "bg-info-bg text-info border border-info-ring text-xs font-semibold tracking-wide uppercase font-mono",
  },
  STANDARD: {
    label: "Standard",
    className: "bg-success-bg text-success border border-success-ring text-xs tracking-wide uppercase font-mono",
  },

  // ── Nest sale statuses ────────────────────────────────────
  PENDING: {
    label: "Pending",
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  },
  SETUP: {
    label: "In Setup",
    className: "bg-warning-bg text-warning border border-warning-ring text-xs",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-success-bg text-success border border-success-ring text-xs font-semibold",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-danger-bg text-danger border border-danger-ring text-xs",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-surface-2 text-muted-fg border border-border text-xs",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[4px]", config.className)}>
      {config.label}
    </span>
  );
}
```

### 2.6 shadcn/ui Theme Overrides (`components.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  }
}
```

Override shadcn base tokens in `globals.css` to match Zerpa palette:

```css
:root {
  --background:          255 255 255;
  --foreground:          13 13 20;
  --card:                255 255 255;
  --card-foreground:     13 13 20;
  --popover:             255 255 255;
  --popover-foreground:  13 13 20;
  --primary:             29 52 97;
  --primary-foreground:  255 255 255;
  --secondary:           243 243 239;
  --secondary-foreground:58 58 74;
  --muted:               250 250 248;
  --muted-foreground:    122 122 140;
  --accent:              250 250 248;
  --accent-foreground:   13 13 20;
  --destructive:         185 28 28;
  --destructive-foreground: 255 255 255;
  --border:              228 228 224;
  --input:               228 228 224;
  --ring:                29 52 97;
  --radius:              0.375rem;
}
```

### 2.7 Layout Grid

- **Sidebar width:** 240px (collapsed icon rail: 64px)
- **Top bar height:** 56px
- **Content max-width:** 1280px centred
- **Content padding:** `px-6 py-6` (24px all sides)
- **Card grid:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- **Table containers:** full width, `overflow-x-auto` wrapper on mobile
- **Page header height:** 64px (title + subtitle + action button)

### 2.8 Component Defaults

Apply these defaults globally via shadcn overrides:

```
Button         → rounded-[6px], font-sans font-medium text-sm
Input          → rounded-[6px], border-border, bg-white, focus:ring-2 focus:ring-primary-ring
Card           → rounded-[12px], border-border, shadow-sm
Dialog         → rounded-[12px], max-w-md (default), shadow-xl
Table header   → bg-surface text-muted-fg text-xs uppercase tracking-wide font-semibold
Table row      → border-b border-border hover:bg-surface transition-colors
Badge (base)   → rounded-[4px] px-2 py-0.5 text-xs font-medium
Tabs           → border-b border-border, active tab has border-b-2 border-primary text-primary
```

---

## 3. APP ROUTER STRUCTURE

```
apps/web/app/
│
├── (public)/
│   ├── page.tsx                      # Landing page — Zerpa brand, product overview
│   └── login/
│       └── page.tsx                  # Login page → Cognito redirect (mock: direct login)
│
├── (internal)/                       # Zerpa staff only — auth guard: zerpa_* group
│   ├── layout.tsx                    # Sidebar nav + top bar + auth guard
│   ├── dashboard/
│   │   └── page.tsx                  # KPI overview, alerts, activity feed
│   ├── crm/
│   │   ├── page.tsx                  # Leads pipeline (sorted by priority — funeral first)
│   │   ├── [id]/
│   │   │   └── page.tsx              # Lead detail + timeline
│   │   └── contacts/
│   │       ├── page.tsx              # Contacts list
│   │       └── [id]/
│   │           └── page.tsx          # Contact profile
│   ├── nest-sales/
│   │   ├── page.tsx                  # Active Nest sales + provisioning tracker
│   │   └── [id]/
│   │       └── page.tsx              # Nest sale detail + checklist
│   ├── billing/
│   │   ├── page.tsx                  # Invoices list (all clients)
│   │   ├── [id]/
│   │   │   └── page.tsx              # Invoice detail + PDF preview
│   │   └── new/
│   │       └── page.tsx              # Create new invoice
│   ├── clients/
│   │   ├── page.tsx                  # All tenants / clients list
│   │   └── [id]/
│   │       └── page.tsx              # Client profile + their invoices + Nest status
│   ├── settings/
│   │   └── page.tsx                  # User profile, API keys, system settings
│   └── hr/
│       └── page.tsx                  # Staff list, leave requests
│
├── (client-portal)/                  # External clients — auth guard: tenant_* group
│   ├── layout.tsx                    # Client portal layout + top nav
│   │
│   ├── funeral/                      # PRIORITY 1 — Funeral Parlour
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── cases/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── suppliers/page.tsx
│   │   ├── compliance/page.tsx
│   │   └── invoices/page.tsx
│   │
│   ├── automotive/                   # PRIORITY 2
│   │   ├── dashboard/page.tsx
│   │   ├── job-cards/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── vehicles/page.tsx
│   │   └── invoices/page.tsx
│   │
│   ├── restaurant/                   # PRIORITY 3
│   │   ├── dashboard/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── kitchen/page.tsx          # KDS — WebSocket realtime
│   │   ├── menu/page.tsx
│   │   └── invoices/page.tsx
│   │
│   └── spa/                          # PRIORITY 3
│       ├── dashboard/page.tsx
│       ├── bookings/page.tsx
│       ├── therapists/page.tsx
│       └── invoices/page.tsx
│
└── api/
    └── webhooks/route.ts
```

---

## 4. MOCK DATA STRATEGY

### 4.1 Mock Data Files

All mock data lives in `apps/web/lib/mock/`. Every module has its own file.

```
lib/mock/
├── index.ts
├── invoices.ts
├── leads.ts
├── clients.ts
├── nest-sales.ts
├── funeral-cases.ts
├── automotive.ts
├── restaurant.ts
├── spa.ts
└── staff.ts
```

### 4.2 Mock Data Pattern

```typescript
// lib/mock/invoices.ts
import type { Invoice } from "@zerpa/shared-types";

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "ZRP-2025-0001",          // ← ZRP prefix
    tenantId: "tenant-001",
    tenantName: "Dignity Funeral Home",
    type: "SETUP",
    status: "PAID",
    amount: 4500.00,
    taxAmount: 675.00,
    currency: "ZAR",
    dueDate: "2025-02-01",
    paidAt: "2025-01-28",
    lineItems: [
      {
        description: "Nest Package — Once-off Setup Fee",
        qty: 1,
        unitPrice: 4500.00,
        total: 4500.00,
      },
    ],
    notes: "Payment received via EFT. Ref: ZRP-2025-0001",
    createdAt: "2025-01-15T08:00:00Z",
    updatedAt: "2025-01-28T14:22:00Z",
  },
  // ... more invoices
];
```

### 4.3 API Client Abstraction

```typescript
// lib/data/invoices.ts
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function getInvoices(): Promise<Invoice[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_INVOICES;
  }
  return apiCall<Invoice[]>("/billing/invoices");
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 200));
    return MOCK_INVOICES.find(i => i.id === id) ?? null;
  }
  return apiCall<Invoice>(`/billing/invoices/${id}`);
}
```

---

## 5. AUTHENTICATION & ROUTE GUARDS

### 5.1 Auth States

| State | Behaviour |
|-------|-----------|
| Unauthenticated | Redirect to `/login` |
| `zerpa_*` group | Access to `(internal)` routes only |
| `tenant_admin` or `tenant_staff` | Access to `(client-portal)/{vertical}` routes only |
| Wrong group for route | Redirect to `/unauthorized` |

### 5.2 Internal Layout Guard

```typescript
// app/(internal)/layout.tsx
import { fetchAuthSession } from "aws-amplify/auth/server";
import { redirect } from "next/navigation";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return <InternalShell>{children}</InternalShell>;
  }

  const session = await runWithAmplifyServerContext(
    async ({ cookies }) => fetchAuthSession({ cookies })
  );

  if (!session.tokens) redirect("/login");

  const groups = (session.tokens.accessToken.payload["cognito:groups"] as string[]) ?? [];
  if (!groups.some(g => g.startsWith("zerpa_"))) redirect("/unauthorized");

  return <InternalShell>{children}</InternalShell>;
}
```

### 5.3 Client Portal Layout Guard

Same pattern — checks for `tenant_admin` or `tenant_staff` group and extracts `custom:tenant_id` from JWT to scope all data.

### 5.4 Mock Auth (Development)

```typescript
// lib/mock/auth.ts
export const MOCK_ZERPA_USER = {
  sub: "mock-user-001",
  email: "agent@zerpa.co.za",
  fullName: "Test Agent",
  role: "zerpa_agent",
  tenantId: null,
};

export const MOCK_CLIENT_USER = {
  sub: "mock-tenant-user-001",
  email: "admin@dignityfuneralhome.co.za",
  fullName: "Funeral Admin",
  role: "tenant_admin",
  tenantId: "tenant-001",
  vertical: "FUNERAL",
};
```

---

## 6. SHARED LAYOUTS & NAVIGATION

### 6.1 Internal Staff Sidebar (`InternalSidebar`)

**Design:** White background with `border-r border-border`. No dark theme in sidebar — clean, light, professional. Active items use a left accent bar.

**Width:** 240px expanded · 64px collapsed (icon rail)

**Structure:**

```
┌─────────────────────────────┐
│  [Z] Zerpa          [← ≡]  │  ← Logo mark + collapse toggle
├─────────────────────────────┤
│  ● Dashboard                │  ← Active: bg-primary-tint, border-l-2 border-primary, text-primary
│                             │
│  ─ OPERATIONS ─             │  ← Section label: text-xs uppercase tracking-wide text-muted-fg px-3 py-1
│  ○ CRM                      │  ← Inactive: text-foreground-2, hover:bg-surface
│      └ Leads                │  ← Sub-item: pl-8 text-xs text-muted-fg
│      └ Contacts             │
│  ○ Nest Sales               │
│  ○ Billing                  │
│  ○ Clients                  │
│                             │
│  ─ ADMIN ─                  │
│  ○ HR                       │
│  ○ Settings                 │
│                             │
├─────────────────────────────┤
│  [Avatar] Jane Doe          │  ← User section at bottom
│  agent@zerpa.co.za          │
│  [Sign Out]                 │
└─────────────────────────────┘
```

**Nav Item Styling:**

```typescript
// Active state
"flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium
 bg-primary-tint text-primary border-l-2 border-primary transition-all"

// Inactive state
"flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium
 text-foreground-2 hover:bg-surface hover:text-foreground transition-all"

// Sub-item
"flex items-center gap-3 pl-8 pr-3 py-1.5 rounded-[6px] text-xs
 text-muted-fg hover:text-foreground hover:bg-surface transition-all"
```

**Icons:** Lucide icons, `size={16}` `stroke-width={1.5}` on all nav items.

| Nav Item | Icon |
|----------|------|
| Dashboard | `LayoutDashboard` |
| CRM | `Users` |
| Leads | `TrendingUp` |
| Contacts | `Contact` |
| Nest Sales | `Package` |
| Billing | `Receipt` |
| Clients | `Building2` |
| HR | `UserCheck` |
| Settings | `Settings` |

### 6.2 Internal Top Bar (`InternalTopBar`)

**Design:** White background, `border-b border-border`, `h-14`, sticky at top.

```
┌──────────────────────────────────────────────────────────────────────┐
│  [≡ toggle]   Billing                   [Search]  [🔔 3]  [JD ▾]   │
└──────────────────────────────────────────────────────────────────────┘
```

**Search:** `<SearchInput>` component — `w-64` input, `placeholder="Search..."`, keyboard shortcut hint `⌘K` shown as a small badge inside the input on desktop.

**Notification bell:** `<Bell size={16}/>` with a count badge (red dot with number). Popover on click shows:
- Overdue invoices (count)
- Leads awaiting follow-up
- Nest provisioning tasks incomplete
- Compliance docs missing

**User menu:** Avatar initials circle `bg-primary text-white` + name + role chip. Dropdown: Profile, Settings, Sign Out.

### 6.3 Client Portal Top Navigation (`ClientPortalNav`)

**Design:** White background, `border-b border-border`, `h-14`, sticky. Simpler than internal — just a horizontal nav.

**Funeral Parlour:**
```
[Z] Zerpa  |  Dashboard  Cases  Schedule  Suppliers  Compliance  Invoices  |  [User ▾]
```

**Automotive:**
```
[Z] Zerpa  |  Dashboard  Job Cards  Vehicles  Inventory  Invoices  |  [User ▾]
```

**Restaurant:**
```
[Z] Zerpa  |  Dashboard  Orders  Kitchen (KDS)  Menu  Invoices  |  [User ▾]
```

**Spa:**
```
[Z] Zerpa  |  Dashboard  Bookings  Therapists  Services  Invoices  |  [User ▾]
```

**Active link:** `text-primary font-semibold border-b-2 border-primary` (flush with bottom of nav bar).

**Inactive link:** `text-muted-fg hover:text-foreground` `text-sm font-medium`.

---

## 7. INTERNAL DASHBOARD — ZERPA STAFF

**Route:** `/internal/dashboard`

### 7.1 Page Header

```typescript
<PageHeader
  title="Dashboard"
  subtitle="Good morning, {firstName}. Here's what's happening today."
/>
```

### 7.2 KPI Cards (Top Row)

Four `<StatsCard>` components in a `grid-cols-4` grid.

**StatsCard design:**
- White background, `rounded-[12px]`, `border border-border`, `shadow-sm`
- Top: small icon in a tinted square `rounded-[8px] p-2` + label `text-xs text-muted-fg uppercase tracking-wide`
- Middle: value in `font-mono text-2xl font-semibold text-foreground`
- Bottom: trend line `text-xs text-muted-fg` with coloured delta chip

| Card | Icon | Value | Sub-label | Icon colour |
|------|------|-------|-----------|-------------|
| Active Clients | `Building2` | Count of `ACTIVE` tenants | `+X this month` | Blue tint |
| Monthly Recurring Revenue | `TrendingUp` | Sum of active subs × R1,500 | `↑ X% vs last month` | Green tint |
| Overdue Invoices | `AlertCircle` | Count of `OVERDUE` | `R{total} outstanding` | Red tint |
| Open Leads | `Users` | Count of non-closed leads | `{funeral count} funeral` | Violet tint |

### 7.3 Main Content Grid

Two-column layout below KPI row: `grid-cols-3 gap-4` — left column spans 2, right column spans 1.

**Left (2/3):**
- **Leads by Vertical** — Recharts `ResponsiveContainer` donut chart, ordered Funeral → Auto → Restaurant → Spa. Funeral segment: `#6d28d9`. Custom legend below chart with vertical names and counts.
- **Upcoming Actions** — Two sub-sections:
  - *Invoices due in 7 days* — compact list, max 5 rows, each row: invoice number (mono) + client name + due date + amount + status badge. "View All →" link.
  - *Nest provisioning* — progress items, max 3. Each: client name + progress bar (`bg-primary h-1.5 rounded-full`) + "X/8 tasks" label.

**Right (1/3):**
- **Recent Activity Feed** — chronological event list, last 20 events. Each item: vertical coloured dot + event description `text-sm` + relative timestamp `text-xs text-muted-fg` + linked entity name. Scroll container `max-h-[480px] overflow-y-auto`.

### 7.4 Activity Feed Item Design

```typescript
// Each event item in the feed
<div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
  <span className="mt-0.5 w-2 h-2 rounded-full bg-funeral flex-shrink-0" />
  <div className="flex-1 min-w-0">
    <p className="text-sm text-foreground">
      Invoice <span className="font-mono">ZRP-2025-0042</span> sent to{" "}
      <a className="text-primary hover:underline">Dignity Funeral Home</a>
    </p>
    <p className="text-xs text-muted-fg mt-0.5">2 hours ago</p>
  </div>
</div>
```

---

## 8. CRM MODULE — LEADS & CONTACTS

### 8.1 Leads List Page

**Route:** `/internal/crm`

**Page header:**
```typescript
<PageHeader
  title="CRM"
  subtitle="Lead pipeline — sorted by priority"
  action={<Button size="sm"><Plus size={14} className="mr-1.5" /> New Lead</Button>}
/>
```

**Filter bar** (below header, above table):
```
[Search leads...]  [Stage ▾]  [Vertical ▾]  [Agent ▾]  [Date range ▾]  [Clear filters]
```
All filter controls use `<Select>` or `<Popover>` multi-select with checkboxes. Verticals filter: Funeral pre-checked by default.

**Table design** — use `<DataTable>` component:
- Header row: `bg-surface text-muted-fg text-xs uppercase tracking-wide`
- Row hover: `hover:bg-surface transition-colors`
- Zebra striping: none (hover state is sufficient)

| Column | Width | Notes |
|--------|-------|-------|
| Priority | 80px | `<PriorityBadge>` — FLAGSHIP/PRIORITY/STANDARD |
| Vertical | 100px | Text label |
| Contact | auto | Name, linked → `/crm/contacts/[id]` |
| Company | auto | |
| Stage | 110px | `<StatusBadge>` |
| Assigned | 120px | Avatar initials (24px) + name |
| Est. Value | 100px | `font-mono` `R{amount}` |
| Last Activity | 100px | `text-muted-fg text-xs` relative date |
| Actions | 80px | `<DropdownMenu>` with View / Edit / Convert |

**Default sort:** `priority ASC, createdAt DESC`

### 8.2 Lead Detail Page

**Route:** `/internal/crm/[id]`

**Layout:** `grid grid-cols-3 gap-6`

**Left column (col-span-2):**

```
┌─────────────────────────────────────────────────────────────────┐
│  [←  Back to CRM]                                              │
│                                                                 │
│  Dignity Funeral Home       [FLAGSHIP] [PROPOSAL]              │
│  Priority lead · Created 12 Jan 2025                           │
├─────────────────────────────────────────────────────────────────┤
│  CONTACT                                                        │
│  Nomsa Mokoena · 082 000 1234 · nomsa@dignity.co.za           │
├─────────────────────────────────────────────────────────────────┤
│  PIPELINE STAGE                                                 │
│  ●──────●──────●──────●──────○──────○──────○                  │
│  New  Contact  Qualified  Proposal  Negot.  Won  Lost          │
│                                           ↑ current            │
│  [Move to Negotiation →]                                       │
├─────────────────────────────────────────────────────────────────┤
│  INTERACTION TIMELINE                                           │
│  [+ Log interaction]                                            │
│                                                                 │
│  ● Call — 15 Jan · "Discussed package options"                 │
│  ● Email — 12 Jan · "Sent intro deck"                          │
└─────────────────────────────────────────────────────────────────┘
```

**Stage pipeline component:**
- Horizontal stepper, `gap-0`
- Completed steps: filled circle `bg-primary w-3 h-3` + connecting line `bg-primary h-0.5`
- Current step: ring `ring-2 ring-primary ring-offset-2 bg-primary`
- Future steps: empty circle `border-2 border-border` + connecting line `bg-border h-0.5`
- Labels below each step: `text-xs text-muted-fg`, current step label: `text-primary font-medium`

**Right column (col-span-1) — Actions card:**
```
┌──────────────────────────────┐
│  Est. Value                  │
│  R54,000                     │
│                              │
│  Assigned Agent              │
│  [Agent select ▾]            │
│                              │
│  Created                     │
│  12 Jan 2025                 │
│                              │
│  ────────────────────────── │
│  [Convert to Client →]       │  ← visible only at PROPOSAL / NEGOTIATION
│  ────────────────────────── │
│  Notes                       │
│  [Textarea — auto-save]      │
└──────────────────────────────┘
```

### 8.3 Convert Lead Dialog (`<ConvertLeadDialog>`)

Three-step modal, `max-w-md`:

**Step 1 — Review:**
```
Convert "Dignity Funeral Home" to a client?

Vertical:       Funeral Parlour (Flagship)
Package:        The Nest
Setup fee:      R4,500 (once-off)
Free trial:     3 months
Monthly after:  R1,500/month

[Cancel]  [Confirm & Create Client →]
```

**Step 2 — Creating... (loading state)**

**Step 3 — Success:**
```
✓ Client created successfully

Dignity Funeral Home is now a Zerpa client.
Provisioning checklist is ready.

[View Provisioning Checklist →]
```

On confirm: creates Tenant + NestSale record, navigates to Nest Sales detail page. Success toast: `"Client created. Provisioning checklist is ready."`

### 8.4 Contacts List & Profile

**Route:** `/internal/crm/contacts`

Searchable table: Name · Company · Email · Phone · Leads count · Last contact date · Actions (View / Edit).

**Contact Profile** (`/internal/crm/contacts/[id]`):
- Contact details card (editable form fields inline, save on blur)
- Associated leads list (`<DataTable>` compact variant)
- Interaction history feed (same design as lead detail timeline)

---

## 9. NEST SALES MODULE

**Route:** `/internal/nest-sales`

### 9.1 Stats Row

Four inline stat chips above the table (not full KPI cards — lighter weight):

```typescript
// Compact stat chip
<div className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-surface border border-border">
  <span className="w-2 h-2 rounded-full bg-success" />
  <span className="text-sm font-semibold text-foreground">14</span>
  <span className="text-xs text-muted-fg">Active</span>
</div>
```

Chips: Active (green dot) · In Setup (amber dot) · Suspended (red dot) · Trial ending this week (orange dot)

### 9.2 Active Sales Table

| Column | Notes |
|--------|-------|
| Client | Linked to `/clients/[id]` |
| Vertical | `<StatusBadge>` |
| Status | `<StatusBadge>` PENDING / SETUP / ACTIVE / SUSPENDED |
| Setup Fee | `✓ Paid` (green) or `✗ Unpaid` (red) — use Lucide `CheckCircle` / `XCircle` icons |
| Trial End | Date + `text-muted-fg text-xs` days remaining |
| Billing Start | Date |
| Checklist | `<Progress value={X/8*100} className="h-1.5 w-24" />` + `text-xs text-muted-fg X/8` |
| Agent | Name |
| Actions | `<Button size="sm" variant="outline">View</Button>` |

### 9.3 Nest Sale Detail & Provisioning Checklist

**Route:** `/internal/nest-sales/[id]`

**Header card:**
```
┌──────────────────────────────────────────────────────────────┐
│  Dignity Funeral Home        [FLAGSHIP] [ACTIVE]            │
│  Assigned to: Jane Doe  ·  Started: 15 Jan 2025             │
└──────────────────────────────────────────────────────────────┘
```

**Provisioning Checklist card** — `rounded-[12px] border border-border bg-white p-6`:

```
PROVISIONING CHECKLIST
──────────────────────────────────────────────────────
☑  Landline + WhatsApp linked          Jane Doe  ·  15 Jan
☑  Microsoft 365 — Account 1 created   Jane Doe  ·  16 Jan
☐  Microsoft 365 — Account 2 created   [Assign to me]
☐  5-page website live
☐  Facebook profile set up
☐  Instagram profile set up
☐  IVR + call recording configured
☐  Bulk SMS account activated

3 / 8 complete  [████░░░░░░░░] 37%
```

Each checklist item:
```typescript
<div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
  <Checkbox
    checked={item.completed}
    onCheckedChange={() => toggleItem(item.id)}
    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
  />
  <span className={cn("flex-1 text-sm", item.completed && "line-through text-muted-fg")}>
    {item.label}
  </span>
  {item.completed && (
    <span className="text-xs text-muted-fg">
      {item.completedBy} · {formatDate(item.completedAt)}
    </span>
  )}
</div>
```

**All 8 complete — activation banner:**
```typescript
<div className="rounded-[8px] bg-success-bg border border-success-ring p-4 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <CheckCircle size={16} className="text-success" />
    <span className="text-sm font-medium text-success">All provisioning complete</span>
  </div>
  <Button size="sm" className="bg-success text-white hover:bg-green-700">
    Activate Client
  </Button>
</div>
```

**Subscription Timeline** below checklist:
- Simple vertical timeline with 4 milestones: Trial Start · Trial End (3 months) · First Billing Date · Monthly Cycle Day
- Each node: coloured dot + label + date

---

## 10. BILLING & INVOICING MODULE

**Route:** `/internal/billing`

### 10.1 Invoices List Page

**Page header:**
```typescript
<PageHeader
  title="Billing"
  subtitle="Manage invoices for all Zerpa clients"
  action={
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Bulk Actions</Button>
      <Button size="sm"><Plus size={14} className="mr-1.5"/>New Invoice</Button>
    </div>
  }
/>
```

**Filter tabs** — `<Tabs>` component flush with page header bottom:
```
All (42)  |  Draft (6)  |  Sent (18)  |  Paid (14)  |  Overdue (4 ← red badge)
```

Tab implementation:
```typescript
<TabsList className="border-b border-border rounded-none bg-transparent h-auto p-0">
  <TabsTrigger
    value="all"
    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary
               data-[state=active]:text-primary text-sm font-medium pb-3 px-4"
  >
    All
    <Badge className="ml-2 bg-surface text-muted-fg border border-border text-xs">42</Badge>
  </TabsTrigger>
  {/* Overdue tab — red badge */}
  <TabsTrigger value="overdue" ...>
    Overdue
    <Badge className="ml-2 bg-danger-bg text-danger border border-danger-ring text-xs">4</Badge>
  </TabsTrigger>
</TabsList>
```

**Table Columns:**

| Column | Width | Notes |
|--------|-------|-------|
| ☐ | 36px | Row select checkbox |
| Invoice # | 130px | `font-mono text-sm` e.g. `ZRP-2025-0042` |
| Client | auto | Linked to client profile |
| Type | 110px | Setup / Subscription / Ad-hoc chip |
| Subtotal | 100px | `font-mono` `R{amount}` |
| VAT (15%) | 90px | `font-mono text-muted-fg` |
| Total | 100px | `font-mono font-semibold` |
| Due Date | 100px | `text-danger font-medium` if past due |
| Status | 90px | `<StatusBadge>` |
| Sent | 100px | Date or `—` |
| Actions | 120px | Inline: View · Send · `<DropdownMenu>` for more |

**Bulk actions bar** (appears when rows selected, slides down above table):
```typescript
<div className="flex items-center gap-3 px-4 py-2 bg-primary-tint border border-primary-ring
                rounded-[8px] mb-3 animate-in slide-in-from-top-2">
  <span className="text-sm font-medium text-primary">{selected.length} selected</span>
  <Button size="sm" variant="outline">Send Selected</Button>
  <Button size="sm" variant="outline">Mark Selected Paid</Button>
</div>
```

### 10.2 Create Invoice Page/Dialog

**Route:** `/internal/billing/new`

Two-column layout: form on the left, live invoice preview on the right.

**Left — Form (`w-96`):**

```
Client *           [Searchable select ▾]
Invoice type *     [Select: Setup / Subscription / Ad-hoc]
Invoice date *     [Date picker — default: today]
Due date *         [Date picker — default: today + 30 days]

LINE ITEMS
──────────────────────────────────────────────────────────────────
#   Description                Qty   Unit Price     Total
1   [text input ............]  [1]   R[     0.00]   R0.00  [×]
[+ Add line item]

Quick add:  [Nest Setup Fee]  [Monthly Subscription]
──────────────────────────────────────────────────────────────────
                               Subtotal:    R0.00
                               VAT (15%):   R0.00
                               ─────────────────
                               Total:       R0.00

Notes
[Textarea optional]

[Save as Draft]   [Cancel]
```

**Quick-add preset buttons** — styled as small outline chips:
```typescript
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => addLineItem({ description: "The Nest Package — Once-off Setup Fee", qty: 1, unitPrice: 4500 })}
>
  + Nest Setup Fee  R4,500
</Button>
```

**Right — Live Preview (scrollable):**
Live-rendered `<InvoicePreview>` component that updates as user types. Shows watermark `DRAFT` diagonally in light grey.

On submit: creates `DRAFT` invoice. Toast: `"Invoice ZRP-2025-00XX created as draft."`

### 10.3 Invoice Detail Page

**Route:** `/internal/billing/[id]`

**Layout:** `grid grid-cols-3 gap-6`

**Left — Invoice preview (col-span-2):**

`<InvoicePreview>` component — A4 proportioned, white card with `shadow-lg rounded-[8px]`, print-ready:

```
┌──────────────────────────────────────────────────────────┐
│                                          INVOICE          │
│  [Z] ZERPA ICT (PTY) LTD               ZRP-2025-0042     │
│  123 Business Park                      Date: 15 Mar 2025 │
│  Sandton, Johannesburg 2196             Due:  14 Apr 2025 │
│  billing@zerpa.co.za                                      │
│  011 888 0000                                             │
│  ────────────────────────────────────────────────────── │
│  BILL TO                                                  │
│  Dignity Funeral Home                                     │
│  45 Main Road, Soweto, 1804                               │
│  billing@dignityfuneralhome.co.za                        │
│  ────────────────────────────────────────────────────── │
│  Description                    Qty   Unit      Total    │
│  ─────────────────────────────────────────────────────   │
│  Nest Monthly Subscription       1    R1,500    R1,500   │
│  ─────────────────────────────────────────────────────   │
│                                  Subtotal:    R1,500.00  │
│                                  VAT (15%):   R  225.00  │
│                                  ─────────────────────   │
│                                  TOTAL:       R1,725.00  │
│  ────────────────────────────────────────────────────── │
│  PAYMENT DETAILS                                          │
│  Bank: FNB  ·  Account: 62 800 123 456                   │
│  Branch: 250 655  ·  Ref: ZRP-2025-0042                  │
│                                                           │
│         [PAID — diagonal watermark, green, if PAID]       │
│         [OVERDUE — diagonal watermark, red, if OVERDUE]   │
└──────────────────────────────────────────────────────────┘
```

**Watermark implementation:**
```typescript
{status === "PAID" && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-35deg]">
    <span className="text-success/20 text-8xl font-black tracking-widest select-none">PAID</span>
  </div>
)}
```

**Right — Action sidebar (col-span-1):**

```typescript
<Card className="rounded-[12px] border border-border p-5 sticky top-20">
  {/* Status */}
  <div className="flex items-center justify-between mb-4">
    <span className="text-xs text-muted-fg uppercase tracking-wide">Status</span>
    <StatusBadge status={invoice.status} />
  </div>

  {invoice.sentAt && (
    <p className="text-xs text-muted-fg mb-4">
      Sent {formatDate(invoice.sentAt)}
    </p>
  )}

  {/* Divider */}
  <div className="border-t border-border my-4" />

  {/* Action buttons — shown/hidden based on status */}
  <div className="flex flex-col gap-2">
    {["DRAFT","SENT","OVERDUE"].includes(status) && (
      <Button className="w-full" onClick={openSendModal}>
        <Send size={14} className="mr-1.5" />
        {status === "DRAFT" ? "Send Invoice" : "Resend Invoice"}
      </Button>
    )}
    {["SENT","OVERDUE"].includes(status) && (
      <Button variant="outline" className="w-full" onClick={openMarkPaidModal}>
        <CheckCircle size={14} className="mr-1.5" />
        Mark as Paid
      </Button>
    )}
    <Button variant="outline" className="w-full" onClick={handleDownload}>
      <Download size={14} className="mr-1.5" />
      Download PDF
    </Button>
    {["DRAFT","SENT"].includes(status) && (
      <Button variant="ghost" className="w-full text-danger hover:text-danger hover:bg-danger-bg"
              onClick={openVoidDialog}>
        <Trash2 size={14} className="mr-1.5" />
        Void Invoice
      </Button>
    )}
  </div>

  {/* Divider */}
  <div className="border-t border-border my-4" />

  {/* Meta */}
  <dl className="space-y-2 text-xs">
    <div className="flex justify-between">
      <dt className="text-muted-fg">Client</dt>
      <dd className="font-medium text-foreground">{invoice.tenantName}</dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-muted-fg">Type</dt>
      <dd>{invoice.type}</dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-muted-fg">Created</dt>
      <dd>{formatDate(invoice.createdAt)}</dd>
    </div>
    <div className="flex justify-between">
      <dt className="text-muted-fg">Due</dt>
      <dd className={cn(isPastDue && "text-danger font-medium")}>
        {formatDate(invoice.dueDate)}
      </dd>
    </div>
  </dl>
</Card>
```

### 10.4 Send Invoice Modal (`<SendInvoiceModal>`)

```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Send Invoice {invoice.invoiceNumber}</DialogTitle>
      <DialogDescription>
        Review and edit the email before sending.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>To</Label>
        <Input defaultValue={invoice.billingEmail} />
      </div>
      <div className="space-y-1.5">
        <Label>CC</Label>
        <Input defaultValue="billing@zerpa.co.za" />
      </div>
      <div className="space-y-1.5">
        <Label>Subject</Label>
        <Input defaultValue={`Invoice ${invoice.invoiceNumber} from Zerpa ICT — Due ${formatDate(invoice.dueDate)}`} />
      </div>
      <div className="space-y-1.5">
        <Label>Message</Label>
        <Textarea rows={10} defaultValue={emailTemplate} className="font-mono text-xs" />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSend} disabled={sending}>
        {sending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Send size={14} className="mr-1.5" />}
        Send Invoice
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Default email body:**
```
Dear {Client Name},

Please find attached your invoice {invoiceNumber} for R{total} (incl. VAT),
due on {dueDate}.

Payment Details:
  Bank:      FNB
  Account:   62 800 123 456
  Branch:    250 655
  Reference: {invoiceNumber}  ← Please use this as your payment reference

If you have any queries, please contact us at billing@zerpa.co.za or call 011 888 0000.

Kind regards,
Zerpa ICT Billing Team
```

On send (mock mode): status → `SENT`, records `sentAt`, closes modal. Toast: `"Invoice sent to {email}"`

### 10.5 Mark as Paid Modal (`<MarkPaidModal>`)

```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogDescription>{invoice.invoiceNumber} · R{invoice.total}</DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Payment Date *</Label>
        <DatePicker defaultValue={new Date()} />
      </div>
      <div className="space-y-1.5">
        <Label>Payment Method *</Label>
        <Select>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EFT">EFT</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Reference / POP #</Label>
        <Input placeholder="e.g. bank reference number" />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Optional" rows={3} />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleConfirm} className="bg-success text-white hover:bg-green-700">
        <CheckCircle size={14} className="mr-1.5" />
        Confirm Payment
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

On confirm: status → `PAID`. Toast: `"Invoice ZRP-2025-0042 marked as paid."`

### 10.6 Void Invoice Dialog

```typescript
<AlertDialog>
  <AlertDialogContent className="max-w-sm">
    <AlertDialogHeader>
      <AlertDialogTitle>Void Invoice {invoice.invoiceNumber}?</AlertDialogTitle>
      <AlertDialogDescription>
        This will cancel the invoice permanently. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-danger text-white hover:bg-red-700"
        onClick={handleVoid}
      >
        Void Invoice
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 10.7 Invoice PDF Download

- **Mock mode:** `window.print()` triggered on the `<InvoicePreview>` component via a print-specific stylesheet (`@media print`)
- **Live mode:** Downloads from S3 pre-signed URL

---

## 11. CLIENT INVOICE PORTAL

**Route examples:** `/funeral/invoices`, `/automotive/invoices`

### 11.1 Client Invoice List

Read-only table — client can only see invoices for their own `tenantId`.

| Column | Notes |
|--------|-------|
| Invoice # | `font-mono` |
| Type | Setup / Subscription / Ad-hoc |
| Total (incl. VAT) | `font-mono font-semibold` |
| Issue Date | |
| Due Date | `text-danger font-medium` if past due |
| Status | `<StatusBadge>` — SENT / PAID / OVERDUE only |
| Actions | View · Download PDF |

No Send / Void / Mark Paid — Zerpa-only actions.

### 11.2 Client Invoice View

Read-only `<InvoicePreview>` with two actions only:
- `<Button variant="outline"><Download size={14}/> Download PDF</Button>`
- `<a href="mailto:billing@zerpa.co.za">Contact billing</a>`

**Overdue alert banner** (shown above invoice when OVERDUE):
```typescript
<div className="rounded-[8px] bg-danger-bg border border-danger-ring p-4 mb-4 flex items-start gap-3">
  <AlertTriangle size={16} className="text-danger mt-0.5 flex-shrink-0" />
  <div>
    <p className="text-sm font-semibold text-danger">Payment Overdue</p>
    <p className="text-xs text-danger/80 mt-0.5">
      Please make payment to: Bank: FNB · Account: 62 800 123 456 ·
      Branch: 250 655 · Reference: {invoice.invoiceNumber}
    </p>
  </div>
</div>
```

---

## 12. VERTICAL — FUNERAL PARLOUR (PRIORITY 1 — FLAGSHIP)

### 12.1 Dashboard (`/funeral/dashboard`)

**KPI row (4 cards):**
- Active Cases (open) — `Building2` icon, blue tint
- Cases This Month — `Calendar` icon, violet tint
- Funerals This Week — `Clock` icon, amber tint
- Outstanding Payments — `AlertCircle` icon, red tint · `font-mono R{amount}`

**Compliance alert banner** — shown if any cases have missing death cert or burial order:
```typescript
<div className="rounded-[8px] bg-danger-bg border border-danger-ring p-4 flex items-center gap-3 mb-4">
  <AlertTriangle size={16} className="text-danger" />
  <span className="text-sm text-danger font-medium">
    {count} case{count > 1 ? "s" : ""} have missing compliance documents.{" "}
    <a href="/funeral/compliance" className="underline">Review now →</a>
  </span>
</div>
```

**Today's Schedule** — card with time-sorted list:
```
09:00  Chapel A  ·  Mokoena, Sipho  ·  Burial
14:30  Hearse    ·  Dlamini, Thandi  ·  Cremation transport
```

**Recent Cases** — compact `<DataTable>` showing last 5 cases.

### 12.2 Cases List (`/funeral/cases`)

**Filter tabs:** Active · Pending Burial · Closed · All

**Table Columns:**

| Column | Notes |
|--------|-------|
| Case # | `font-mono` `FUN-2025-001` |
| Deceased | Full name |
| Date of Death | `text-muted-fg text-xs` |
| Service Type | Burial / Cremation / Repatriation chip |
| Funeral Date | Date + time |
| Status | `<StatusBadge>` intake / active / pending_burial / closed |
| Next of Kin | Name + phone |
| Compliance | `<CheckCircle size={14} className="text-success"/>` / `<XCircle size={14} className="text-danger"/>` for death cert + burial order |
| Payment | outstanding / partial / paid chip |
| Actions | View · Edit |

### 12.3 Case Intake Form (`/funeral/cases/new`)

Multi-step wizard — `<Stepper>` component at top showing progress.

**Stepper design:**
```
Step 1 of 5
●──────────○──────────○──────────○──────────○
Deceased  Family  Service  Financial  Review
```

**Step 1 — Deceased Details:**
- First name *, Last name *, ID number *
- Date of birth, Date of death *
- Cause of death
- Service type * — `<RadioGroup>`: Burial / Cremation / Repatriation

**Step 2 — Family / Next of Kin:**
- Next of kin name *, Relationship *
- Phone *, Email
- Alternative contact name, Alternative contact phone

**Step 3 — Service Planning:**
- Funeral package * (searchable `<Select>` from catalogue)
- Funeral date * + time *
- Chapel selection * (shows availability — disabled slots visually greyed out)
- Hearse required? `<Switch>` — if yes, show hearse assignment field

**Step 4 — Financial:**
- Package price (auto-filled, read-only)
- Deposit amount paid
- Payment plan? `<Switch>` — if yes, show payment schedule builder

**Step 5 — Review & Submit:**
Read-only summary of all entered data. `[Submit Case]` button.

### 12.4 Case Detail (`/funeral/cases/[id]`)

**Tabbed layout** — `<Tabs>` with 6 tabs:

```
Overview  |  Family  |  Services & Schedule  |  Compliance  |  Financial  |  Timeline
```

**Tab 4 — Compliance Docs:**
```typescript
const COMPLIANCE_DOCS = [
  { key: "deathCertificate",  label: "Death Certificate",  required: true },
  { key: "burialOrder",       label: "Burial Order",        required: true },
  { key: "policeClearance",   label: "Police Clearance",    required: false },
  { key: "cremationPermit",   label: "Cremation Permit",    required: caseType === "CREMATION" },
];

// Each row:
<div className="flex items-center justify-between py-3 border-b border-border">
  <div className="flex items-center gap-2">
    {doc.uploaded
      ? <CheckCircle size={16} className="text-success" />
      : <XCircle size={16} className="text-danger" />}
    <span className="text-sm">{doc.label}</span>
    {!doc.required && <span className="text-xs text-muted-fg ml-1">(if applicable)</span>}
  </div>
  <Button size="sm" variant="outline">
    <Upload size={12} className="mr-1.5" />
    {doc.uploaded ? "Replace" : "Upload"}
  </Button>
</div>
```

**Tab 5 — Financial:**
- Summary: Total package price · Deposit paid · Balance outstanding
- Payment history table
- `<Button><Receipt size={14}/> Generate Invoice</Button>` → creates Billing module invoice linked to this case

**Tab 6 — Timeline:**
Chronological event log — same feed design as lead timeline.

### 12.5 Schedule / Calendar (`/funeral/schedule`)

- **Month view** default using `FullCalendar` or custom grid
- Chapel bookings: event chips in `bg-info-bg text-info border border-info-ring rounded-[4px] px-2 py-0.5 text-xs`
- Hearse dispatches: `bg-funeral-bg text-funeral border border-[rgba(109,40,217,0.20)]`
- Click slot → booking detail sheet (right-side `<Sheet>`)
- Toggle: `<Button variant="outline" size="sm">List view</Button>` — switches to sorted table

---

## 13. VERTICAL — AUTOMOTIVE (PRIORITY 2)

### 13.1 Dashboard (`/automotive/dashboard`)

**KPI row:** Open Job Cards · Jobs Completed This Week · Parts Low in Stock (red if > 0) · Revenue This Month

**Low stock alert banner** (if parts below threshold):
```typescript
<div className="rounded-[8px] bg-warning-bg border border-warning-ring p-4 flex items-center gap-3 mb-4">
  <AlertTriangle size={16} className="text-warning" />
  <span className="text-sm text-warning font-medium">
    {count} parts are below reorder threshold.{" "}
    <a href="/automotive/inventory?tab=low-stock" className="underline">View inventory →</a>
  </span>
</div>
```

### 13.2 Job Cards (`/automotive/job-cards`)

**Table:** Job # · Vehicle (rego) · Owner · Work Type · Bay · Mechanic · Status · Created · Actions

**Status flow chips:**
```
Checked In → Diagnosed → In Progress → Quality Check → Ready → Collected
```
Each status: outlined badge with appropriate colour. In Progress = amber, Ready = green, Collected = muted grey.

**Job Card Detail** (`/automotive/job-cards/[id]`):

Two-column layout:
- **Left:** Vehicle details (make, model, year, rego, mileage) + photos carousel (lightbox on click)
- **Right:** Status controls + notes

**Labour items table** (editable):
| Description | Hours | Rate (R/hr) | Total |
|---|---|---|---|
| [text] | [num] | R[num] | R[auto] |

**Parts used table** (editable):
| Part # | Description | Qty | Unit Price | Total |
|---|---|---|---|---|
| [mono] | [text] | [num] | R[num] | R[auto] |

Quote total with VAT (same pattern as invoice). `<Button>Send Quote to Customer</Button>`.

### 13.3 Inventory (`/automotive/inventory`)

**Tabs:** All Parts · Low Stock (amber badge with count)

**Table:** Part # · Description · Category · Stock Level · Reorder Threshold · Supplier · Unit Cost

**Stock level column:**
```typescript
<span className={cn("font-mono text-sm font-medium",
  stock > threshold ? "text-success" :
  stock === threshold ? "text-warning" : "text-danger"
)}>
  {stock}
</span>
```

---

## 14. VERTICAL — RESTAURANT (PRIORITY 3)

### 14.1 Orders (`/restaurant/orders`)

**Kanban board** — 4 columns: Received · In Kitchen · Ready · Served/Collected

Column header: label + count badge. `min-h-[500px]` column. Horizontal scroll on narrow screens.

**Order card design:**
```typescript
<div className={cn(
  "rounded-[8px] border bg-white p-3 shadow-sm cursor-pointer",
  "hover:shadow-md transition-shadow",
  elapsed > 1200 && "border-danger-ring bg-danger-bg/30"  // red after 20 mins
)}>
  <div className="flex items-center justify-between mb-2">
    <span className="font-mono text-xs font-medium text-foreground">#{order.id}</span>
    <span className={cn("text-xs font-mono", elapsed > 1200 ? "text-danger" : "text-muted-fg")}>
      {formatElapsed(elapsed)}
    </span>
  </div>
  <p className="text-xs text-muted-fg">{order.tableOrCustomer}</p>
  <div className="mt-2 space-y-0.5">
    {order.items.map(item => (
      <p key={item.id} className="text-xs text-foreground-2">{item.qty}× {item.name}</p>
    ))}
  </div>
</div>
```

### 14.2 Kitchen Display System (`/restaurant/kitchen`)

**Full-screen KDS** — dark background `bg-foreground`, white text. Grid of order cards.

```typescript
// KDS card
<div className="rounded-[12px] bg-white/10 border border-white/20 p-4">
  <div className="flex items-center justify-between mb-3">
    <span className="font-mono text-white font-bold text-lg">#{order.id}</span>
    <span className={cn("font-mono text-sm", elapsed > 1200 ? "text-red-400" : "text-white/60")}>
      {formatElapsed(elapsed)}
    </span>
  </div>
  <span className="text-xs text-white/40 uppercase tracking-wide mb-3 block">
    {order.type}  ·  {order.tableOrCustomer}
  </span>
  <div className="space-y-2">
    {order.items.map(item => (
      <label key={item.id} className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={item.ready}
          onCheckedChange={() => toggleItem(order.id, item.id)}
          className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white"
        />
        <span className={cn("text-sm", item.ready ? "line-through text-white/40" : "text-white")}>
          {item.qty}× {item.name}
        </span>
      </label>
    ))}
  </div>
  {allItemsReady && (
    <Button className="w-full mt-3 bg-success text-white hover:bg-green-600" size="sm">
      Complete Order
    </Button>
  )}
</div>
```

Mock mode: simulates new orders arriving every 30 seconds via `setInterval`.

### 14.3 Menu Management (`/restaurant/menu`)

Table: Item Name · Category · Price · Available (toggle `<Switch>`)  
`<Button size="sm"><Plus size={12}/> Add Item</Button>` opens inline row or modal.

---

## 15. VERTICAL — SPA / WELLNESS (PRIORITY 3)

### 15.1 Bookings (`/spa/bookings`)

**Calendar view** — day/week toggle (`<Tabs value="day" | "week">`).

Each booking block:
```typescript
<div className="rounded-[4px] px-2 py-1 text-xs font-medium truncate cursor-pointer
               bg-primary-tint text-primary border border-primary-ring">
  {booking.clientName} · {booking.service}
</div>
```

**List view** (`<DataTable>` compact): Time · Client · Service · Therapist · Duration · Status badge

**New Booking modal** (`<BookingModal>`):
- Date * · Time * · Service (select) · Therapist (select, filtered by service) · Client (search or create new)
- Duration auto-fills from service. Conflicts shown inline: `"Therapist unavailable at this time."`

### 15.2 Therapists (`/spa/therapists`)

Grid of therapist cards: `grid-cols-2 lg:grid-cols-3 gap-4`

```typescript
<Card className="rounded-[12px] border border-border p-5">
  {/* Avatar — initials circle */}
  <div className="w-12 h-12 rounded-full bg-primary-tint text-primary
                  flex items-center justify-center font-semibold text-lg mb-3">
    {initials}
  </div>
  <h3 className="font-semibold text-sm text-foreground">{therapist.name}</h3>
  <p className="text-xs text-muted-fg mt-0.5">
    {therapist.services.join(" · ")}
  </p>
  {/* Availability */}
  <div className="flex items-center gap-1.5 mt-3">
    <span className={cn("w-2 h-2 rounded-full",
      therapist.available ? "bg-success" : "bg-muted-fg")} />
    <span className="text-xs text-muted-fg">
      {therapist.available ? "Available" : "In session"}
    </span>
  </div>
  {/* Today's schedule */}
  <div className="mt-3 space-y-1">
    {therapist.todayBookings.map(b => (
      <p key={b.id} className="text-xs text-foreground-2">
        {b.time} — {b.clientName} ({b.service})
      </p>
    ))}
  </div>
</Card>
```

---

## 16. SHARED COMPONENTS LIBRARY

### 16.1 Core UI Components

| Component | File | Description |
|-----------|------|-------------|
| `StatusBadge` | `components/ui/status-badge.tsx` | Coloured badge — all statuses, verticals, priorities |
| `PriorityBadge` | `components/ui/priority-badge.tsx` | FLAGSHIP (violet) / PRIORITY (blue) / STANDARD (emerald) |
| `DataTable` | `components/ui/data-table.tsx` | Reusable sortable/filterable/paginated table |
| `StatsCard` | `components/ui/stats-card.tsx` | KPI card — icon, value, label, trend delta chip |
| `PageHeader` | `components/ui/page-header.tsx` | `title` + `subtitle` + `action` slot, `border-b border-border pb-4 mb-6` |
| `EmptyState` | `components/ui/empty-state.tsx` | Empty table/list — icon + heading + description + optional CTA |
| `LoadingSkeleton` | `components/ui/loading-skeleton.tsx` | `<Skeleton>` wrappers for tables and cards |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | Reusable destructive confirmation (`AlertDialog`) |
| `SearchInput` | `components/ui/search-input.tsx` | Debounced input, `Search` icon left, `X` clear right |
| `DateRangePicker` | `components/ui/date-range-picker.tsx` | Range selection popover |
| `CurrencyDisplay` | `components/ui/currency-display.tsx` | `R1,725.00` — ZAR, `font-mono`, 2dp always |
| `Stepper` | `components/ui/stepper.tsx` | Multi-step wizard progress bar |
| `Timeline` | `components/ui/timeline.tsx` | Vertical event feed component |

### 16.2 `StatsCard` Component

```typescript
// components/ui/stats-card.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "red" | "violet" | "amber";
  trend?: { value: string; positive: boolean };
}

const iconStyles = {
  blue:   "bg-info-bg text-info",
  green:  "bg-success-bg text-success",
  red:    "bg-danger-bg text-danger",
  violet: "bg-funeral-bg text-funeral",
  amber:  "bg-warning-bg text-warning",
};

export function StatsCard({ label, value, sub, icon: Icon, iconColor = "blue", trend }: StatsCardProps) {
  return (
    <div className="rounded-[12px] border border-border bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">{label}</p>
        <span className={cn("rounded-[8px] p-2", iconStyles[iconColor])}>
          <Icon size={14} />
        </span>
      </div>
      <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-fg mt-1">{sub}</p>}
      {trend && (
        <span className={cn(
          "inline-flex items-center gap-1 text-xs font-medium mt-2 px-1.5 py-0.5 rounded-[4px]",
          trend.positive ? "bg-success-bg text-success" : "bg-danger-bg text-danger"
        )}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </span>
      )}
    </div>
  );
}
```

### 16.3 `PageHeader` Component

```typescript
// components/ui/page-header.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-border pb-5 mb-6">
      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-fg mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4 mt-1">{action}</div>}
    </div>
  );
}
```

### 16.4 `EmptyState` Component

```typescript
// components/ui/empty-state.tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-[12px] bg-surface p-4 mb-4 border border-border">
        <Icon size={24} className="text-muted-fg" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-fg max-w-xs">{description}</p>
      {action && (
        <Button size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### 16.5 Invoice Components

| Component | File | Description |
|-----------|------|-------------|
| `InvoicePreview` | `components/modules/billing/invoice-preview.tsx` | A4 print-ready invoice layout with watermark support |
| `InvoiceLineItems` | `components/modules/billing/invoice-line-items.tsx` | Editable/read-only line items table with live VAT totals |
| `SendInvoiceModal` | `components/modules/billing/send-invoice-modal.tsx` | Send/resend modal with editable email body |
| `MarkPaidModal` | `components/modules/billing/mark-paid-modal.tsx` | Record payment method, date, reference |
| `CreateInvoiceForm` | `components/modules/billing/create-invoice-form.tsx` | New invoice form with preset line items |
| `InvoiceStatusFlow` | `components/modules/billing/invoice-status-flow.tsx` | Visual lifecycle stepper: Draft → Sent → Paid/Overdue/Void |

### 16.6 Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `InternalSidebar` | `components/layouts/internal-sidebar.tsx` | Collapsible sidebar with section labels and sub-items |
| `InternalTopBar` | `components/layouts/internal-top-bar.tsx` | Sticky top bar — search, notifications, user menu |
| `ClientPortalNav` | `components/layouts/client-portal-nav.tsx` | Vertical-specific horizontal top nav |
| `InternalShell` | `components/layouts/internal-shell.tsx` | Sidebar + top bar layout wrapper |
| `PageContainer` | `components/layouts/page-container.tsx` | `max-w-[1280px] mx-auto px-6 py-6` |

---

## 17. STATE MANAGEMENT & DATA FETCHING

### 17.1 Server Components First

```
Server Components (async, fetch on server):
  - All page.tsx files (default RSC)
  - Data table initial loads
  - Invoice detail initial render

Client Components ("use client"):
  - All modals and dialogs
  - Forms with client-side validation
  - Real-time KDS (WebSocket)
  - Date pickers, SearchInput, filter dropdowns
  - Recharts charts
  - Sidebar collapse toggle
  - Notification popover
```

### 17.2 Data Fetching Pattern

```typescript
// app/(internal)/billing/page.tsx — Server Component
import { getInvoices } from "@/lib/data/invoices";
import { InvoicesTable } from "@/components/modules/billing/invoices-table";

export default async function BillingPage() {
  const invoices = await getInvoices();
  return (
    <PageContainer>
      <PageHeader title="Billing" subtitle="Manage invoices for all Zerpa clients"
        action={<NewInvoiceButton />} />
      <InvoicesTable data={invoices} />
    </PageContainer>
  );
}
```

```typescript
// components/modules/billing/invoices-table.tsx — Client Component
"use client";
// Receives initial data from server, handles filters/modals client-side
```

### 17.3 Optimistic Updates

For Mark as Paid, stage changes, checklist item toggles — update UI immediately, revert if API call fails.

```typescript
// Example: optimistic checklist toggle
const [items, setItems] = useState(initialItems);

function toggleItem(id: string) {
  setItems(prev => prev.map(item =>
    item.id === id ? { ...item, completed: !item.completed } : item
  ));
  // fire API call; on failure revert
}
```

### 17.4 Toast Notifications

Use `sonner` (shadcn/ui default):

```typescript
import { toast } from "sonner";

toast.success("Invoice sent to client@example.co.za");
toast.error("Failed to send invoice. Please try again.");
toast.info("Invoice marked as overdue automatically.");
```

Sonner positioning: `position="bottom-right"` with `richColors`.

---

## 18. ENVIRONMENT & CONFIGURATION

### 18.1 Environment Variables (`apps/web/.env.local`)

```bash
# ── Mock Mode ─────────────────────────────────────────────────────
NEXT_PUBLIC_USE_MOCK=true                 # true during frontend-first build

# ── API ───────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://api.zerpa.co.za/api/v1
# Local dev: http://localhost:4000/api/v1

# ── AWS Cognito (Amplify) ──────────────────────────────────────────
NEXT_PUBLIC_COGNITO_REGION=af-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=af-south-1_XXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXX

# ── App ───────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://app.zerpa.co.za
NEXT_PUBLIC_APP_NAME=Zerpa ERP
```

### 18.2 Feature Flags

```typescript
// lib/config.ts
export const CONFIG = {
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Zerpa ERP",

  features: {
    invoicePdfDownload: true,
    bulkInvoiceSend: false,       // Phase 2
    realtimeDashboard: false,     // Phase 2 (WebSocket)
    reportExports: false,         // Phase 2
  },
} as const;
```

---

## 19. FOLDER STRUCTURE

```
apps/web/
├── app/
│   ├── globals.css                      # CSS custom properties + Tailwind v4 @theme
│   ├── layout.tsx                       # Root layout — fonts, Sonner, Amplify config
│   ├── (public)/
│   │   ├── page.tsx
│   │   └── login/page.tsx
│   ├── (internal)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── crm/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── contacts/
│   │   │       ├── page.tsx
│   │   │       └── [id]/page.tsx
│   │   ├── nest-sales/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── billing/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── hr/page.tsx
│   │   └── settings/page.tsx
│   ├── (client-portal)/
│   │   ├── layout.tsx
│   │   ├── funeral/
│   │   ├── automotive/
│   │   ├── restaurant/
│   │   └── spa/
│   └── api/
│       └── webhooks/route.ts
│
├── components/
│   ├── ui/                              # shadcn/ui base + Zerpa extensions
│   │   ├── status-badge.tsx
│   │   ├── priority-badge.tsx
│   │   ├── stats-card.tsx
│   │   ├── page-header.tsx
│   │   ├── data-table.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── search-input.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── currency-display.tsx
│   │   ├── stepper.tsx
│   │   └── timeline.tsx
│   ├── layouts/
│   │   ├── internal-shell.tsx
│   │   ├── internal-sidebar.tsx
│   │   ├── internal-top-bar.tsx
│   │   ├── client-portal-nav.tsx
│   │   └── page-container.tsx
│   └── modules/
│       ├── billing/
│       │   ├── invoice-preview.tsx
│       │   ├── invoice-line-items.tsx
│       │   ├── send-invoice-modal.tsx
│       │   ├── mark-paid-modal.tsx
│       │   ├── create-invoice-form.tsx
│       │   └── invoice-status-flow.tsx
│       ├── crm/
│       │   ├── lead-table.tsx
│       │   ├── lead-detail.tsx
│       │   ├── stage-pipeline.tsx
│       │   ├── interaction-timeline.tsx
│       │   └── convert-lead-dialog.tsx
│       ├── nest-sales/
│       │   ├── sales-table.tsx
│       │   ├── provisioning-checklist.tsx
│       │   └── subscription-timeline.tsx
│       ├── funeral/
│       │   ├── case-table.tsx
│       │   ├── case-intake-form.tsx
│       │   ├── case-detail-tabs.tsx
│       │   ├── compliance-docs.tsx
│       │   └── schedule-calendar.tsx
│       ├── automotive/
│       │   ├── job-card-table.tsx
│       │   ├── job-card-detail.tsx
│       │   └── inventory-table.tsx
│       ├── restaurant/
│       │   ├── orders-board.tsx
│       │   ├── kds-display.tsx
│       │   └── menu-table.tsx
│       └── spa/
│           ├── bookings-calendar.tsx
│           ├── booking-modal.tsx
│           └── therapist-cards.tsx
│
├── lib/
│   ├── mock/
│   │   ├── index.ts
│   │   ├── invoices.ts
│   │   ├── leads.ts
│   │   ├── clients.ts
│   │   ├── nest-sales.ts
│   │   ├── funeral-cases.ts
│   │   ├── automotive.ts
│   │   ├── restaurant.ts
│   │   ├── spa.ts
│   │   ├── staff.ts
│   │   └── auth.ts
│   ├── data/
│   │   ├── invoices.ts
│   │   ├── leads.ts
│   │   ├── clients.ts
│   │   ├── funeral.ts
│   │   ├── automotive.ts
│   │   ├── restaurant.ts
│   │   └── spa.ts
│   ├── aws/
│   │   ├── cognito.ts
│   │   ├── amplify-server.ts
│   │   └── api-client.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-toast.ts
│   │   └── use-websocket.ts
│   ├── utils/
│   │   ├── currency.ts              # formatCurrency("ZAR", 1725) → "R1,725.00"
│   │   ├── dates.ts                 # formatDate, relativeTime
│   │   └── invoice-number.ts        # generateInvoiceNumber() → "ZRP-YYYY-XXXX"
│   └── config.ts
│
├── packages/
│   └── shared-types/                # TypeScript types shared across apps
│       └── src/index.ts
│
├── public/
│   ├── logo.svg
│   └── zerpa-logo-white.svg
│
├── amplify_outputs.json
├── next.config.ts
├── tailwind.config.ts
├── components.json
└── package.json
```

---

## 20. SPRINT BUILD ORDER

Build in this exact order — each sprint delivers a working, demo-able slice.

### Sprint 1 — Foundation (Week 1)
- [ ] Monorepo setup: `apps/web` with Next.js 15, Tailwind v4, shadcn/ui
- [ ] `packages/shared-types` — TypeScript types for all entities
- [ ] `globals.css` — all CSS custom properties, `@theme` block, shadcn overrides
- [ ] Font setup: Outfit + Instrument Serif + JetBrains Mono via `next/font`
- [ ] `StatusBadge`, `PriorityBadge`, `StatsCard`, `PageHeader`, `EmptyState`, `CurrencyDisplay`
- [ ] `InternalShell`, `InternalSidebar`, `InternalTopBar` with mock nav
- [ ] `ClientPortalNav`
- [ ] Public landing page (`/`) + login page (`/login`)
- [ ] Internal dashboard skeleton with mock KPI cards

### Sprint 2 — Billing & Invoicing (Week 2) ← HIGH PRIORITY
- [ ] Mock invoice data (`lib/mock/invoices.ts`) using `ZRP-YYYY-XXXX` format
- [ ] `InvoicePreview` component (A4 layout, PAID/OVERDUE/DRAFT watermarks)
- [ ] `InvoiceLineItems` (editable + read-only, live VAT calc)
- [ ] `InvoiceStatusFlow` stepper component
- [ ] Billing list page with filter tabs + `DataTable`
- [ ] `CreateInvoiceForm` — line items, preset buttons, live preview
- [ ] Invoice detail page — two-column layout
- [ ] `SendInvoiceModal`, `MarkPaidModal`, void `ConfirmDialog`
- [ ] PDF print view
- [ ] Client invoice portal pages (`/funeral/invoices` etc.) — read-only

### Sprint 3 — CRM & Nest Sales (Week 3)
- [ ] Mock leads + contacts data (funeral leads sorted first)
- [ ] Leads list — `DataTable` with `PriorityBadge`, filter bar
- [ ] `StagePipeline` component
- [ ] Lead detail page — pipeline, timeline, right-side action card
- [ ] `ConvertLeadDialog` — 3-step flow
- [ ] Contacts list + contact profile
- [ ] Nest Sales list — stats row + table with progress bars
- [ ] Nest Sale detail + `ProvisioningChecklist` + activation banner
- [ ] `SubscriptionTimeline`

### Sprint 4 — Funeral Vertical (Week 4) ← FLAGSHIP
- [ ] Mock funeral case data
- [ ] Cases list with compliance indicator columns
- [ ] `Stepper` component for multi-step forms
- [ ] Case intake form (5-step wizard)
- [ ] Case detail — 6-tab `<Tabs>` layout
- [ ] `ComplianceDocs` component with upload triggers
- [ ] Schedule / calendar page
- [ ] "Generate Invoice" from Financial tab

### Sprint 5 — Automotive Vertical (Week 5)
- [ ] Job cards list + status flow chips
- [ ] Job card detail — labour + parts tables
- [ ] Vehicle registry
- [ ] Inventory table with stock level colouring + low-stock tab

### Sprint 6 — Restaurant + Spa Verticals (Week 6)
- [ ] Restaurant orders board (Kanban)
- [ ] KDS full-screen view + mock 30s order stream
- [ ] Menu management table
- [ ] Spa bookings calendar (day/week views)
- [ ] Therapist cards grid
- [ ] `BookingModal`

### Sprint 7 — Polish & Live Wiring (Week 7+)
- [ ] Wire all data calls to live API (`NEXT_PUBLIC_USE_MOCK=false`)
- [ ] AWS Cognito auth integration (group-based route guards)
- [ ] PDF download from S3 pre-signed URLs
- [ ] WebSocket KDS (live mode)
- [ ] Sonner toast audit — all actions covered
- [ ] Sentry error tracking
- [ ] Responsive / mobile pass
- [ ] Accessibility audit (keyboard nav, ARIA labels, focus rings)

---

> **Build Rule:** Always build the invoicing module (Sprint 2) before the verticals. The billing module is used across all verticals — client invoice views depend on it. Funeral vertical always precedes automotive which precedes restaurant and spa.
>
> **Design Rule:** All pages use `<PageContainer>` and `<PageHeader>`. No page renders raw content without the shell wrapper. All icons are Lucide React, `size={16}`, `stroke-width={1.5}`. All monetary values render via `<CurrencyDisplay>` or `formatCurrency()`. All invoice numbers render in `font-mono`.

---

*Document version: 2.0 | Date: 2026-04-01 | Project: ZERPA ERP | Redesign: Modern Corporate Light*
