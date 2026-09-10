-- =============================================================================
-- Seed: seed.sql
-- Description: Placeholder seed data for local development.
--
-- DO NOT use invented coordinates or real mandapam data here.
-- Replace EACH entry with accurate, verified information before running.
--
-- To run against a local Supabase instance:
--   supabase db reset   (resets + runs migrations + this seed)
--   or
--   psql $DATABASE_URL -f supabase/seed/seed.sql
--
-- Fields marked [REPLACE] must be filled with real data before committing.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Example mandapam entries — NOT real data.
-- Replace name, area, address, latitude, longitude with verified values.
-- ---------------------------------------------------------------------------

INSERT INTO mandapams (
  name,
  area,
  address,
  description,
  latitude,
  longitude,
  status,
  is_featured,
  is_verified,
  submitted_by
)
VALUES
  (
    '[REPLACE: Mandapam Name]',          -- e.g. 'Sri Laxmi Ganapathi Mandapam'
    '[REPLACE: Area]',                   -- e.g. 'Secunderabad'
    '[REPLACE: Full Address]',           -- e.g. '12-3-456, MG Road, Secunderabad'
    '[REPLACE: Description or NULL]',    -- Short description for the listing
    0.0,                                 -- [REPLACE: real latitude,  e.g. 17.4399]
    0.0,                                 -- [REPLACE: real longitude, e.g. 78.4983]
    'approved',
    false,
    true,
    'seed'
  ),
  (
    '[REPLACE: Mandapam Name]',
    '[REPLACE: Area]',
    '[REPLACE: Full Address]',
    '[REPLACE: Description or NULL]',
    0.0,                                 -- [REPLACE: real latitude]
    0.0,                                 -- [REPLACE: real longitude]
    'approved',
    false,
    true,
    'seed'
  );
