// Fast, narrow companion to seed-movies.mjs: fills trailer_key on rows
// that predate that field (the 32.5k cached before this feature existed)
// without re-fetching everything else about them. One lightweight
// /movie/{id}/videos call per row instead of the full detail+credits+
// keywords payload — runs alongside seed-movies.mjs safely since it only
// ever touches rows where trailer_key is still null.
import { createClient } from "@supabase/supabase-js";

const TMDB_KEY = process.env.TMDB_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!TMDB_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env: TMDB_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TMDB_BASE = "https://api.themoviedb.org/3";
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tmdb(path) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after")) || 1;
      await sleep(retryAfter * 1000 + 200);
      continue;
    }
    if (res.status >= 500) {
      await sleep(500 * (attempt + 1));
      continue;
    }
    throw new Error(`TMDB ${res.status} ${path}`);
  }
  throw new Error(`TMDB failed after retries: ${path}`);
}

function pickTrailerKey(videos) {
  const yt = videos.filter((v) => v.site === "YouTube");
  yt.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  const pick =
    yt.find((v) => v.type === "Trailer" && v.official) ??
    yt.find((v) => v.type === "Trailer") ??
    yt.find((v) => v.type === "Teaser");
  return pick?.key ?? null;
}

async function loadTargetIds() {
  const ids = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("movies_cache")
      .select("tmdb_id")
      .is("trailer_key", null)
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("loadTargetIds failed:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    for (const row of data) ids.push(row.tmdb_id);
    if (data.length < PAGE) break;
  }
  return ids;
}

async function pool(items, limit, worker) {
  let idx = 0;
  let ok = 0;
  let fail = 0;
  let withTrailer = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        const found = await worker(items[i]);
        ok++;
        if (found) withTrailer++;
      } catch (err) {
        fail++;
        console.error(`  failed for ${items[i]}: ${err.message}`);
      }
      if ((ok + fail) % 500 === 0) {
        console.log(`  progress: ${ok + fail}/${items.length} (ok ${ok}, fail ${fail}, with trailer ${withTrailer})`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, next));
  return { ok, fail, withTrailer };
}

async function main() {
  const start = Date.now();
  const ids = await loadTargetIds();
  console.log(`=== Backfilling trailer_key for ${ids.length} movies ===`);

  const { ok, fail, withTrailer } = await pool(ids, 16, async (id) => {
    const data = await tmdb(`/movie/${id}/videos`);
    const key = pickTrailerKey(data.results ?? []);
    if (key) {
      const { error } = await admin.from("movies_cache").update({ trailer_key: key }).eq("tmdb_id", id);
      if (error) throw new Error(error.message);
    }
    return Boolean(key);
  });

  console.log(`=== Done. ok=${ok} fail=${fail} with_trailer=${withTrailer} ===`);
  console.log(`Finished in ${((Date.now() - start) / 1000).toFixed(0)}s`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
