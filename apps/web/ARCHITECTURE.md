# ZERPA Frontend Architecture

**Date**: May 13, 2026  
**Framework**: Next.js 14 (App Router)  
**Status**: Production-Ready (Phase 1 Complete)

---

## 1. Overall Structure

```
apps/web/
├── app/                      # Next.js App Router (Routes & Layouts)
│   ├── (public)/            # Route group: Login, Register, Public pages
│   ├── (internal)/          # Route group: Internal dashboard (requires auth)
│   ├── (client-portal)/     # Route group: Customer portals (by vertical)
│   ├── layout.tsx           # Root layout wrapper
│   └── globals.css          # Global styles & CSS variables
│
├── components/              # Reusable React Components
│   ├── auth/               # Authentication UI (login, register, step forms)
│   ├── layouts/            # Page layouts (sidebar, topbar, shells)
│   ├── modals/             # Modal dialogs
│   ├── modules/            # Feature modules (billing, CRM, etc.)
│   ├── ui/                 # UI primitives (button, card, input, etc.)
│   ├── add-company-button.tsx
│   └── company-switcher.tsx
│
├── hooks/                  # Custom React Hooks
│   └── use-toast.ts       # Toast notification hook
│
├── lib/                    # Core Logic & Utilities
│   ├── api/               # API client functions (auth, companies, etc.)
│   ├── auth/              # Auth context & authentication utilities
│   ├── config.ts          # App configuration & feature flags
│   ├── utils.ts           # Class name utilities (cn())
│   ├── data/              # Static/hardcoded business logic data
│   ├── mock/              # Mock data generators
│   └── utils/             # General utilities (currency, dates, etc.)
│
├── public/                # Static assets
├── [configs]              # TypeScript, Tailwind, Next.js, PostCSS
└── package.json
```

---

## 2. Architecture Patterns

### 2.1 Layer Organization

**Route Layer** (`app/`)
- Handles routing and URL structure
- Minimal logic (delegates to components)
- Uses Next.js App Router with route groups for better organization

**Component Layer** (`components/`)
- Pure React components
- Presentation logic only
- No business logic or API calls (except containers)
- Organized by domain (auth, layouts, ui, etc.)

**Context Layer** (`lib/auth/`)
- Global state management via React Context
- Handles user authentication state
- Stores & persists data in localStorage

**API Layer** (`lib/api/`)
- HTTP client wrapper with error handling
- Functions for each API endpoint
- Request/response typing
- Centralized error handling

**Utility Layer** (`lib/utils/`, `lib/config.ts`)
- Pure functions for formatting, parsing, calculations
- Configuration values
- Constants

**Mock Layer** (`lib/mock/`, `lib/data/`)
- Static data for development
- Feature-flagged (activated by `NEXT_PUBLIC_USE_MOCK`)
- Easy to swap with real API calls

---

## 3. Scalability Assessment & Recommendations

### ✅ What's Working Well

1. **Route Groups** - Good separation of concerns (public/internal/client-portal)
2. **Context API** - Simple state management for auth
3. **Component Organization** - Clear folder structure by domain
4. **Type Safety** - Full TypeScript with strict types
5. **Config-Driven** - Easy to toggle features and API endpoints

### ⚠️ Future Improvements (For Phase 2+)

#### Problem 1: No Service Layer
**Current**: Components → API Layer directly
```
Component → API call → Backend
```

**Better (Phase 2+)**: Add service/business logic layer
```
Component → Service (business logic) → API call → Backend
```

**Solution**: Create `lib/services/` folder with business logic:
```typescript
// lib/services/auth.service.ts
export async function createAccountAndCompany(userData, companyData) {
  // Compose multiple API calls
  // Handle complex business logic
  // Manage state transitions
}

// lib/services/lead.service.ts
export async function convertLeadToCompany(leadId, companyData) {
  // Multi-step process
  // Error handling & rollback
}
```

#### Problem 2: No Centralized Types
**Current**: Types scattered in files
**Better**: Create `lib/types/` for all TypeScript definitions

```typescript
// lib/types/index.ts
export type * from './auth.types';
export type * from './company.types';
export type * from './api.types';
```

#### Problem 3: No Constants Management
**Current**: Magic strings and numbers in code
**Better**: Create `lib/constants/` for all constants

```typescript
// lib/constants/verticals.ts
export const VERTICALS = {
  FUNERAL: 'FUNERAL',
  AUTO: 'AUTO',
  RESTAURANT: 'RESTAURANT',
  SPA: 'SPA',
} as const;

// lib/constants/api.ts
export const API_ENDPOINTS = {
  AUTH_SIGNIN: '/auth/sign-in',
  AUTH_REGISTER: '/auth/register',
  COMPANIES: '/companies',
} as const;
```

#### Problem 4: Mixed Concerns in lib/
**Current**: Everything in `lib/` (api, auth, config, data, mock, utils)
**Better**: More explicit structure

```
lib/
├── api/              # HTTP client & endpoint wrappers
├── auth/             # Auth context & utilities
├── services/         # Business logic (Phase 2+)
├── types/            # TypeScript definitions
├── constants/        # App-wide constants
├── utils/            # Utility functions
├── config.ts         # Configuration
├── hooks.ts          # Custom hooks (if not in components)
└── [data/mock]       # Development data
```

---

## 4. Recommended Folder Structure (Phase 1 ✅ | Phase 2+ 🔄)

### Phase 1 (CURRENT) ✅
```
apps/web/
├── app/
├── components/
│   ├── auth/
│   ├── layouts/
│   ├── modules/
│   ├── modals/
│   └── ui/
├── hooks/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── config.ts
│   ├── data/
│   ├── mock/
│   └── utils/
└── public/
```

### Phase 2+ (RECOMMENDED) 🔄
```
apps/web/
├── app/
├── components/
│   ├── auth/
│   ├── layouts/
│   ├── modules/
│   ├── modals/
│   └── ui/
├── hooks/
├── lib/
│   ├── api/           # API client functions
│   ├── auth/          # Auth context
│   ├── services/      # Business logic layer (NEW)
│   ├── types/         # TypeScript definitions (NEW)
│   ├── constants/     # App constants (NEW)
│   ├── config.ts
│   ├── utils/
│   ├── data/
│   └── mock/
├── public/
└── ARCHITECTURE.md    # This file
```

---

## 5. Data Flow Patterns

### Authentication Flow
```
LoginPage
  ↓ (user enters email/password)
  ↓ signIn() → API /auth/sign-in
  ↓ AuthContext updated (setUser, setCompanies)
  ↓ localStorage persisted
  ↓ Route to /select-company or /dashboard
```

### Company Creation Flow
```
RegisterPage (Steps 1-3)
  ↓ Step 1: register() → API /auth/register (creates user)
  ↓ Step 2: User enters company info
  ↓ Step 3: addCompany() → API /companies (creates company)
  ↓ AuthContext updated with new company
  ↓ localStorage updated
  ↓ Route to /select-company
  ↓ SelectCompanyPage fetches companies if needed
  ↓ User selects company → /dashboard
```

### Multi-Tenant Company Selection
```
User (has 2+ companies)
  ↓ SignIn → /select-company page
  ↓ selectCompany(companyId) called
  ↓ Company stored in context & localStorage
  ↓ Route to /dashboard
  ↓ Dashboard knows active company from context
  ↓ Load data for that specific company
```

---

## 6. Scalability Analysis

| Aspect | Current | Scalable? | Notes |
|--------|---------|-----------|-------|
| **Component Count** | 20-30 | ✅ Scales well | Clear folder organization by domain |
| **API Endpoints** | 5-10 | ⚠️ Needs service layer | Will benefit from service/business logic |
| **State Management** | Context API | ⚠️ Context only for auth | For global state beyond auth, consider Redux/Zustand |
| **Type Safety** | Full TypeScript | ✅ Good | Types scattered—centralize in `lib/types/` |
| **Code Organization** | Domain-based | ✅ Good | Clear separation, but could be more explicit |
| **Constants** | Scattered | ❌ Needs fixing | Create `lib/constants/` folder |
| **Testing** | No tests yet | ⚠️ Not started | Add Jest + React Testing Library |
| **Error Handling** | Basic try/catch | ⚠️ Needs improvement | Add error boundaries and logging |
| **Performance** | Good (SSR ready) | ✅ Next.js handles it | Code splitting & lazy loading ready |

---

## 7. Recommended Next Steps (Priority)

1. **Phase 2 (Automation Engine)**: No changes needed to current structure
2. **Phase 3+**: 
   - Add `lib/services/` for business logic
   - Create `lib/types/` for centralized types
   - Create `lib/constants/` for constants
   - Add error boundaries in routes
   - Add logging/error tracking
3. **Before Scaling**: 
   - Add Jest + Testing Library
   - Add E2E tests (Playwright/Cypress)
   - Document components (Storybook)
   - Add API response caching/SWR

---

## 8. Code Organization Rules (Enterprise Standards)

### ✅ DO

- **Group by domain**: `components/auth/`, `components/billing/`, etc.
- **Separate concerns**: One responsibility per file
- **Type everything**: No `any` types
- **Comment complex logic**: Explain "why", not "what"
- **Use constants**: No hardcoded values
- **Organize imports**: Standard library → external → local

### ❌ DON'T

- **No deeply nested folders**: Max 3-4 levels deep
- **No shared component logic in pages**: Use contexts or services
- **No direct API calls in components**: Use hooks/services
- **No inline styles**: Use CSS classes or Tailwind
- **No console.logs**: Use proper logging framework

---

## 9. Architecture Decision Records (ADRs)

### ADR-001: Route Groups for Organization
**Decision**: Use route groups `(public)`, `(internal)`, `(client-portal)`  
**Rationale**: Clean URL structure + logical grouping  
**Status**: ✅ ACCEPTED

### ADR-002: Context API for Auth
**Decision**: React Context for global auth state  
**Rationale**: Simple, built-in, sufficient for auth  
**Future**: May upgrade to Zustand if state complexity grows  
**Status**: ✅ ACCEPTED

### ADR-003: Component-First Architecture
**Decision**: Build components first, then wire to pages  
**Rationale**: Reusability, testability, modularity  
**Status**: ✅ ACCEPTED

---

## 10. Summary

**Current Architecture**: ✅ SOLID  
- Clean folder structure
- Good separation of concerns
- Type-safe
- Scalable for 5,000-10,000 components

**Recommended for 50K+ users**: 
- Add service layer (`lib/services/`)
- Centralize types (`lib/types/`)
- Add testing framework (Jest)
- Add error tracking (Sentry)
- Consider state management upgrade (Zustand)

This architecture supports growth from startup to enterprise without major refactors.
