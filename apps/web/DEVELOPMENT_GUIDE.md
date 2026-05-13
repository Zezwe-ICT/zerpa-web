# Development Guide

**For**: Developers and contributors  
**Last Updated**: May 13, 2026  
**Version**: 1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Folder Structure](#folder-structure)
4. [Key Concepts](#key-concepts)
5. [Authentication System](#authentication-system)
6. [Component Patterns](#component-patterns)
7. [API Integration](#api-integration)
8. [Common Tasks](#common-tasks)
9. [Debugging](#debugging)
10. [Testing](#testing)
11. [Deployment](#deployment)

---

## Project Overview

**ZERPA** is a multi-tenant SaaS ERP platform for managing businesses across multiple verticals (Funeral, Automotive, Restaurant, Spa).

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 14+ |
| **Language** | TypeScript | 5+ |
| **Styling** | Tailwind CSS | v4 |
| **UI Components** | Custom (Shadcn-inspired) | N/A |
| **State Management** | React Context | Built-in |
| **HTTP Client** | Fetch API | Built-in |
| **Notifications** | Sonner | Latest |
| **Routing** | Next.js App Router | 14+ |

### Key Features

- ✅ Multi-tenant with company switching
- ✅ Custom JWT authentication
- ✅ Vertical-specific onboarding (4 industries)
- ✅ Role-based access (OWNER, MEMBER)
- ✅ Dashboard and internal tools
- ⏳ Automation engine (Phase 2)
- ⏳ Billing and invoicing (Phase 3)

---

## Getting Started

### Prerequisites

```bash
Node.js 18+ (for Next.js 14)
npm 9+ or yarn 3+
Git
```

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/Zezwe-ICT/zerpa-web.git
cd zerpa-web

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Update environment variables
# Edit .env.local with local dev values:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# NEXT_PUBLIC_USE_MOCK=false (or true for mock mode)

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:3000
```

### Development Environment

```bash
# Start dev server (with hot reload)
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm run start
```

---

## Folder Structure

### `/apps/web` - Frontend Application

```
apps/web/
├── app/                          # Next.js App Router (routes & layouts)
│   ├── (public)/                # Route group: Public pages
│   │   ├── login/page.tsx        # Sign-in form
│   │   ├── register/page.tsx     # Multi-step registration
│   │   ├── select-company/page.tsx # Company selection
│   │   └── onboarding/page.tsx   # Redirect to register
│   │
│   ├── (internal)/              # Route group: Internal dashboard (auth required)
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── billing/              # Billing module
│   │   ├── crm/                  # CRM module
│   │   └── ...other modules
│   │
│   ├── (client-portal)/         # Route group: Customer portals
│   │   ├── [vertical]/          # By vertical (funeral, auto, restaurant, spa)
│   │   └── dashboard/           # Vertical-specific dashboard
│   │
│   ├── layout.tsx               # Root layout (providers, AuthProvider)
│   ├── globals.css             # Global styles & design system
│   └── error.tsx               # Error page template
│
├── components/                  # Reusable React components
│   ├── auth/                   # Auth-specific components
│   │   ├── progress-indicator.tsx
│   │   ├── step1-form.tsx
│   │   ├── step2-form.tsx
│   │   ├── step3-form.tsx
│   │   └── step3-*-form.tsx   # Vertical-specific forms
│   │
│   ├── layouts/                # Page layouts
│   │   ├── internal-shell.tsx
│   │   ├── internal-sidebar.tsx
│   │   ├── internal-topbar.tsx
│   │   └── page-container.tsx
│   │
│   ├── modules/                # Feature modules (future)
│   │   ├── billing/
│   │   ├── crm/
│   │   └── nest-sales/
│   │
│   ├── modals/                 # Modal components
│   │   └── add-company-modal.tsx
│   │
│   ├── ui/                     # UI primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   └── ...other primitives
│   │
│   ├── add-company-button.tsx
│   └── company-switcher.tsx
│
├── hooks/                      # Custom React hooks
│   └── use-toast.ts           # Toast notification hook
│
├── lib/                        # Core logic & utilities
│   ├── api/                   # API client functions
│   │   ├── client.ts          # HTTP client wrapper
│   │   ├── auth.ts            # Auth endpoints (sign-in, register, companies)
│   │   └── companies.ts       # Company CRUD endpoints
│   │
│   ├── auth/                  # Authentication
│   │   ├── context.tsx        # Auth context provider
│   │   └── hooks.ts           # Auth-related hooks (if needed)
│   │
│   ├── config.ts              # App configuration
│   ├── utils.ts               # General utilities (cn for classNames)
│   │
│   ├── utils/                 # Specific utilities
│   │   ├── currency.ts        # Currency formatting
│   │   ├── dates.ts           # Date formatting
│   │   └── invoice-number.ts # Invoice number generation
│   │
│   ├── data/                  # Static data & business logic
│   │   ├── crm.ts
│   │   ├── funeral.ts
│   │   ├── invoices.ts
│   │   └── nest-sales.ts
│   │
│   └── mock/                  # Mock data for development
│       ├── auth.ts
│       ├── funeral-cases.ts
│       ├── invoices.ts
│       ├── leads.ts
│       └── nest-sales.ts
│
├── public/                    # Static assets
│   └── [images, icons, etc.]
│
├── [config files]             # Project configs
│   ├── tsconfig.json         # TypeScript config
│   ├── tailwind.config.ts    # Tailwind CSS config
│   ├── next.config.ts        # Next.js config
│   ├── postcss.config.mjs    # PostCSS config
│   ├── components.json       # Shadcn config
│   ├── package.json          # Dependencies
│   └── README.md             # Project README
│
├── ARCHITECTURE.md            # System design & scalability
├── CODE_DOCUMENTATION_STATUS.md # What's been documented
└── DEVELOPMENT_GUIDE.md       # This file
```

---

## Key Concepts

### 1. Route Groups

Using parentheses to organize routes without affecting URL:

```
(public)/login      → /login
(public)/register   → /register
(internal)/billing  → /billing
(client-portal)/... → /(client-portal)/...
```

Benefits:
- Logical grouping
- Shared layouts per group
- URL clean

---

### 2. Auth Context

Global authentication state managed by React Context:

```typescript
interface AuthContextValue {
  user: AuthUser | null;           // Current user
  company: AuthCompany | null;     // Selected company
  companies: AuthCompany[];        // All companies
  isAuthenticated: boolean;        // Is logged in
  isLoading: boolean;              // Loading state
  
  signIn: (payload) => Promise<void>;
  register: (payload) => Promise<AuthResponse>;
  selectCompany: (id: string) => void;
  addCompany: (payload) => Promise<AuthCompany>;
  signOut: () => void;
}
```

Usage:
```typescript
const { user, company, signIn, signOut } = useAuth();
```

---

### 3. Multi-Tenant Company Switching

User can have multiple companies, selects one to work with:

```
User (Email: john@company.com)
  ├── Company 1 (Acme Funeral Home) - role: OWNER
  └── Company 2 (Acme Auto Repair) - role: MEMBER

// Select Company 1 → /select-company → Load data for Company 1
// Switch to Company 2 → selectCompany(id2) → /dashboard → Load data for Company 2
```

Flow:
1. Sign-in → Fetch all companies
2. If 0 companies → Go to /onboarding
3. If 1 company → Auto-select → Go to /dashboard
4. If 2+ companies → Go to /select-company → Choose → /dashboard

---

### 4. Vertical-Specific Onboarding

Different industries need different data:

```
Registration Step 3 (Create Company):
├── Vertical: FUNERAL
│   └── Form asks: Staff count, volume, invoicing method, services
├── Vertical: AUTO
│   └── Form asks: Mechanics, monthly jobs, workshop names
├── Vertical: RESTAURANT
│   └── Form asks: Restaurant type, covers/day, cuisines
└── Vertical: SPA
    └── Form asks: Therapists, bookings/week, services
```

---

### 5. Component Organization

### By Responsibility:

```
components/
├── auth/      # Forms, authentication-specific
├── layouts/   # Page structure (sidebar, topbar, containers)
├── modules/   # Feature domains (billing, CRM, etc.)
├── modals/    # Dialogs and modals
└── ui/        # Reusable primitives (no domain logic)
```

### Naming Conventions:

- **Components**: PascalCase (`LoginForm.tsx`, `PageContainer.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`, `useToast.ts`)
- **Utils**: camelCase (`formatCurrency.ts`, `parseDate.ts`)
- **Types**: PascalCase with `Type` suffix or just PascalCase in interfaces

---

## Authentication System

### Flow Diagram

```
┌─────────────┐
│ Login Page  │
└──────┬──────┘
       │ user enters email/password
       ↓
┌─────────────────────────────┐
│ context.signIn({email, pwd})│
└──────┬──────────────────────┘
       │ calls apiSignIn()
       ↓
┌─────────────────────────────────┐
│ POST /auth/sign-in → Backend    │
└──────┬──────────────────────────┘
       │ returns {token, user, companies}
       ↓
┌──────────────────────────────────┐
│ Store token in localStorage      │
│ Store user in context + storage  │
│ Fetch complete companies list    │
└──────┬──────────────────────────┘
       │
       ├─ 0 companies: /onboarding
       ├─ 1 company: auto-select → /dashboard
       └─ 2+ companies: /select-company
```

### Token Management

```typescript
// lib/api/client.ts
export function getToken(): string | null {
  return localStorage.getItem("zerpa_token");
}

export function setToken(token: string): void {
  localStorage.setItem("zerpa_token", token);
}

// Token automatically added to all API calls:
headers["Authorization"] = `Bearer ${token}`;
```

### Session Persistence

User session persists across browser refreshes:

```typescript
// On app mount
useEffect(() => {
  const token = getToken();
  const user = localStorage.getItem("zerpa_user");
  
  if (token && user) {
    // Rehydrate auth state
    setUser(JSON.parse(user));
  }
}, []);
```

---

## Component Patterns

### Page Components

```typescript
/**
 * Page components live in app/ folder
 * Fetch data, manage page-level state
 * Delegate rendering to smaller components
 */

export default function DashboardPage() {
  const { company } = useAuth();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch data for this company
    fetchDashboardData(company.id);
  }, [company]);
  
  return (
    <PageContainer>
      {/* Render UI */}
    </PageContainer>
  );
}
```

### Form Components

```typescript
/**
 * Form components:
 * - Accept props for initial values
 * - Call parent callbacks, not navigate directly
 * - Show loading/error states
 * - Validate before submit
 */

interface StepFormProps {
  onSubmit: (data: StepData) => Promise<void>;
  isLoading: boolean;
}

export function StepForm({ onSubmit, isLoading }: StepFormProps) {
  const [formData, setFormData] = useState({...});
  const [errors, setErrors] = useState({});
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (err) {
      setErrors({...});
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Inputs */}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
```

### UI Primitives

```typescript
/**
 * UI components:
 * - No business logic
 * - Reusable across app
 * - Fully typed props
 * - Accessible (ARIA labels, keyboard nav)
 * - @see components/ui/button.tsx
 */

interface ButtonProps {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium",
        variant === "primary" && "bg-primary text-white",
        variant === "outline" && "border border-primary text-primary",
        size === "lg" && "px-6 py-3",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

---

## API Integration

### Making API Calls

```typescript
// Use typed functions from lib/api/

import { signIn, createCompany, getCompanies } from "@/lib/api/auth";

// These functions wrap apiRequest() with proper types
const response = await signIn({ email, password });
// response is typed as AuthResponse

const companies = await getCompanies();
// companies is typed as AuthCompany[]

const newCompany = await createCompany({ name, vertical });
// newCompany is typed as AuthCompany
```

### Error Handling

```typescript
import { ApiError } from "@/lib/api/client";

try {
  await signIn({ email, password });
} catch (err) {
  if (err instanceof ApiError) {
    console.error(`HTTP ${err.status}: ${err.message}`);
    if (err.details) {
      console.error("Details:", err.details);
    }
  }
}
```

### Adding New Endpoints

1. Define types in `/lib/api/*.ts`
2. Create typed wrapper function:

```typescript
// lib/api/invoices.ts
export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: "DRAFT" | "SENT" | "PAID";
}

export async function getInvoices(
  companyId: string
): Promise<Invoice[]> {
  return apiRequest<Invoice[]>(
    `/companies/${companyId}/invoices`,
    { method: "GET" }
  );
}
```

3. Use in components:

```typescript
import { getInvoices } from "@/lib/api/invoices";

const invoices = await getInvoices(company.id);
```

---

## Common Tasks

### Task: Add a new page

```bash
# 1. Create folder with page.tsx
mkdir app/(public)/new-page
touch app/(public)/new-page/page.tsx

# 2. Implement page component
# See patterns above for structure
```

### Task: Create a new form component

```bash
# 1. Create component file
touch components/forms/MyForm.tsx

# 2. Type props, handle state, accept callbacks
# See Form Components pattern

# 3. Use in page:
import { MyForm } from "@/components/forms/MyForm";
// <MyForm onSubmit={handleSubmit} />
```

### Task: Add authentication to a page

```typescript
"use client";

import { useAuth } from "@/lib/auth/context";

export default function ProtectedPage() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <div>Hello {user.fullName}</div>;
}
```

### Task: Fetch data for current company

```typescript
const { company } = useAuth();

useEffect(() => {
  if (!company) return; // Wait for company to be selected
  
  // Fetch data for this company
  fetchData(company.id);
}, [company]);
```

### Task: Switch to different company

```typescript
const { selectCompany } = useAuth();

function handleSelectCompany(companyId: string) {
  selectCompany(companyId);
  // Context handles routing to /dashboard
}
```

### Task: Show toast notification

```typescript
import { toast } from "sonner";

// Success
toast.success("Company created successfully!");

// Error
toast.error("Failed to create company");

// Loading
toast.loading("Creating company...");
```

---

## Debugging

### Enable API Logging

Open browser DevTools Console (F12) and watch for `[API]` logs:

```
[API] POST http://localhost:4000/api/v1/auth/sign-in
[API] Response Status: 200 OK
[API] Success Response: {token: "...", user: {...}}
```

### Check Auth Context State

```javascript
// In DevTools Console
// Find a React component in DOM and inspect it
// Look for AuthContext in component tree
// See user, companies, company, isLoading
```

### Local Storage Debugging

```javascript
// In DevTools Console
localStorage.getItem("zerpa_token")       // JWT token
localStorage.getItem("zerpa_user")        // Current user
localStorage.getItem("zerpa_company")     // Selected company
localStorage.getItem("zerpa_companies")   // All companies
```

### Mock Mode Development

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK=true

# Now API calls return mock data from lib/mock/*
# Great for offline development
```

---

## Testing

### Unit Tests (Not Yet Implemented)

```bash
npm run test
```

### Integration Tests (Not Yet Implemented)

```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Can register new account
- [ ] Can sign in with credentials
- [ ] Can create company (0 → onboarding)
- [ ] Can select company (2+ companies)
- [ ] Can switch companies
- [ ] Can sign out

---

## Deployment

### Environment Variables

Production needs these env vars:

```
NEXT_PUBLIC_API_URL=https://api.zerpa.io/api/v1
NEXT_PUBLIC_APP_NAME=Zerpa ERP
NEXT_PUBLIC_APP_URL=https://app.zerpa.io
NEXT_PUBLIC_USE_MOCK=false
```

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
# Push to GitHub
git push origin master

# Vercel auto-deploys from master
# (if connected in Vercel dashboard)

# Or deploy manually:
vercel --prod
```

---

## Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CODE_DOCUMENTATION_STATUS.md](./CODE_DOCUMENTATION_STATUS.md) - What's documented
- [Progress.md](../../Progress.md) - Feature roadmap
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)

---

## Getting Help

1. **Check documentation** - ARCHITECTURE.md, CODE comments
2. **Check codebase** - Search for similar patterns
3. **Check git history** - `git log --oneline` to see recent changes
4. **Ask team** - Slack or team meeting

---

**Last Updated**: May 13, 2026  
**Maintained by**: Development Team  
**Next Review**: June 2026
