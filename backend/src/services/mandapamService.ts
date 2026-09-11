import crypto from 'crypto'
import { getSupabaseClient } from '../config/supabase.js'
import { getSupabaseAdminClient } from '../config/supabaseAdmin.js'
import type { Mandapam } from '../types/mandapam.js'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class MandapamServiceError extends Error {
  status: number

  constructor (status: number, message: string) {
    super(message)
    this.name = 'MandapamServiceError'
    this.status = status
  }
}

type MandapamSubmissionInput = {
  name: string
  area: string
  address?: string | null
  description?: string | null
  latitude: number
  longitude: number
  submitted_by?: string | null
}

type UploadedFile = {
  originalname: string
  mimetype: string
  buffer: Buffer
}

function getDbClient () {
  return getSupabaseAdminClient() ?? getSupabaseClient()
}

function getPublicDbClient () {
  return getSupabaseClient()
}

function getValidStatus (status?: string): string | undefined {
  if (!status || status === 'all') {
    return undefined
  }

  return status
}

export async function listApprovedMandapams (
  area?: string,
  search?: string
): Promise<Mandapam[]> {
  const supabase = getPublicDbClient()
  if (!supabase) {
    return []
  }

  try {
    let query = supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (area && area !== 'all') {
      query = query.eq('area', area)
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(
        `name.ilike.${term},area.ilike.${term},address.ilike.${term}`
      )
    }

    const { data, error } = await query

    if (error) {
      throw new MandapamServiceError(500, 'Failed to fetch mandapams.')
    }

    return (data as Mandapam[]) ?? []
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Failed to fetch mandapams.')
  }
}

export async function listFeaturedMandapams (): Promise<Mandapam[]> {
  const supabase = getPublicDbClient()
  if (!supabase) {
    return []
  }

  try {
    const { data: featured, error: featuredError } = await supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })

    if (featuredError) {
      throw new MandapamServiceError(500, 'Failed to fetch featured mandapams.')
    }

    if (featured && featured.length > 0) {
      return featured as Mandapam[]
    }

    const { data: fallback, error: fallbackError } = await supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(3)

    if (fallbackError) {
      throw new MandapamServiceError(
        500,
        'Failed to fetch fallback featured mandapams.'
      )
    }

    return (fallback as Mandapam[]) ?? []
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Failed to fetch featured mandapams.')
  }
}

export async function getMandapamById (id: string): Promise<Mandapam> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format')
  }

  const supabase = getPublicDbClient()
  if (!supabase) {
    throw new MandapamServiceError(404, 'Mandapam not found')
  }

  try {
    const { data, error } = await supabase
      .from('mandapams')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle()

    if (error) {
      throw new MandapamServiceError(500, 'Failed to fetch mandapam details')
    }

    if (!data) {
      throw new MandapamServiceError(404, 'Mandapam not found')
    }

    return data as Mandapam
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error')
  }
}

export async function createMandapamSubmission (
  payload: MandapamSubmissionInput,
  file?: UploadedFile
): Promise<void> {
  const supabase = getPublicDbClient()
  if (!supabase) {
    throw new MandapamServiceError(
      503,
      'Mandapam submissions are temporarily unavailable. Database not configured.'
    )
  }

  try {
    let storagePath: string | null = null

    if (file) {
      const rawExt = file.originalname.split('.').pop()?.toLowerCase() || ''
      const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp'])

      if (!ALLOWED_EXTENSIONS.has(rawExt)) {
        throw new MandapamServiceError(
          400,
          'Only image files with extensions .jpg, .jpeg, .png, or .webp are allowed.'
        )
      }

      const uniqueId = crypto.randomUUID()
      storagePath = `submissions/${uniqueId}.${rawExt}`

      const { error: uploadError } = await supabase.storage
        .from('mandapam-images')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new MandapamServiceError(
          500,
          'Failed to upload photo. Please try again.'
        )
      }
    }

    const { error: insertError } = await supabase.from('mandapams').insert({
      name: payload.name.trim(),
      area: payload.area.trim(),
      address: payload.address?.trim() || null,
      description: payload.description?.trim() || null,
      latitude: payload.latitude,
      longitude: payload.longitude,
      image_url: storagePath,
      status: 'pending',
      is_featured: false,
      is_verified: false,
      submitted_by: payload.submitted_by?.trim() || null
    })

    if (insertError) {
      throw new MandapamServiceError(
        500,
        'Unable to submit mandapam. Please verify the information and try again.'
      )
    }
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(
      500,
      'Internal server error while saving submission'
    )
  }
}

export async function listAdminMandapams (status?: string): Promise<Mandapam[]> {
  const supabase = getDbClient()
  if (!supabase) {
    return []
  }

  try {
    const validStatus = getValidStatus(status)
    let query = supabase
      .from('mandapams')
      .select('*')
      .order('created_at', { ascending: false })

    if (validStatus) {
      query = query.eq('status', validStatus)
    }

    const { data, error } = await query

    if (error) {
      throw new MandapamServiceError(500, 'Failed to fetch mandapams.')
    }

    return (data as Mandapam[]) ?? []
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}

export async function getAdminMandapamById (
  id: string
): Promise<Mandapam & { signed_image_url?: string | null }> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.')
  }

  const supabase = getDbClient()
  if (!supabase) {
    throw new MandapamServiceError(404, 'Mandapam not found.')
  }

  try {
    const { data, error } = await supabase
      .from('mandapams')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      throw new MandapamServiceError(404, 'Mandapam not found.')
    }

    const mandapam = data as Mandapam
    let signedImageUrl: string | null = null

    if (mandapam.image_url && mandapam.image_url.startsWith('submissions/')) {
      try {
        const { data: signedData, error: signError } = await supabase.storage
          .from('mandapam-images')
          .createSignedUrl(mandapam.image_url, 300)

        if (!signError && signedData?.signedUrl) {
          signedImageUrl = signedData.signedUrl
        }
      } catch {
        signedImageUrl = null
      }
    }

    return {
      ...mandapam,
      signed_image_url: signedImageUrl
    }
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}

export async function updateMandapam (
  id: string,
  updates: Record<string, unknown>
): Promise<Mandapam> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.')
  }

  const supabase = getDbClient()
  if (!supabase) {
    throw new MandapamServiceError(503, 'Database service unavailable.')
  }

  try {
    const { data, error } = await supabase
      .from('mandapams')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new MandapamServiceError(500, 'Failed to update mandapam.')
    }

    return data as Mandapam
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}

export async function approveMandapam (id: string): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.')
  }

  const supabase = getDbClient()
  if (!supabase) {
    throw new MandapamServiceError(503, 'Database service unavailable.')
  }

  try {
    const { error } = await supabase
      .from('mandapams')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new MandapamServiceError(500, 'Failed to approve mandapam.')
    }
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}

export async function rejectMandapam (id: string): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.')
  }

  const supabase = getDbClient()
  if (!supabase) {
    throw new MandapamServiceError(503, 'Database service unavailable.')
  }

  try {
    const { error } = await supabase
      .from('mandapams')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new MandapamServiceError(500, 'Failed to reject mandapam.')
    }
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}

export async function setMandapamBooleanFlag (
  id: string,
  field: 'is_verified' | 'is_featured',
  value: boolean
): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.')
  }

  const supabase = getDbClient()
  if (!supabase) {
    throw new MandapamServiceError(503, 'Database service unavailable.')
  }

  try {
    const { error } = await supabase
      .from('mandapams')
      .update({
        [field]: value,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new MandapamServiceError(500, `Failed to update ${field} status.`)
    }
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}

export async function deleteMandapam (id: string): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.')
  }

  const supabase = getDbClient()
  if (!supabase) {
    throw new MandapamServiceError(503, 'Database service unavailable.')
  }

  try {
    const { data: record } = await supabase
      .from('mandapams')
      .select('image_url')
      .eq('id', id)
      .maybeSingle()

    const { error: deleteError } = await supabase
      .from('mandapams')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new MandapamServiceError(500, 'Failed to delete mandapam record.')
    }

    if (record?.image_url && record.image_url.startsWith('submissions/')) {
      try {
        await supabase.storage
          .from('mandapam-images')
          .remove([record.image_url])
      } catch {
        // Ignore storage cleanup failures so the database deletion still succeeds.
      }
    }
  } catch (error) {
    if (error instanceof MandapamServiceError) {
      throw error
    }

    throw new MandapamServiceError(500, 'Internal server error.')
  }
}
