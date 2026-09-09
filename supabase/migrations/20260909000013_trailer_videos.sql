-- Reels needs to pick a trailer by the viewer's language preference, not
-- just whichever one trailer_key happened to land on — store the full
-- YouTube trailer/teaser list (each tagged with its own iso_639_1) so that
-- choice can be made at request time instead of being baked in at cache
-- time. Existing rows populate this the same way trailer_key itself was
-- backfilled: organically, as each movie's detail page gets viewed again.
alter table movies_cache add column if not exists trailer_videos jsonb not null default '[]'::jsonb;
