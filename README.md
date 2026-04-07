# ZERPA ERP — Frontend Web Application

Modern ERP platform built with Next.js 15, Tailwind CSS v4, shadcn/ui, and AWS Cognito.

## Overview

**Version:** 2.0.0  
**Stack:** Next.js 15 · Tailwind CSS v4 · shadcn/ui · AWS Amplify SDK v6

This is a monorepo containing:
- `apps/web` — Next.js 15 frontend application
- `packages/shared-types` — Shared TypeScript types

## Features

### Supported Verticals
- **Funeral Parlour** (Priority 1 — Flagship)
- **Automotive** (Priority 2)
- **Restaurant** (Priority 3)
- **Spa / Wellness** (Priority 3)

### Modules
- **Internal Dashboard** — Zerpa staff operations
- **CRM** — Lead management and contacts
- **Nest Sales** — Subscription management and provisioning
- **Billing & Invoicing** — Complete invoicing workflow
- **Vertical-Specific Dashboards** — Client-facing portals

## Project Structure

```
zerpa-web/
├── apps/
│   └── web/                    # Next.js 15 application
│       ├── app/                # Next.js App Router
│       ├── components/         # React components
│       ├── lib/                # Utilities, types, mock data
│       ├── public/             # Static assets
│       ├── .env.local          # Environment variables
│       ├── next.config.ts      # Next.js configuration
│       ├── tailwind.config.ts  # Tailwind CSS configuration
│       └── tsconfig.json       # TypeScript configuration
├── packages/
│   └── shared-types/           # Shared TypeScript types
├── turbo.json                  # Turbo monorepo configuration
├── package.json                # Root package configuration
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ with npm or pnpm
- VS Code (recommended)

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install

# For pnpm, set up workspaces
pnpm install
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Design System

### Color Palette
- **Primary:** `#1d3461` (Zerpa Navy)
- **Success:** `#15803d` (Green)
- **Warning:** `#b45309` (Amber)
- **Danger:** `#b91c1c` (Red)
- **Info:** `#1d4ed8` (Blue)

#### Vertical Accents
- **Funeral:** `#6d28d9` (Violet — Flagship)
- **Automotive:** `#1d4ed8` (Blue — Priority)
- **Restaurant:** `#065f46` (Emerald — Standard)
- **Spa:** `#065f46` (Emerald — Standard)

### Typography
- **Display:** Instrument Serif
- **UI & Body:** Outfit
- **Code/Numbers:** JetBrains Mono

### Components
All components follow shadcn/ui patterns and use Tailwind CSS v4 for styling.

## Development Modes

### Mock Mode (Default)
```
NEXT_PUBLIC_USE_MOCK=true
```
All data is loaded from `lib/mock/` fixtures. Perfect for frontend development without a backend.

### Live Mode
```
NEXT_PUBLIC_USE_MOCK=false
```
Requires AWS Cognito and backend API to be running.

## Environment Variables

See `.env.local` for configuration. Key variables:

```bash
NEXT_PUBLIC_USE_MOCK=true              # Use mock data
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_COGNITO_REGION=af-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=...
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Sprint Build Order

1. **Sprint 1** — Foundation (Fonts, CSS tokens, core components)
2. **Sprint 2** — Billing & Invoicing ⭐ (High Priority)
3. **Sprint 3** — CRM & Nest Sales
4. **Sprint 4** — Funeral Vertical (Flagship)
5. **Sprint 5** — Automotive Vertical
6. **Sprint 6** — Restaurant & Spa Verticals
7. **Sprint 7** — Polish & Live Wiring (API, Auth, PDF downloads)

## Building a New Page

1. Create the page file: `app/(section)/route/page.tsx`
2. Wrap with `<PageContainer>`
3. Add `<PageHeader>` at the top
4. Import and use shared components
5. Follow typography and spacing conventions

Example:

```tsx
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function ExamplePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Page Title"
        subtitle="Optional subtitle"
        action={<Button>Action</Button>}
      />
      {/* Content */}
    </PageContainer>
  );
}
```

## Key Files & Directories

| Path | Purpose |
|------|---------|
| `app/globals.css` | Design tokens & Tailwind v4 configuration |
| `app/layout.tsx` | Root layout with fonts |
| `lib/config.ts` | App configuration and feature flags |
| `lib/mock/` | Mock data fixtures |
| `lib/utils/` | Utility functions (currency, dates, etc.) |
| `components/ui/` | Base UI components |
| `components/layouts/` | Layout components (Sidebar, TopBar, etc.) |
| `components/modules/` | Feature-specific components |

## Testing

```bash
# Run tests (when implemented)
npm run test
```

## Linting & Formatting

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## Documentation

Full specification: [ZERPA_FRONTEND_SPECIFICATION.md](./ZERPA_FRONTEND_SPECIFICATION.md)

## Tech Stack Details

- **[Next.js 15](https://nextjs.org/)** — React framework with App Router
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** — Component library
- **[Lucide React](https://lucide.dev/)** — Icon library
- **[date-fns](https://date-fns.org/)** — Date utilities
- **[Recharts](https://recharts.org/)** — Charts library
- **[Sonner](https://sonner.emilkowal.ski/)** — Toast notifications
- **[React Hook Form](https://react-hook-form.com/)** — Form management
- **[Zod](https://zod.dev/)** — Schema validation
- **[AWS Amplify SDK v6](https://aws.amazon.com/amplify/)** — AWS services

## License

Proprietary — Zerpa ICT (PTY) LTD

## Support

For issues, documentation, or feature requests, refer to the specification document and project documentation.
