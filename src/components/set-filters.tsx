"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import type { Theme } from "@/lib/queries";

export function SetFilters({ themes }: { themes: Theme[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTheme = searchParams.get("theme") || "";
  const currentYear = searchParams.get("year") || "";
  const currentSort = searchParams.get("sort") || "year-desc";
  const currentSearch = searchParams.get("q") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset to page 1 when filters change
      params.delete("page");
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  // Decade options
  const decades = [
    { label: "All years", value: "" },
    { label: "2020s", value: "2020" },
    { label: "2010s", value: "2010" },
    { label: "2000s", value: "2000" },
    { label: "1990s", value: "1990" },
    { label: "1980s", value: "1980" },
    { label: "Vintage (pre-1980)", value: "1949" },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Input
          type="search"
          placeholder="Search sets..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const value = e.target.value;
            // Debounce search
            const timeout = setTimeout(() => {
              updateParams({ q: value });
            }, 400);
            return () => clearTimeout(timeout);
          }}
          className="pl-10 h-11 rounded-lg border-neutral-200 bg-white text-base"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        {/* Theme filter */}
        <select
          value={currentTheme}
          onChange={(e) => updateParams({ theme: e.target.value })}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
        >
          <option value="">All themes</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id.toString()}>
              {theme.name}
            </option>
          ))}
        </select>

        {/* Decade filter */}
        <select
          value={currentYear}
          onChange={(e) => updateParams({ year: e.target.value })}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
        >
          {decades.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
        >
          <option value="year-desc">Newest first</option>
          <option value="year-asc">Oldest first</option>
          <option value="parts-desc">Most pieces</option>
          <option value="parts-asc">Fewest pieces</option>
          <option value="name-asc">A → Z</option>
          <option value="name-desc">Z → A</option>
        </select>

        {isPending && (
          <div className="flex items-center text-sm text-neutral-400">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
