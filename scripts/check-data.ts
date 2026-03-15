import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Top-level themes (parent_id is null)
  const { data: themes } = await supabase.from("themes").select("id, name").is("parent_id", null).order("name");
  console.log("Top-level themes:", themes?.length);
  console.log(themes?.map(t => `${t.id}: ${t.name}`).join("\n"));

  // Year range
  const { data: minYear } = await supabase.from("sets").select("year").order("year", { ascending: true }).limit(1);
  const { data: maxYear } = await supabase.from("sets").select("year").order("year", { ascending: false }).limit(1);
  console.log("\nYear range:", minYear?.[0]?.year, "-", maxYear?.[0]?.year);

  // Sample set with image
  const { data: sampleSets } = await supabase.from("sets").select("set_num, name, year, num_parts, img_url, theme_id").not("img_url", "is", null).order("num_parts", { ascending: false }).limit(5);
  console.log("\nTop 5 sets by parts:");
  sampleSets?.forEach(s => console.log(`  ${s.set_num}: ${s.name} (${s.year}, ${s.num_parts} parts) - ${s.img_url}`));

  // Total sets with images
  const { count } = await supabase.from("sets").select("*", { count: "exact", head: true }).not("img_url", "is", null);
  console.log("\nSets with images:", count);
}
main();
