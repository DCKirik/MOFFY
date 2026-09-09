// TMDB's official movie genre list (stable, rarely changes) — used for
// filter UIs where fetching /genre/movie/list on every render isn't worth
// it. https://developer.themoviedb.org/reference/genre-movie-list
export const TMDB_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
] as const;

// Genre filter CHIPS get translated (small, fixed, high-visibility list);
// a movie's own genre tags elsewhere stay in English along with its other
// TMDB-sourced content (title, overview, cast) — see lib/i18n/dictionary.ts.
const GENRE_NAMES_TR: Record<number, string> = {
  28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç",
  99: "Belgesel", 18: "Drama", 10751: "Aile", 14: "Fantastik", 36: "Tarih",
  27: "Korku", 10402: "Müzik", 9648: "Gizem", 10749: "Romantik",
  878: "Bilim Kurgu", 53: "Gerilim", 10752: "Savaş", 37: "Western",
};
const GENRE_NAMES_FR: Record<number, string> = {
  28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie", 80: "Policier",
  99: "Documentaire", 18: "Drame", 10751: "Famille", 14: "Fantastique", 36: "Histoire",
  27: "Horreur", 10402: "Musique", 9648: "Mystère", 10749: "Romance",
  878: "Science-fiction", 53: "Thriller", 10752: "Guerre", 37: "Western",
};

export function genreName(lang: "en" | "tr" | "fr", id: number, fallback: string): string {
  if (lang === "tr") return GENRE_NAMES_TR[id] ?? fallback;
  if (lang === "fr") return GENRE_NAMES_FR[id] ?? fallback;
  return fallback;
}
