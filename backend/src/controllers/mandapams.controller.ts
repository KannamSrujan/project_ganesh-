import { Request, Response } from 'express';
import crypto from 'crypto';
import { getSupabaseClient } from '../config/supabase.js';
import type { Mandapam } from '../types/mandapam.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/mandapams
 * Returns all approved mandapams with optional search & area filtering.
 */
export async function getApprovedMandapams(req: Request, res: Response): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    res.json({ success: true, data: [] });
    return;
  }

  try {
    let query = supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const { area, search } = req.query;

    if (area && typeof area === 'string' && area !== 'all') {
      query = query.eq('area', area);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},area.ilike.${term},address.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[mandapams.controller] getApprovedMandapams error:', error.message);
      res.json({ success: true, data: [] });
      return;
    }

    res.json({ success: true, data: (data as Mandapam[]) ?? [] });
  } catch (err) {
    console.error('[mandapams.controller] getApprovedMandapams unexpected error:', err);
    res.json({ success: true, data: [] });
  }
}

/**
 * GET /api/mandapams/featured
 * Returns featured mandapams, falling back to recent approved if none featured.
 */
export async function getFeaturedMandapams(req: Request, res: Response): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    res.json({ success: true, data: [] });
    return;
  }

  try {
    const { data: featured, error: featuredError } = await supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (featuredError) {
      console.error('[mandapams.controller] getFeaturedMandapams error:', featuredError.message);
      res.json({ success: true, data: [] });
      return;
    }

    if (featured && featured.length > 0) {
      res.json({ success: true, data: featured as Mandapam[] });
      return;
    }

    // Fallback to first 3 approved
    const { data: fallback, error: fallbackError } = await supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3);

    if (fallbackError) {
      console.error('[mandapams.controller] getFeatured fallback error:', fallbackError.message);
      res.json({ success: true, data: [] });
      return;
    }

    res.json({ success: true, data: (fallback as Mandapam[]) ?? [] });
  } catch (err) {
    console.error('[mandapams.controller] getFeaturedMandapams unexpected error:', err);
    res.json({ success: true, data: [] });
  }
}

/**
 * GET /api/mandapams/:id
 * Fetches a single approved mandapam by UUID.
 */
export async function getMandapamById(req: Request, res: Response): Promise<void> {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    res.status(400).json({ success: false, error: 'Invalid mandapam ID format' });
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    res.status(404).json({ success: false, error: 'Mandapam not found' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('mandapams')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (error) {
      console.error('[mandapams.controller] getMandapamById error:', error.message);
      res.status(500).json({ success: false, error: 'Failed to fetch mandapam details' });
      return;
    }

    if (!data) {
      res.status(404).json({ success: false, error: 'Mandapam not found' });
      return;
    }

    res.json({ success: true, data: data as Mandapam });
  } catch (err) {
    console.error('[mandapams.controller] getMandapamById unexpected error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * POST /api/mandapams
 * Submits a new mandapam listing (multipart form data with optional image).
 */
export async function createMandapamSubmission(req: Request, res: Response): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    res.status(503).json({
      success: false,
      error: 'Mandapam submissions are temporarily unavailable. Database not configured.',
    });
    return;
  }

  try {
    const { name, area, address, description, latitude, longitude, submitted_by } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'Mandapam name is required' });
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 150) {
      res.status(400).json({ success: false, error: 'Mandapam name must not exceed 150 characters.' });
      return;
    }

    if (!area || !area.trim()) {
      res.status(400).json({ success: false, error: 'Area/Neighborhood is required' });
      return;
    }
    const trimmedArea = area.trim();
    if (trimmedArea.length > 100) {
      res.status(400).json({ success: false, error: 'Area must not exceed 100 characters.' });
      return;
    }

    const trimmedAddress = address ? String(address).trim() : null;
    if (trimmedAddress && trimmedAddress.length > 300) {
      res.status(400).json({ success: false, error: 'Address must not exceed 300 characters.' });
      return;
    }

    const trimmedDescription = description ? String(description).trim() : null;
    if (trimmedDescription && trimmedDescription.length > 2000) {
      res.status(400).json({ success: false, error: 'Description must not exceed 2000 characters.' });
      return;
    }

    const trimmedSubmittedBy = submitted_by ? String(submitted_by).trim() : null;
    if (trimmedSubmittedBy && trimmedSubmittedBy.length > 150) {
      res.status(400).json({ success: false, error: 'Submitted by must not exceed 150 characters.' });
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: 'Valid latitude and longitude are required' });
      return;
    }

    let storagePath: string | null = null;

    // Handle uploaded file if present
    if (req.file) {
      try {
        const rawExt = req.file.originalname.split('.').pop()?.toLowerCase() || '';
        const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

        if (!ALLOWED_EXTENSIONS.has(rawExt)) {
          res.status(400).json({
            success: false,
            error: 'Only image files with extensions .jpg, .jpeg, .png, or .webp are allowed.',
          });
          return;
        }

        const uniqueId = crypto.randomUUID();
        storagePath = `submissions/${uniqueId}.${rawExt}`;

        const { error: uploadError } = await supabase.storage
          .from('mandapam-images')
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('[mandapams.controller] Supabase image upload error:', uploadError.message);
          res.status(500).json({
            success: false,
            error: 'Failed to upload photo. Please try again.',
          });
          return;
        }
      } catch (uploadErr) {
        console.error('[mandapams.controller] Image buffer handling error:', uploadErr);
        res.status(500).json({ success: false, error: 'Error processing uploaded photo' });
        return;
      }
    }

    // Insert record with status 'pending'
    const { error: insertError } = await supabase.from('mandapams').insert({
      name: trimmedName,
      area: trimmedArea,
      address: trimmedAddress,
      description: trimmedDescription,
      latitude: lat,
      longitude: lng,
      image_url: storagePath,
      status: 'pending',
      is_featured: false,
      is_verified: false,
      submitted_by: trimmedSubmittedBy,
    });

    if (insertError) {
      console.error('[mandapams.controller] Insert error:', insertError.message);
      res.status(500).json({
        success: false,
        error: 'Unable to submit mandapam. Please verify the information and try again.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Mandapam submitted successfully for review!',
    });
  } catch (err) {
    console.error('[mandapams.controller] createMandapamSubmission error:', err);
    res.status(500).json({ success: false, error: 'Internal server error while saving submission' });
  }
}
