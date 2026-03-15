"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Pagination({
  total,
  perPage,
  currentPage,
}: {
  total: number;
  perPage: number;
  currentPage: number;
}) {
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    return `/?${params.toString()}`;
  }

  // Show a window of pages around current
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Previous
        </Link>
      )}

      {start > 1 && (
        <>
          <Link
            href={buildHref(1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            1
          </Link>
          {start > 2 && (
            <span className="text-neutral-300">...</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors ${
            page === currentPage
              ? "bg-neutral-900 text-white font-medium"
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          {page}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-neutral-300">...</span>
          )}
          <Link
            href={buildHref(totalPages)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  );
}
