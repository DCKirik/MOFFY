// One-off bulk seed: populate movies_cache with ~4000 titles, guaranteeing
// strong Turkish-comedy / Turkish-catalog coverage for the TR market, plus
// original_language + spoken_languages on every row.
import { createClient } from "@supabase/supabase-js";

const TMDB_KEY = process.env.TMDB_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!TMDB_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env: TMDB_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const TMDB_BASE = "https://api.themoviedb.org/3";
const TARGET_TOTAL = 4300; // buffer above 4000 — some detail fetches will fail/dedupe
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tmdb(path, params = {}) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
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

// idOrder preserves insertion order (Turkish buckets run first so they
// survive the final TARGET_TOTAL trim); trSet marks which ids are Turkish
// for the end-of-run report.
const idOrder = [];
const seen = new Set();
const trSet = new Set();

async function discoverBucket(label, params, maxPages, isTurkish) {
  let added = 0;
  for (let page = 1; page <= maxPages; page++) {
    if (idOrder.length >= TARGET_TOTAL) break;
    let data;
    try {
      data = await tmdb("/discover/movie", { ...params, page });
    } catch (err) {
      console.error(`  [${label}] page ${page} failed: ${err.message}`);
      break;
    }
    if (!data.results || data.results.length === 0) break;
    for (const m of data.results) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        idOrder.push(m.id);
        if (isTurkish) trSet.add(m.id);
        added++;
      }
    }
    if (page >= (data.total_pages || 1)) break;
  }
  console.log(`[${label}] +${added} new (running total ${idOrder.length})`);
}

async function collectIds() {
  console.log("=== Collecting candidate movie ids ===");

  // --- Turkish coverage first (guaranteed to survive the trim) ---
  await discoverBucket("TR comedy · popularity", { with_original_language: "tr", with_genres: 35, sort_by: "popularity.desc" }, 20, true);
  await discoverBucket("TR comedy · vote_count", { with_original_language: "tr", with_genres: 35, sort_by: "vote_count.desc" }, 10, true);
  await discoverBucket("TR drama · popularity", { with_original_language: "tr", with_genres: 18, sort_by: "popularity.desc" }, 12, true);
  await discoverBucket("TR romance · popularity", { with_original_language: "tr", with_genres: 10749, sort_by: "popularity.desc" }, 8, true);
  await discoverBucket("TR action/thriller · popularity", { with_original_language: "tr", with_genres: "28,53", sort_by: "popularity.desc" }, 8, true);
  await discoverBucket("TR general · popularity", { with_original_language: "tr", sort_by: "popularity.desc" }, 20, true);
  await discoverBucket("TR general · vote_count", { with_original_language: "tr", sort_by: "vote_count.desc" }, 10, true);

  console.log(`--- Turkish bucket done: ${trSet.size} unique TR ids ---`);

  // --- Global coverage (popular, top-rated, then genre-diverse passes) ---
  await discoverBucket("Global · popularity", { sort_by: "popularity.desc" }, 60);
  await discoverBucket("Global · top rated", { sort_by: "vote_average.desc", "vote_count.gte": 500 }, 50);
  await discoverBucket("Global · vote_count", { sort_by: "vote_count.desc" }, 40);

  const diverseGenres = [
    ["Animation", 16],
    ["Family", 10751],
    ["Horror", 27],
    ["Science Fiction", 878],
    ["Documentary", 99],
    ["Fantasy", 14],
    ["Crime", 80],
    ["War", 10752],
    ["Romance", 10749],
    ["Mystery", 9648],
    ["Music", 10402],
    ["Western", 37],
  ];
  for (const [name, id] of diverseGenres) {
    if (idOrder.length >= TARGET_TOTAL) break;
    await discoverBucket(`Global · ${name}`, { with_genres: id, sort_by: "popularity.desc" }, 20);
  }

  // Decade passes surface long-tail catalog titles that pure popularity
  // sorting never reaches (older/classic films with low raw popularity).
  const decades = [
    [1970, 1979],
    [1980, 1989],
    [1990, 1999],
    [2000, 2009],
    [2010, 2015],
    [2016, 2020],
    [2021, 2026],
  ];
  for (const [from, to] of decades) {
    if (idOrder.length >= TARGET_TOTAL) break;
    await discoverBucket(
      `Global · ${from}-${to}`,
      {
        "primary_release_date.gte": `${from}-01-01`,
        "primary_release_date.lte": `${to}-12-31`,
        sort_by: "vote_count.desc",
      },
      15,
    );
  }

  console.log(`=== Collected ${idOrder.length} unique ids (${trSet.size} Turkish) ===`);
}

// Simple concurrency pool.
async function pool(items, limit, worker) {
  let idx = 0;
  let ok = 0;
  let fail = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        await worker(items[i], i);
        ok++;
      } catch (err) {
        fail++;
        console.error(`  detail failed for ${items[i]}: ${err.message}`);
      }
      if ((ok + fail) % 200 === 0) {
        console.log(`  progress: ${ok + fail}/${items.length} (ok ${ok}, fail ${fail})`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, next));
  return { ok, fail };
}

async function fetchAndUpsertAll(ids) {
  console.log(`=== Fetching detail + upserting for ${ids.length} movies ===`);
  const BATCH = 100;
  let buffer = [];

  async function flush() {
    if (buffer.length === 0) return;
    const rows = buffer;
    buffer = [];
    const { error } = await admin.from("movies_cache").upsert(rows);
    if (error) console.error(`  upsert batch failed: ${error.message}`);
  }

  const { ok, fail } = await pool(ids, 16, async (id) => {
    const detail = await tmdb(`/movie/${id}`, { append_to_response: "credits" });
    const director = detail.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;
    const castMembers = (detail.credits?.cast ?? []).slice(0, 10).map((c) => ({
      name: c.name,
      character: c.character,
    }));
    buffer.push({
      tmdb_id: detail.id,
      title: detail.title,
      poster_path: detail.poster_path,
      backdrop_path: detail.backdrop_path,
      release_year: detail.release_date ? Number(detail.release_date.slice(0, 4)) : null,
      runtime: detail.runtime,
      genres: detail.genres ?? [],
      director,
      cast_members: castMembers,
      overview: detail.overview,
      external_rating: detail.vote_average,
      popularity: detail.popularity,
      original_language: detail.original_language ?? null,
      spoken_languages: detail.spoken_languages ?? [],
      cached_at: new Date().toISOString(),
    });
    if (buffer.length >= BATCH) await flush();
  });
  await flush();
  console.log(`=== Done. ok=${ok} fail=${fail} ===`);
}

async function main() {
  const start = Date.now();
  await collectIds();
  const ids = idOrder.slice(0, TARGET_TOTAL);
  const trCountInFinal = ids.filter((id) => trSet.has(id)).length;
  console.log(`Final id list: ${ids.length} (Turkish: ${trCountInFinal})`);
  await fetchAndUpsertAll(ids);

  const { count } = await admin.from("movies_cache").select("*", { count: "exact", head: true });
  const { count: trCount } = await admin
    .from("movies_cache")
    .select("*", { count: "exact", head: true })
    .eq("original_language", "tr");
  console.log(`movies_cache total rows: ${count}, Turkish rows: ${trCount}`);
  console.log(`Finished in ${((Date.now() - start) / 1000).toFixed(0)}s`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
