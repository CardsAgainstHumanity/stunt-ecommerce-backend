# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reference Documentation

**MANDATORY:** Always search Astro docs via `mcp__astro-docs__search_astro_docs` before implementing Astro-related features.

**MANDATORY:** Always fetch Payload Ecommerce docs before implementing ecommerce features:
- Overview: https://raw.githubusercontent.com/payloadcms/payload/main/docs/ecommerce/overview.mdx
- Frontend (useCart, EcommerceProvider): https://raw.githubusercontent.com/payloadcms/payload/main/docs/ecommerce/frontend.mdx
- Plugin config: https://raw.githubusercontent.com/payloadcms/payload/main/docs/ecommerce/plugin.mdx
- Payments: https://raw.githubusercontent.com/payloadcms/payload/main/docs/ecommerce/payments.mdx
- Advanced: https://raw.githubusercontent.com/payloadcms/payload/main/docs/ecommerce/advanced.mdx

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run devsafe          # Clean start (removes .next and .open-next first)

# Testing
npm run test             # Run all tests (integration + e2e)
npm run test:int         # Run integration tests only (vitest)
npm run test:e2e         # Run e2e tests only (playwright)

# Code generation
npm run generate:types   # Generate Cloudflare + Payload types
npm run payload migrate:create  # Create new database migration

# Deployment (requires CLOUDFLARE_ENV)
npm run deploy           # Run migrations + build + deploy to Cloudflare
npm run preview          # Build and preview locally via Cloudflare emulation
```

## Architecture

This is a **Payload CMS 3.x + Next.js 15** application deployed to **Cloudflare Workers** with D1 (SQLite) and R2 storage.

### Key Files
- `src/payload.config.ts` - Main Payload configuration with ecommerce plugin
- `wrangler.jsonc` - Cloudflare Workers config (D1 database, R2 bucket bindings)
- `src/access/index.ts` - Reusable access control functions (adminOnly, adminOrCustomerOwner, etc.)

### Route Groups
- `src/app/(frontend)/` - Public-facing pages
- `src/app/(payload)/` - Payload admin panel and API routes
  - `/admin` - Admin dashboard
  - `/api/[...slug]` - REST API
  - `/api/graphql` - GraphQL endpoint

### Collections
- `Users` - Auth-enabled, roles: admin/customer. First user auto-promoted to admin.
- `Media` - File uploads stored in R2 (no sharp/image processing on Workers)
- Ecommerce collections from `@payloadcms/plugin-ecommerce` (products, carts, orders, etc.)

### Access Control Pattern
Access functions in `src/access/` are passed to the ecommerce plugin:
- `adminOnly` - Admin role required
- `adminOrCustomerOwner` - Admin or document owner (via customer field)
- `adminOrPublishedStatus` - Admin sees all, others see published only

### Database Migrations
Migrations live in `src/migrations/`. After schema changes:
```bash
npm run payload migrate:create
npm run payload migrate  # Run locally
```
For production, migrations run automatically during `npm run deploy`.

## Cloudflare-Specific Notes

- Uses `@opennextjs/cloudflare` for Next.js → Workers compatibility
- D1 binding accessed via `cloudflare.env.D1` in payload config
- R2 binding accessed via `cloudflare.env.R2`
- No image cropping/focal point (sharp not available on Workers)
- Paid Workers plan required due to bundle size limits
