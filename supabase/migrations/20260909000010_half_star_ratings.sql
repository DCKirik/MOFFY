-- Ratings were locked to whole stars (smallint, check between 1 and 5) —
-- widen to allow half-star steps (1, 1.5, 2, ..., 5) without opening the
-- door to arbitrary decimals.
alter table ratings drop constraint ratings_rating_check;
alter table ratings alter column rating type numeric(2,1);
alter table ratings add constraint ratings_rating_check
  check (rating between 1 and 5 and rating * 2 = round(rating * 2));

alter table pathway_progress drop constraint pathway_progress_rating_check;
alter table pathway_progress alter column rating type numeric(2,1);
alter table pathway_progress add constraint pathway_progress_rating_check
  check (rating is null or (rating between 1 and 5 and rating * 2 = round(rating * 2)));
