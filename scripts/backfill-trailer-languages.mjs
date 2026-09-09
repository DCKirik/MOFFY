// Companion to seed-movies.mjs, mirroring backfill-trailers.mjs's pattern:
// trailer_key_tr/trailer_key_fr are brand-new columns (added after every
// existing row was cached), so the whole catalog starts out with both
// null — not because no dub exists, but because nothing has checked yet.
// One lightweight /movie/{id}/videos call per row (not the full detail
// payload) fills them in without re-fetching everything else.
//
// Targets rows where BOTH are still null, so a later re-run only touches
// rows this pass hasn't reached yet (or that legitimately have no dub in
// either language — which is indistinguishable from "not checked" here,
// but that just means a rare false rescan, not a correctness problem).
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

async function tmdb(path, params = {}) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
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

// Requires official:true — see lib/tmdb/client.ts's pickOfficialTrailerForLanguage
// for why this is stricter than the general trailer_key fallback.
function officialDubKey(videos, lang) {
  const yt = videos.filter((v) => v.site === "YouTube" && v.iso_639_1 === lang && v.official);
  yt.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  const pick = yt.find((v) => v.type === "Trailer") ?? yt.find((v) => v.type === "Teaser");
  return pick?.key ?? null;
}

async function loadTargetIds() {
  const ids = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("movies_cache")
      .select("tmdb_id")
      .is("trailer_key_tr", null)
      .is("trailer_key_fr", null)
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
  let withTr = 0;
  let withFr = 0;
  async function next() {
    while (idx < items.length) {
      const i = idx++;
      try {
        const { tr, fr } = await worker(items[i]);
        ok++;
        if (tr) withTr++;
        if (fr) withFr++;
      } catch (err) {
        fail++;
        console.error(`  failed for ${items[i]}: ${err.message}`);
      }
      if ((ok + fail) % 1000 === 0) {
        console.log(`  progress: ${ok + fail}/${items.length} (ok ${ok}, fail ${fail}, tr ${withTr}, fr ${withFr})`);
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, next));
  return { ok, fail, withTr, withFr };
}

async function main() {
  const start = Date.now();
  const ids = await loadTargetIds();
  console.log(`=== Backfilling trailer_key_tr/trailer_key_fr for ${ids.length} movies ===`);

  const { ok, fail, withTr, withFr } = await pool(ids, 16, async (id) => {
    const data = await tmdb(`/movie/${id}/videos`, { include_video_language: "en,tr,fr,null" });
    const videos = data.results ?? [];
    const tr = officialDubKey(videos, "tr");
    const fr = officialDubKey(videos, "fr");
    if (tr || fr) {
      const { error } = await admin
        .from("movies_cache")
        .update({ trailer_key_tr: tr, trailer_key_fr: fr })
        .eq("tmdb_id", id);
      if (error) throw new Error(error.message);
    }
    return { tr: Boolean(tr), fr: Boolean(fr) };
  });

  console.log(`=== Done. ok=${ok} fail=${fail} with_tr=${withTr} with_fr=${withFr} ===`);
  console.log(`Finished in ${((Date.now() - start) / 1000).toFixed(0)}s`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
