-- =============================================================================
-- Migration: 0001_create_mandapams
-- Description: Creates the mandapams table with RLS policies and storage setup.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUM for mandapam status
-- ---------------------------------------------------------------------------
CREATE TYPE mandapam_status AS ENUM ('pending', 'approved', 'rejected');


-- ---------------------------------------------------------------------------
-- 2. mandapams TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mandapams (
  id            UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT                    NOT NULL,
  area          TEXT                    NOT NULL,
  address       TEXT,
  description   TEXT,
  latitude      DOUBLE PRECISION        NOT NULL,
  longitude     DOUBLE PRECISION        NOT NULL,
  image_url     TEXT,

  -- Moderation fields — only writable by admins (enforced via RLS)
  status        mandapam_status         NOT NULL DEFAULT 'pending',
  is_featured   BOOLEAN                 NOT NULL DEFAULT false,
  is_verified   BOOLEAN                 NOT NULL DEFAULT false,

  submitted_by  TEXT,

  created_at    TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. CONSTRAINTS
-- ---------------------------------------------------------------------------

-- Coordinates must be within valid geographic ranges
ALTER TABLE mandapams
  ADD CONSTRAINT mandapams_latitude_range
    CHECK (latitude  BETWEEN -90  AND  90),
  ADD CONSTRAINT mandapams_longitude_range
    CHECK (longitude BETWEEN -180 AND 180);

-- Name and area must not be blank
ALTER TABLE mandapams
  ADD CONSTRAINT mandapams_name_not_blank
    CHECK (length(trim(name)) > 0),
  ADD CONSTRAINT mandapams_area_not_blank
    CHECK (length(trim(area)) > 0);


-- ---------------------------------------------------------------------------
-- 4. INDEXES
-- ---------------------------------------------------------------------------

-- Primary listing queries: approved mandapams by area
CREATE INDEX idx_mandapams_status     ON mandapams (status);
CREATE INDEX idx_mandapams_area       ON mandapams (area);
CREATE INDEX idx_mandapams_featured   ON mandapams (is_featured) WHERE is_featured = true;

-- Geo-proximity queries (bounding-box style)
CREATE INDEX idx_mandapams_lat_lng    ON mandapams (latitude, longitude);

-- Admin queue: newest pending submissions first
CREATE INDEX idx_mandapams_created_at ON mandapams (created_at DESC);


-- ---------------------------------------------------------------------------
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mandapams_updated_at
  BEFORE UPDATE ON mandapams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE mandapams ENABLE ROW LEVEL SECURITY;

-- Public read: only approved mandapams are visible to anonymous users
CREATE POLICY "Public can read approved mandapams"
  ON mandapams
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Public insert: anyone may submit a new mandapam (status defaults to 'pending')
-- The INSERT policy cannot specify which columns are set — that is enforced by
-- the DEFAULT and the absence of an UPDATE policy for status.
CREATE POLICY "Anyone can submit a mandapam"
  ON mandapams
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Prevent submitters from self-approving or setting moderation fields
    status = 'pending'
    AND is_featured = false
    AND is_verified = false
  );

-- No UPDATE or DELETE policies for public roles.
-- Admin operations will use the service-role key (bypasses RLS) or a
-- separate admin role — to be added in a later migration.


-- ---------------------------------------------------------------------------
-- 7. STORAGE BUCKET
-- ---------------------------------------------------------------------------

-- Create the bucket for mandapam images (non-public by default; individual
-- objects within it can be made public via storage policies below).
INSERT INTO storage.buckets (id, name, public)
VALUES ('mandapam-images', 'mandapam-images', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read objects in the mandapam-images bucket.
-- This enables public image URLs for approved mandapams.
CREATE POLICY "Public can view mandapam images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'mandapam-images');

-- Allow anonymous and authenticated users to upload images.
-- Public submissions do not require an account, so anon must be permitted here.
-- Filename validation / quota / MIME-type enforcement is left for a later phase.
-- UPDATE and DELETE remain restricted to authenticated owners (see policies below).
CREATE POLICY "Anyone can upload mandapam images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'mandapam-images');

-- Allow authenticated users to update their own uploads only.
CREATE POLICY "Authenticated users can update own mandapam images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'mandapam-images' AND auth.uid()::text = owner_id::text);

-- Allow authenticated users to delete their own uploads only.
CREATE POLICY "Authenticated users can delete own mandapam images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'mandapam-images' AND auth.uid()::text = owner_id::text);
