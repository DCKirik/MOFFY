-- Dedicated columns instead of picking a dub out of trailer_videos on
-- every request: easier to spot-check or hand-correct a specific movie's
-- Turkish/French trailer link if TMDB's own iso_639_1 tagging on a video
-- ever turns out wrong (reported concern: a language-tagged trailer can
-- sometimes not actually be the right one).
alter table movies_cache add column if not exists trailer_key_tr text;
alter table movies_cache add column if not exists trailer_key_fr text;
