# LEGO Collector Database — Project Plan

## Vision
The most beautiful LEGO set database on the web. Vivino-style clean, modern design. Every set page feels like an editorial product page, not a database row.

---

## Architecture Overview

```
Rebrickable CSVs ──→ Import Script ──→ Supabase (Postgres)
                                            ↓
Rebrickable API ──→ Image URLs ──→    Next.js App (Vercel)
                                            ↓
                                    User's Browser
```

### Three layers:
1. **Data Pipeline** — One-time CSV import + scheduled refresh script
2. **Backend** — Supabase (Postgres DB + API + full-text search)
3. **Frontend** — Next.js App Router, server components, ISR for set pages

---

## Database Schema

Based on Rebrickable's data structure:

### Core Tables
- **themes** — id, name, parent_id (themes are hierarchical: LEGO > Star Wars > Clone Wars)
- **sets** — set_num (PK), name, year, theme_id, num_parts, img_url
- **parts** — part_num (PK), name, part_cat_id, part_material
- **part_categories** — id, name
- **colors** — id, name, rgb, is_trans
- **minifigs** — fig_num (PK), name, num_parts, img_url

### Relationship Tables
- **inventories** — id, set_num, version
- **inventory_parts** — inventory_id, part_num, color_id, quantity, is_spare
- **inventory_sets** — inventory_id, set_num, quantity (sets within sets)
- **inventory_minifigs** — inventory_id, fig_num, quantity

### Indexes
- sets: year, theme_id, num_parts (for filtering/sorting)
- Full-text search index on sets.name and themes.name
- themes: parent_id (for hierarchy queries)

---

## Data Pipeline

### Initial Import (one-time)
1. Download all CSVs from Rebrickable
2. Node.js script that:
   - Reads CSVs with `csv-parse`
   - Maps to our schema
   - Bulk inserts into Supabase via `@supabase/supabase-js`
   - Handles foreign key order: colors → part_categories → themes → parts → sets → inventories → inventory_*

### Image Strategy
- Store Rebrickable `img_url` directly in our DB (they host the images)
- Use Next.js `<Image>` with Rebrickable domain in `next.config.js` for optimization
- No need to download/store images ourselves initially

### Refresh (later)
- Weekly cron job to re-download CSVs and upsert changes
- Or use Rebrickable API to check for updates

---

## V1 Pages & Routes

### 1. Homepage — `/`
- Hero section with a stunning featured set (curated or random iconic set)
- "Trending themes" or "Popular themes" grid
- Recent/notable sets section
- Search bar prominently placed
- Clean, Vivino-style layout

### 2. Browse/Search — `/sets`
- Grid of set cards (image, name, year, piece count, theme)
- Filters: theme, year range, piece count range
- Sort: name, year, pieces, theme
- Full-text search
- Pagination or infinite scroll

### 3. Set Detail Page — `/sets/[set_num]`
- **Hero:** Large set image, clean and cinematic
- **Key stats:** Year, theme, piece count — as visual badges
- **Parts breakdown:** Color palette visualization, top parts
- **Minifigures:** Grid of included minifigs with images
- **Related sets:** Same theme, same year, similar piece count
- **Breadcrumb:** Home > Theme > Sub-theme > Set

### 4. Theme Browser — `/themes`
- Visual grid of top-level themes (Star Wars, City, Technic, etc.)
- Each theme card shows: name, set count, representative image
- Click into a theme → sub-themes or set grid

### 5. Theme Detail — `/themes/[id]`
- Theme hero with description
- Sub-themes navigation
- Grid of all sets in this theme
- Filter/sort within theme

---

## Visual Design Direction

### Reference: Vivino.com
- **Light, clean background** — white/off-white base
- **Bold product imagery** — sets as heroes, large and prominent
- **Generous whitespace** — let the LEGO images breathe
- **Crisp typography** — modern sans-serif (Inter or similar)
- **Subtle shadows and borders** — cards feel tactile but not heavy
- **Accent color** — consider LEGO red (#DA291C) or yellow (#FFD700) as accent

### Set Cards
- Large image (dominant)
- Set name (bold)
- Year + piece count as subtle metadata
- Theme as a small tag/badge
- Hover: subtle lift/shadow

### Set Detail Page
- Full-width image hero area
- Stats as visual pills/badges below image
- Clean sections with clear hierarchy
- Parts shown as a color palette bar (visual, not a table)

---

## V1 vs Later

### V1 (MVP)
- [x] Data import pipeline
- [x] Homepage with featured sets and themes
- [x] Set browsing with search, filters, sort
- [x] Set detail pages (image, stats, parts, minifigs)
- [x] Theme browsing and detail pages
- [x] Responsive design (mobile-first)
- [x] SEO basics (meta tags, set page titles)

### V2
- [ ] Collection tracking (auth + "I own this" / "I want this")
- [ ] User accounts (Supabase Auth)
- [ ] Affiliate links to buy sets (BrickLink, Amazon, LEGO.com)
- [ ] Set price/value tracking
- [ ] Advanced search (by part, by color, by minifig)

### V3+
- [ ] Leaderboards (largest sets, most valuable, rarest)
- [ ] AI-generated descriptions/stories per set
- [ ] Community features (reviews, ratings)
- [ ] Price history charts
- [ ] Part compatibility/cross-reference tools
- [ ] MOC (My Own Creation) gallery integration

---

## Setup Checklist (before we code)

1. [ ] Create Rebrickable account → generate API key
2. [ ] Create Supabase project (free tier)
3. [ ] Initialize Next.js project in ~/Sites/lego-db
4. [ ] Download Rebrickable CSVs
5. [ ] Build and run import script
6. [ ] First page: set detail page (the money page)

---

## Suggested Build Order

Build the most impressive thing first — momentum matters.

1. **Session 1:** Project setup (Next.js, Supabase, Tailwind, shadcn/ui)
2. **Session 2:** Data import script + run it
3. **Session 3:** Set detail page — the hero page, make it beautiful
4. **Session 4:** Set browse/search page
5. **Session 5:** Homepage + theme browser
6. **Session 6:** Polish, responsive, SEO, deploy to Vercel

Each session = ~2 hours. Roughly 6 weekends to MVP.
