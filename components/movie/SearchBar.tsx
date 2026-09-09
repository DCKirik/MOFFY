"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { tmdbImage } from "@/lib/tmdb/image";
import { autocompleteMovies, type SearchSuggestion } from "@/app/(main)/search/actions";

export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!next.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        autocompleteMovies(next).then((results) => {
          setSuggestions(results);
          setOpen(true);
        });
      });
    }, 200);
  }

  return (
    <div ref={containerRef} className="relative">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          router.push(`/search?q=${encodeURIComponent(value)}`);
        }}
      >
        <input
          name="q"
          type="search"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search for a movie, studio, or keyword..."
          autoComplete="off"
          className="w-full rounded-xl2 border border-white/15 bg-brand-surface px-4 py-2.5 text-brand-ink outline-none focus:border-brand-orange"
        />
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-xl2 bg-brand-yellow px-5 py-2.5 font-semibold text-brand-bg transition-colors hover:bg-brand-yellow-dark"
        >
          Search
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 flex flex-col gap-1 rounded-xl2 border border-white/10 bg-brand-surface p-2 shadow-[0_0_24px_4px_rgba(245,183,34,0.15),0_10px_25px_-5px_rgba(0,0,0,0.5)]">
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={`/movie/${s.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-brand-surface-2"
            >
              <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-brand-surface-2">
                {tmdbImage(s.posterPath, "w92") && (
                  <Image src={tmdbImage(s.posterPath, "w92")!} alt={s.title} fill sizes="32px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-brand-ink">{s.title}</p>
                {s.year && <p className="text-xs text-brand-ink/50">{s.year}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
