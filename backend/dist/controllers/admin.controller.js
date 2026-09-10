"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.adminLogout = adminLogout;
exports.getAdminProfile = getAdminProfile;
exports.getAdminMandapams = getAdminMandapams;
exports.getAdminMandapamById = getAdminMandapamById;
exports.updateMandapam = updateMandapam;
exports.approveMandapam = approveMandapam;
exports.rejectMandapam = rejectMandapam;
exports.setVerifiedStatus = setVerifiedStatus;
exports.setFeaturedStatus = setFeaturedStatus;
exports.deleteMandapam = deleteMandapam;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabaseAdmin_js_1 = require("../config/supabaseAdmin.js");
const supabase_js_1 = require("../config/supabase.js");
const envValidation_js_1 = require("../config/envValidation.js");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function getDbClient() {
    return (0, supabaseAdmin_js_1.getSupabaseAdminClient)() || (0, supabase_js_1.getSupabaseClient)();
}
/**
 * POST /api/admin/login
 * Validates admin credentials and issues a secure HTTP-only session cookie.
 */
async function adminLogin(req, res) {
    const { email, password } = req.body;
    const configuredEmail = process.env.ADMIN_EMAIL;
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
    }
    // Strictly verify credentials against server environment configuration
    if (!configuredEmail || !configuredPassword || email !== configuredEmail || password !== configuredPassword) {
        res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
        return;
    }
    let jwtSecret;
    try {
        jwtSecret = (0, envValidation_js_1.getAdminJwtSecret)();
    }
    catch {
        res.status(500).json({ success: false, error: 'Authentication configuration error.' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '8h' });
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });
    console.log(`[Admin Auth] Admin user '${email}' logged in successfully.`);
    res.json({
        success: true,
        message: 'Logged in successfully.',
        admin: { email },
    });
}
/**
 * POST /api/admin/logout
 * Clears the admin session cookie.
 */
async function adminLogout(_req, res) {
    res.clearCookie('admin_token', {
        httpOnly: true,
        sameSite: 'lax',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
}
/**
 * GET /api/admin/me
 * Returns current authenticated admin profile.
 */
async function getAdminProfile(req, res) {
    if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized.' });
        return;
    }
    res.json({ success: true, admin: req.admin });
}
/**
 * GET /api/admin/mandapams
 * Lists mandapams filtered by status (pending, approved, rejected, all).
 */
async function getAdminMandapams(req, res) {
    const supabase = getDbClient();
    if (!supabase) {
        res.json({ success: true, data: [] });
        return;
    }
    try {
        const { status } = req.query;
        let query = supabase.from('mandapams').select('*').order('created_at', { ascending: false });
        if (status && typeof status === 'string' && status !== 'all') {
            query = query.eq('status', status);
        }
        const { data, error } = await query;
        if (error) {
            console.error('[Admin] getAdminMandapams error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to fetch mandapams.' });
            return;
        }
        res.json({ success: true, data: data ?? [] });
    }
    catch (err) {
        console.error('[Admin] getAdminMandapams unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * GET /api/admin/mandapams/:id
 * Fetches full mandapam detail, generating a short-lived signed image URL
 * if a private storage object is present.
 */
async function getAdminMandapamById(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(404).json({ success: false, error: 'Mandapam not found.' });
        return;
    }
    try {
        const { data, error } = await supabase.from('mandapams').select('*').eq('id', id).maybeSingle();
        if (error || !data) {
            res.status(404).json({ success: false, error: 'Mandapam not found.' });
            return;
        }
        const mandapam = data;
        let signedImageUrl = null;
        // Generate short-lived signed URL for private storage object (valid for 5 minutes)
        if (mandapam.image_url && mandapam.image_url.startsWith('submissions/')) {
            try {
                const { data: signedData, error: signError } = await supabase.storage
                    .from('mandapam-images')
                    .createSignedUrl(mandapam.image_url, 300);
                if (!signError && signedData?.signedUrl) {
                    signedImageUrl = signedData.signedUrl;
                }
            }
            catch (signErr) {
                console.warn('[Admin] Failed to generate signed URL for image:', signErr);
            }
        }
        res.json({
            success: true,
            data: {
                ...mandapam,
                signed_image_url: signedImageUrl,
            },
        });
    }
    catch (err) {
        console.error('[Admin] getAdminMandapamById unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * PATCH /api/admin/mandapams/:id
 * Allows admin to edit listing metadata. Blocks editing id, created_at, or moderation fields.
 */
async function updateMandapam(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(503).json({ success: false, error: 'Database service unavailable.' });
        return;
    }
    try {
        const { name, area, address, description, latitude, longitude } = req.body;
        const updates = {};
        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                res.status(400).json({ success: false, error: 'Name cannot be empty.' });
                return;
            }
            const trimmedName = name.trim();
            if (trimmedName.length > 150) {
                res.status(400).json({ success: false, error: 'Name must not exceed 150 characters.' });
                return;
            }
            updates.name = trimmedName;
        }
        if (area !== undefined) {
            if (typeof area !== 'string' || !area.trim()) {
                res.status(400).json({ success: false, error: 'Area cannot be empty.' });
                return;
            }
            const trimmedArea = area.trim();
            if (trimmedArea.length > 100) {
                res.status(400).json({ success: false, error: 'Area must not exceed 100 characters.' });
                return;
            }
            updates.area = trimmedArea;
        }
        if (address !== undefined) {
            const trimmedAddress = address ? String(address).trim() : '';
            if (trimmedAddress.length > 300) {
                res.status(400).json({ success: false, error: 'Address must not exceed 300 characters.' });
                return;
            }
            updates.address = trimmedAddress || null;
        }
        if (description !== undefined) {
            const trimmedDesc = description ? String(description).trim() : '';
            if (trimmedDesc.length > 2000) {
                res.status(400).json({ success: false, error: 'Description must not exceed 2000 characters.' });
                return;
            }
            updates.description = trimmedDesc || null;
        }
        if (latitude !== undefined) {
            const lat = parseFloat(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                res.status(400).json({ success: false, error: 'Valid latitude between -90 and 90 is required.' });
                return;
            }
            updates.latitude = lat;
        }
        if (longitude !== undefined) {
            const lng = parseFloat(longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                res.status(400).json({ success: false, error: 'Valid longitude between -180 and 180 is required.' });
                return;
            }
            updates.longitude = lng;
        }
        if (Object.keys(updates).length === 0) {
            res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
            return;
        }
        updates.updated_at = new Date().toISOString();
        const { data, error } = await supabase
            .from('mandapams')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();
        if (error) {
            console.error('[Admin] updateMandapam error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to update mandapam.' });
            return;
        }
        console.log(`[Admin Action] Admin updated mandapam details for ID: ${id}`);
        res.json({ success: true, message: 'Mandapam updated successfully.', data });
    }
    catch (err) {
        console.error('[Admin] updateMandapam unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * POST /api/admin/mandapams/:id/approve
 * Approves a mandapam submission so it becomes publicly visible.
 */
async function approveMandapam(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(503).json({ success: false, error: 'Database service unavailable.' });
        return;
    }
    try {
        const { error } = await supabase
            .from('mandapams')
            .update({
            status: 'approved',
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (error) {
            console.error('[Admin] approveMandapam error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to approve mandapam.' });
            return;
        }
        console.log(`[Admin Action] Admin approved mandapam ID: ${id}`);
        res.json({ success: true, message: 'Mandapam approved successfully.' });
    }
    catch (err) {
        console.error('[Admin] approveMandapam unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * POST /api/admin/mandapams/:id/reject
 * Rejects a mandapam submission, hiding it from public visibility.
 */
async function rejectMandapam(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(503).json({ success: false, error: 'Database service unavailable.' });
        return;
    }
    try {
        const { error } = await supabase
            .from('mandapams')
            .update({
            status: 'rejected',
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (error) {
            console.error('[Admin] rejectMandapam error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to reject mandapam.' });
            return;
        }
        console.log(`[Admin Action] Admin rejected mandapam ID: ${id}`);
        res.json({ success: true, message: 'Mandapam rejected.' });
    }
    catch (err) {
        console.error('[Admin] rejectMandapam unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * POST /api/admin/mandapams/:id/verify
 * Sets is_verified flag.
 */
async function setVerifiedStatus(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(503).json({ success: false, error: 'Database service unavailable.' });
        return;
    }
    try {
        if (typeof req.body.is_verified !== 'boolean') {
            res.status(400).json({ success: false, error: 'is_verified must be a boolean (true or false).' });
            return;
        }
        const isVerified = req.body.is_verified;
        const { error } = await supabase
            .from('mandapams')
            .update({
            is_verified: isVerified,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (error) {
            console.error('[Admin] setVerifiedStatus error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to update verification status.' });
            return;
        }
        console.log(`[Admin Action] Admin set is_verified=${isVerified} for mandapam ID: ${id}`);
        res.json({ success: true, message: `Mandapam verification set to ${isVerified}.` });
    }
    catch (err) {
        console.error('[Admin] setVerifiedStatus unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * POST /api/admin/mandapams/:id/feature
 * Sets is_featured flag.
 */
async function setFeaturedStatus(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(503).json({ success: false, error: 'Database service unavailable.' });
        return;
    }
    try {
        if (typeof req.body.is_featured !== 'boolean') {
            res.status(400).json({ success: false, error: 'is_featured must be a boolean (true or false).' });
            return;
        }
        const isFeatured = req.body.is_featured;
        const { error } = await supabase
            .from('mandapams')
            .update({
            is_featured: isFeatured,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (error) {
            console.error('[Admin] setFeaturedStatus error:', error.message);
            res.status(500).json({ success: false, error: 'Failed to update featured status.' });
            return;
        }
        console.log(`[Admin Action] Admin set is_featured=${isFeatured} for mandapam ID: ${id}`);
        res.json({ success: true, message: `Mandapam featured set to ${isFeatured}.` });
    }
    catch (err) {
        console.error('[Admin] setFeaturedStatus unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
/**
 * DELETE /api/admin/mandapams/:id
 * Permanently deletes a mandapam record and cleans up any uploaded storage photo.
 */
async function deleteMandapam(req, res) {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
        res.status(400).json({ success: false, error: 'Invalid mandapam ID format.' });
        return;
    }
    const supabase = getDbClient();
    if (!supabase) {
        res.status(503).json({ success: false, error: 'Database service unavailable.' });
        return;
    }
    try {
        // 1. Fetch mandapam to obtain image path if any
        const { data: record } = await supabase
            .from('mandapams')
            .select('image_url')
            .eq('id', id)
            .maybeSingle();
        // 2. Delete database record
        const { error: deleteError } = await supabase
            .from('mandapams')
            .delete()
            .eq('id', id);
        if (deleteError) {
            console.error('[Admin] deleteMandapam error:', deleteError.message);
            res.status(500).json({ success: false, error: 'Failed to delete mandapam record.' });
            return;
        }
        // 3. Clean up storage object if present
        if (record?.image_url && record.image_url.startsWith('submissions/')) {
            try {
                await supabase.storage.from('mandapam-images').remove([record.image_url]);
            }
            catch (storageErr) {
                console.warn('[Admin] Failed to remove storage image for deleted record:', storageErr);
            }
        }
        console.log(`[Admin Action] Admin deleted mandapam ID: ${id}`);
        res.json({ success: true, message: 'Mandapam deleted successfully.' });
    }
    catch (err) {
        console.error('[Admin] deleteMandapam unexpected error:', err);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
}
