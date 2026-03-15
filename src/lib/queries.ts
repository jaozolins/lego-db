import { supabase } from "./supabase";

export type SetWithTheme = {
  set_num: string;
  name: string;
  year: number;
  num_parts: number;
  img_url: string | null;
  theme: { id: number; name: string } | null;
};

export type Theme = {
  id: number;
  name: string;
  parent_id: number | null;
};

export async function getSets({
  page = 1,
  perPage = 24,
  themeId,
  yearFrom,
  yearTo,
  search,
  sort = "year-desc",
}: {
  page?: number;
  perPage?: number;
  themeId?: number;
  yearFrom?: number;
  yearTo?: number;
  search?: string;
  sort?: string;
}) {
  let query = supabase
    .from("sets")
    .select("set_num, name, year, num_parts, img_url, theme:themes(id, name)", {
      count: "exact",
    })
    .not("img_url", "is", null)
    .gt("num_parts", 0);

  if (themeId) {
    // Get all child theme IDs for this parent theme
    const { data: childThemes } = await supabase
      .from("themes")
      .select("id")
      .or(`id.eq.${themeId},parent_id.eq.${themeId}`);

    if (childThemes && childThemes.length > 0) {
      const ids = childThemes.map((t) => t.id);
      query = query.in("theme_id", ids);
    }
  }

  if (yearFrom) query = query.gte("year", yearFrom);
  if (yearTo) query = query.lte("year", yearTo);

  if (search) {
    query = query.textSearch("fts", search, { type: "websearch" });
  }

  // Sorting
  const [sortField, sortDir] = sort.split("-");
  const ascending = sortDir === "asc";
  if (sortField === "year") {
    query = query.order("year", { ascending }).order("name", { ascending: true });
  } else if (sortField === "parts") {
    query = query.order("num_parts", { ascending });
  } else if (sortField === "name") {
    query = query.order("name", { ascending });
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching sets:", error);
    return { sets: [], total: 0 };
  }

  return {
    sets: (data || []) as unknown as SetWithTheme[],
    total: count || 0,
  };
}

export async function getTopThemes() {
  const { data } = await supabase
    .from("themes")
    .select("id, name, parent_id")
    .is("parent_id", null)
    .order("name");

  return (data || []) as Theme[];
}
