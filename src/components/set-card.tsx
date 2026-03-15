import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SetWithTheme } from "@/lib/queries";

export function SetCard({ set }: { set: SetWithTheme }) {
  return (
    <Link
      href={`/sets/${set.set_num}`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 transition-shadow group-hover:shadow-lg">
        {set.img_url ? (
          <Image
            src={set.img_url}
            alt={set.name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            No image
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-neutral-900 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
          {set.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>{set.year}</span>
          <span className="text-neutral-300">·</span>
          <span>{set.num_parts.toLocaleString()} pcs</span>
        </div>
        {set.theme && (
          <Badge variant="secondary" className="text-xs font-normal mt-1">
            {set.theme.name}
          </Badge>
        )}
      </div>
    </Link>
  );
}
