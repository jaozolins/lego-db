import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { readFile } from "fs/promises";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import path from "path";

// Load env from .env.local
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = path.resolve(__dirname, "../data");

const CSV_FILES = [
  { name: "colors", url: "https://cdn.rebrickable.com/media/downloads/colors.csv.gz" },
  { name: "part_categories", url: "https://cdn.rebrickable.com/media/downloads/part_categories.csv.gz" },
  { name: "themes", url: "https://cdn.rebrickable.com/media/downloads/themes.csv.gz" },
  { name: "parts", url: "https://cdn.rebrickable.com/media/downloads/parts.csv.gz" },
  { name: "sets", url: "https://cdn.rebrickable.com/media/downloads/sets.csv.gz" },
  { name: "minifigs", url: "https://cdn.rebrickable.com/media/downloads/minifigs.csv.gz" },
  { name: "inventories", url: "https://cdn.rebrickable.com/media/downloads/inventories.csv.gz" },
  { name: "inventory_parts", url: "https://cdn.rebrickable.com/media/downloads/inventory_parts.csv.gz" },
  { name: "inventory_sets", url: "https://cdn.rebrickable.com/media/downloads/inventory_sets.csv.gz" },
  { name: "inventory_minifigs", url: "https://cdn.rebrickable.com/media/downloads/inventory_minifigs.csv.gz" },
];

async function downloadFile(url: string, dest: string): Promise<void> {
  if (existsSync(dest)) {
    console.log(`  ✓ Already downloaded: ${path.basename(dest)}`);
    return;
  }

  console.log(`  ↓ Downloading: ${path.basename(dest)}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);

  const gzDest = dest + ".gz";
  const fileStream = createWriteStream(gzDest);
  const reader = response.body!.getReader();

  // Write chunks to file
  const writableStream = new WritableStream({
    write(chunk) {
      fileStream.write(chunk);
    },
    close() {
      fileStream.end();
    },
  });
  await reader.read().then(async function process({ done, value }): Promise<void> {
    if (done) {
      fileStream.end();
      return;
    }
    fileStream.write(value);
    return reader.read().then(process);
  });

  // Decompress
  await pipeline(createReadStream(gzDest), createGunzip(), createWriteStream(dest));
  // Remove .gz file
  const { unlink } = await import("fs/promises");
  await unlink(gzDest);
}

async function downloadAll(): Promise<void> {
  console.log("\n📦 Downloading Rebrickable data...\n");
  const { mkdirSync } = await import("fs");
  mkdirSync(DATA_DIR, { recursive: true });

  for (const file of CSV_FILES) {
    const dest = path.join(DATA_DIR, `${file.name}.csv`);
    await downloadFile(file.url, dest);
  }
  console.log("\n✓ All files downloaded.\n");
}

async function readCSV(name: string): Promise<Record<string, string>[]> {
  const filePath = path.join(DATA_DIR, `${name}.csv`);
  const content = await readFile(filePath, "utf-8");
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function importTable(
  name: string,
  transform: (row: Record<string, string>) => Record<string, unknown>
): Promise<void> {
  console.log(`  → Importing ${name}...`);
  const rows = await readCSV(name);
  const transformed = rows.map(transform);

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(name).upsert(batch, { onConflict: getConflictKey(name) });
    if (error) {
      console.error(`  ✗ Error in ${name} batch ${i}: ${error.message}`);
      // Log first failing row for debugging
      if (batch[0]) console.error(`    First row:`, JSON.stringify(batch[0]).slice(0, 200));
      continue;
    }
    inserted += batch.length;
  }
  console.log(`  ✓ ${name}: ${inserted.toLocaleString()} rows imported`);
}

function getConflictKey(table: string): string {
  const keys: Record<string, string> = {
    colors: "id",
    part_categories: "id",
    themes: "id",
    parts: "part_num",
    sets: "set_num",
    minifigs: "fig_num",
    inventories: "id",
  };
  return keys[table] || "id";
}

async function importAll(): Promise<void> {
  console.log("\n🗄️  Importing data into Supabase...\n");

  // Order matters due to foreign keys

  await importTable("colors", (row) => ({
    id: parseInt(row.id),
    name: row.name,
    rgb: row.rgb || null,
    is_trans: row.is_trans === "t",
  }));

  await importTable("part_categories", (row) => ({
    id: parseInt(row.id),
    name: row.name,
  }));

  // Themes need special handling — parent_id might reference a theme not yet inserted
  // Import themes without parent_id first, then update
  console.log("  → Importing themes (pass 1: without parents)...");
  const themeRows = await readCSV("themes");
  const themes = themeRows.map((row) => ({
    id: parseInt(row.id),
    name: row.name,
    parent_id: null as number | null,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < themes.length; i += BATCH_SIZE) {
    const batch = themes.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("themes").upsert(batch, { onConflict: "id" });
    if (error) console.error(`  ✗ Error in themes batch: ${error.message}`);
  }

  // Now update parent_ids
  console.log("  → Updating theme parents (pass 2)...");
  const themesWithParents = themeRows
    .filter((row) => row.parent_id && row.parent_id !== "")
    .map((row) => ({
      id: parseInt(row.id),
      name: row.name,
      parent_id: parseInt(row.parent_id),
    }));

  for (let i = 0; i < themesWithParents.length; i += BATCH_SIZE) {
    const batch = themesWithParents.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("themes").upsert(batch, { onConflict: "id" });
    if (error) console.error(`  ✗ Error updating theme parents: ${error.message}`);
  }
  console.log(`  ✓ themes: ${themes.length.toLocaleString()} rows imported`);

  await importTable("parts", (row) => ({
    part_num: row.part_num,
    name: row.name,
    part_cat_id: row.part_cat_id ? parseInt(row.part_cat_id) : null,
    part_material: row.part_material || null,
  }));

  await importTable("sets", (row) => ({
    set_num: row.set_num,
    name: row.name,
    year: parseInt(row.year),
    theme_id: row.theme_id ? parseInt(row.theme_id) : null,
    num_parts: parseInt(row.num_parts) || 0,
    img_url: row.img_url || null,
  }));

  await importTable("minifigs", (row) => ({
    fig_num: row.fig_num,
    name: row.name,
    num_parts: parseInt(row.num_parts) || 0,
    img_url: row.img_url || null,
  }));

  await importTable("inventories", (row) => ({
    id: parseInt(row.id),
    version: parseInt(row.version),
    set_num: row.set_num,
  }));

  // Inventory_parts is the biggest table — handle carefully
  console.log("  → Importing inventory_parts (large table, be patient)...");
  const ipRows = await readCSV("inventory_parts");
  let ipInserted = 0;
  for (let i = 0; i < ipRows.length; i += BATCH_SIZE) {
    const batch = ipRows.slice(i, i + BATCH_SIZE).map((row) => ({
      inventory_id: parseInt(row.inventory_id),
      part_num: row.part_num,
      color_id: parseInt(row.color_id),
      quantity: parseInt(row.quantity) || 1,
      is_spare: row.is_spare === "t",
      img_url: row.img_url || null,
    }));
    const { error } = await supabase.from("inventory_parts").insert(batch);
    if (error && !error.message.includes("duplicate")) {
      console.error(`  ✗ Error in inventory_parts batch ${i}: ${error.message}`);
    }
    ipInserted += batch.length;
    if (ipInserted % 50000 === 0) {
      console.log(`    ... ${ipInserted.toLocaleString()} rows`);
    }
  }
  console.log(`  ✓ inventory_parts: ${ipInserted.toLocaleString()} rows imported`);

  // Inventory sets
  console.log("  → Importing inventory_sets...");
  const isRows = await readCSV("inventory_sets");
  let isInserted = 0;
  for (let i = 0; i < isRows.length; i += BATCH_SIZE) {
    const batch = isRows.slice(i, i + BATCH_SIZE).map((row) => ({
      inventory_id: parseInt(row.inventory_id),
      set_num: row.set_num,
      quantity: parseInt(row.quantity) || 1,
    }));
    const { error } = await supabase.from("inventory_sets").insert(batch);
    if (error && !error.message.includes("duplicate")) {
      console.error(`  ✗ Error in inventory_sets batch ${i}: ${error.message}`);
    }
    isInserted += batch.length;
  }
  console.log(`  ✓ inventory_sets: ${isInserted.toLocaleString()} rows imported`);

  // Inventory minifigs
  console.log("  → Importing inventory_minifigs...");
  const imRows = await readCSV("inventory_minifigs");
  let imInserted = 0;
  for (let i = 0; i < imRows.length; i += BATCH_SIZE) {
    const batch = imRows.slice(i, i + BATCH_SIZE).map((row) => ({
      inventory_id: parseInt(row.inventory_id),
      fig_num: row.fig_num,
      quantity: parseInt(row.quantity) || 1,
    }));
    const { error } = await supabase.from("inventory_minifigs").insert(batch);
    if (error && !error.message.includes("duplicate")) {
      console.error(`  ✗ Error in inventory_minifigs batch ${i}: ${error.message}`);
    }
    imInserted += batch.length;
  }
  console.log(`  ✓ inventory_minifigs: ${imInserted.toLocaleString()} rows imported`);

  console.log("\n✅ Import complete!\n");
}

async function main() {
  console.log("🧱 LEGO Database Import Tool\n");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  await downloadAll();
  await importAll();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
