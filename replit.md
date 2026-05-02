# RestaurantOS — Restaurant Management SaaS

## Project Overview
Full-stack restaurant management system (SaaS) with multi-tenancy, RBAC, real-time kitchen display, POS, billing, and staff management. No Replit-specific dependencies — runs locally or on any server.

## Stack
- **Backend**: Fastify + Drizzle ORM + PostgreSQL (TypeScript ESM)
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS v4
- **Shared**: `@restaurant/shared` — types, validators, constants (workspace package)
- **Package Manager**: pnpm workspaces (monorepo at `/restaurantOS/`)

## Project Structure
```
restaurantOS/
├── apps/
│   ├── api/          # Fastify REST API (port 4000)
│   └── web/          # Next.js 15 frontend (port 3000)
├── packages/
│   └── shared/       # Shared types, validators, constants
└── pnpm-workspace.yaml
```

## Key Features Implemented (V1)
1. **RBAC** — 5 roles: owner > manager > cashier > waiter/kitchen (`apps/api/src/lib/rbac.ts`)
2. **Menu** — categories, items, variants, modifiers with GST rates
3. **POS** — order creation (dine-in/takeaway/delivery), cart, table selection, auto-KOT
4. **Kitchen Display (KDS)** — SSE real-time + 15s polling fallback, 3-column kanban (pending/preparing/ready), priority flags
5. **Tables** — floor map, status management, occupancy tracking
6. **Billing** — GST breakdown by rate, payment collection (cash/card/UPI/razorpay), discount support, print-to-80mm-receipt
7. **Staff** — CRUD with role assignment, active/inactive toggle
8. **Dashboard** — revenue stats, hourly bar chart (recharts), top selling items

## API Architecture
- **Auth**: JWT (Bearer token + query param for SSE)
- **SSE**: `GET /api/sse/events?token=<jwt>` — broadcasts `kot_status`, `order_created` events
- **Multitenancy**: All data scoped to `tenantId` from JWT payload
- Routes: `/api/auth`, `/api/menu`, `/api/orders`, `/api/kot`, `/api/billing`, `/api/tables`, `/api/users`, `/api/dashboard`, `/api/sse`

## Database Schema
- tenants, users, menu_categories, menu_items, **menu_variants**, **menu_modifiers**, restaurant_tables, orders, order_items, kots, kot_items, bills
- Migration for variants/modifiers: `apps/api/src/db/migrations/0002_menu_variants_modifiers.sql`

## Running Locally
```bash
# 1. Install deps
cd restaurantOS && pnpm install

# 2. Set up DB
cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL, JWT_SECRET

# 3. Push schema
pnpm --filter @restaurant/api run db:push

# 4. Seed initial data
pnpm --filter @restaurant/api run db:seed

# 5. Start API (port 4000)
pnpm --filter @restaurant/api run dev

# 6. Start Web (port 3000)
pnpm --filter web run dev
```

## UI Component System
All components are in `apps/web/components/`:
- `ui/` — button, badge, modal, input/select/textarea, spinner, stats-card, empty-state, toast
- `menu/` — category-tabs, menu-item-card, menu-item-modal
- `kitchen/` — kot-card (SSE-connected)
- `tables/` — table-card
- `billing/` — payment-modal, print-bill
- `staff/` — staff-modal
- `layout/` — app-layout, sidebar

## Key Files
- `apps/web/lib/api.ts` — typed API client + `createSseConnection()`
- `apps/web/lib/utils.ts` — `cn()`, `formatCurrency()` (INR)
- `apps/web/app/providers.tsx` — QueryClientProvider + AuthProvider + ToastProvider
- `apps/api/src/lib/rbac.ts` — role guards (ownerOnly, managerUp, cashierUp, allStaff, etc.)
- `apps/api/src/routes/sse.ts` — SSE hub with `broadcastKotUpdate` / `broadcastOrderUpdate`

## Design Decisions
- No virtual environments or Docker — pure pnpm workspaces
- SSE token via query param (EventSource API limitation — no custom headers)
- 80mm thermal receipt printing via `@media print` CSS
- Tailwind v4 with custom CSS variables in `globals.css`
- `recharts` for dashboard charts (already in dependencies)
