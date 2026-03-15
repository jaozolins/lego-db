-- LEGO Collector Database Schema
-- Based on Rebrickable data structure

-- Themes (hierarchical: parent_id references self)
CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES themes(id)
);

-- Part categories
CREATE TABLE IF NOT EXISTS part_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

-- Colors
CREATE TABLE IF NOT EXISTS colors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  rgb TEXT,
  is_trans BOOLEAN DEFAULT FALSE
);

-- Sets
CREATE TABLE IF NOT EXISTS sets (
  set_num TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  theme_id INTEGER REFERENCES themes(id),
  num_parts INTEGER DEFAULT 0,
  img_url TEXT
);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
  part_num TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  part_cat_id INTEGER REFERENCES part_categories(id),
  part_material TEXT
);

-- Minifigs
CREATE TABLE IF NOT EXISTS minifigs (
  fig_num TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  num_parts INTEGER DEFAULT 0,
  img_url TEXT
);

-- Inventories (links sets to their contents)
CREATE TABLE IF NOT EXISTS inventories (
  id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  set_num TEXT NOT NULL REFERENCES sets(set_num)
);

-- Inventory parts
CREATE TABLE IF NOT EXISTS inventory_parts (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL REFERENCES inventories(id),
  part_num TEXT NOT NULL REFERENCES parts(part_num),
  color_id INTEGER NOT NULL REFERENCES colors(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  is_spare BOOLEAN DEFAULT FALSE,
  img_url TEXT
);

-- Inventory sets (sets within sets, like gift boxes)
CREATE TABLE IF NOT EXISTS inventory_sets (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL REFERENCES inventories(id),
  set_num TEXT NOT NULL REFERENCES sets(set_num),
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Inventory minifigs
CREATE TABLE IF NOT EXISTS inventory_minifigs (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL REFERENCES inventories(id),
  fig_num TEXT NOT NULL REFERENCES minifigs(fig_num),
  quantity INTEGER NOT NULL DEFAULT 1
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sets_year ON sets(year);
CREATE INDEX IF NOT EXISTS idx_sets_theme_id ON sets(theme_id);
CREATE INDEX IF NOT EXISTS idx_sets_num_parts ON sets(num_parts);
CREATE INDEX IF NOT EXISTS idx_themes_parent_id ON themes(parent_id);
CREATE INDEX IF NOT EXISTS idx_inventories_set_num ON inventories(set_num);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_inventory_id ON inventory_parts(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_part_num ON inventory_parts(part_num);
CREATE INDEX IF NOT EXISTS idx_inventory_parts_color_id ON inventory_parts(color_id);
CREATE INDEX IF NOT EXISTS idx_inventory_minifigs_inventory_id ON inventory_minifigs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sets_inventory_id ON inventory_sets(inventory_id);

-- Full-text search on sets
ALTER TABLE sets ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;
CREATE INDEX IF NOT EXISTS idx_sets_fts ON sets USING gin(fts);
