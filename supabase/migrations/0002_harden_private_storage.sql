-- =============================================================================
-- Migration: 0002_harden_private_storage.sql
-- Description: Hardens private storage security by removing public SELECT
-- policy from the 'mandapam-images' storage bucket.
-- =============================================================================

-- 1. Drop public SELECT policy from storage.objects if it exists
DROP POLICY IF EXISTS "Public can view mandapam images" ON storage.objects;

-- 2. Confirm bucket remains strictly private
UPDATE storage.buckets
SET public = false
WHERE id = 'mandapam-images';

-- Note:
-- Public access to photos in 'mandapam-images' via direct anon SELECT is now prohibited.
-- All admin viewing of private photos must be mediated through backend-generated
-- short-lived signed URLs (using service-role authentication).
