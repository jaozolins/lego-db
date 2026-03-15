import { Suspense } from "react";
import { getSets, getTopThemes } from "@/lib/queries";
import { SetCard } from "@/components/set-card";
import { SetFilters } from "@/components/set-filters";
import { Pagination } from "@/components/pagination";

const PER_PAGE = 24;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const themeId = params.theme ? Number(params.theme) : undefined;
  const sort = (params.sort as string) || "year-desc";
  const search = (params.q as string) || undefined;

  // Parse decade filter into year range
  let yearFrom: number | undefined;
  let yearTo: number | undefined;
  if (params.year) {
    const y = Number(params.year);
    if (y === 1949) {
      yearFrom = 1949;
      yearTo = 1979;
    } else {
      yearFrom = y;
      yearTo = y + 9;
    }
  }

  const [{ sets, total }, themes] = await Promise.all([
    getSets({ page, perPage: PER_PAGE, themeId, yearFrom, yearTo, search, sort }),
    getTopThemes(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              Bricks in Box!
            </h1>
            <span className="text-sm text-neutral-400">
              {total.toLocaleString()} sets
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={null}>
          <SetFilters themes={themes} />
        </Suspense>

        {/* Set grid */}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {sets.map((set) => (
            <SetCard key={set.set_num} set={set} />
          ))}
        </div>

        {sets.length === 0 && (
          <div className="py-20 text-center text-neutral-400">
            No sets found. Try a different search or filter.
          </div>
        )}

        <Suspense fallback={null}>
          <Pagination total={total} perPage={PER_PAGE} currentPage={page} />
        </Suspense>
      </main>
    </div>
  );
}
