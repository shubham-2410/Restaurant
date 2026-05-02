# RestaurantOS

Multi-tenant Restaurant Management SaaS built with Next.js, Fastify, PostgreSQL, and Turborepo.

## Prerequisites

- Node.js >= 20
- pnpm >= 10
- Docker & Docker Compose

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Copy env
cp .env.example .env
# Edit .env with your values

# 4. Push DB schema
pnpm db:push

# 5. Seed demo data
pnpm db:seed

# 6. Start dev
pnpm dev
```

## Apps

| App | URL | Description |
|-----|-----|-------------|
| Web | http://localhost:3000 | Next.js frontend |
| API | http://localhost:4000 | Fastify backend |

## Demo Login

- Email: `owner@spicegarden.com`
- Password: `password123`

## Structure

```
apps/
  web/        — Next.js 15 frontend (App Router)
  api/        — Fastify + Drizzle ORM backend
  mobile/     — Expo React Native (V2)
  desktop/    — Tauri (wraps web app)
packages/
  shared/     — Types, validators, API client (shared across all apps)
```
