# Bricks in Box! — Architecture

## Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres) — free tier
- **Hosting:** Vercel — free tier, deploys via GitHub push
- **Data source:** Rebrickable (free CSV downloads + API)
- **Domain:** bricksinbox.com (Namecheap, DNS pointed to Vercel)

## URLs
- Production: https://lego-db.vercel.app (+ bricksinbox.com once DNS propagates)
- GitHub: https://github.com/jaozolins/lego-db
- Supabase: https://oterqdeqomnliojiggrt.supabase.co

## Database Schema
8 core tables mirroring Rebrickable's relational structure:
- **themes** — hierarchical (parent_id → self), 490 rows
- **sets** — 26,339 rows, full-text search via `fts` column
- **parts** — 61,702 rows
- **part_categories** — 76 rows
- **colors** — 275 rows
- **minifigs** — 16,646 rows
- **inventories** — links sets to contents (partial import, FK issues with minifig inventories)
- **inventory_parts / inventory_sets / inventory_minifigs** — relationship tables

Key indexes: year, theme_id, num_parts on sets. GIN index on fts column for search.

## Data Pipeline
- `scripts/import-data.ts` — downloads Rebrickable CSVs, bulk upserts into Supabase
- Run with: `npm run db:import`
- Order matters: colors → part_categories → themes → parts → sets → minifigs → inventories → inventory_*
- Images hosted by Rebrickable (cdn.rebrickable.com), referenced by URL

## Project Structure
```
src/
  app/
    layout.tsx          — root layout, Inter font, metadata
    page.tsx            — main browse page (server component)
    globals.css         — Tailwind + shadcn theme vars
  components/
    set-card.tsx        — individual set card (image, name, year, pieces, theme)
    set-filters.tsx     — search, theme/decade/sort filters (client component)
    pagination.tsx      — page navigation (client component)
    ui/                 — shadcn/ui base components
  lib/
    supabase.ts         — public Supabase client (anon key)
    supabase-admin.ts   — admin Supabase client (service role key)
    queries.ts          — data fetching functions (getSets, getTopThemes)
scripts/
  setup-database.sql    — full schema DDL
  import-data.ts        — CSV download + import script
data/                   — downloaded CSVs (gitignored)
```

## Environment Variables
Stored in `.env.local` (gitignored) and Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REBRICKABLE_API_KEY`

## Design Direction
- **Reference:** Vivino.com — clean, modern, light-mode
- Light white base, bold product imagery, generous whitespace
- LEGO red (#DA291C) as accent color
- Cards with large images, subtle metadata badges
- Every set page should feel editorial, not like a database row

## What's Built (v1 progress)
- [x] Data pipeline (download + import)
- [x] Browse page with set grid
- [x] Search (full-text via Postgres)
- [x] Filters (theme, decade, sort)
- [x] Pagination
- [x] Deployed to Vercel

## Next Up
- [ ] Set detail page (`/sets/[set_num]`)
- [ ] Theme browser (`/themes`)
- [ ] Mobile polish
- [ ] SEO meta tags per page
- [ ] Collection tracking (v2)
- [ ] Affiliate links (v2)
