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
const envValidation_js_1 = require("../config/envValidation.js");
const mandapamService_js_1 = require("../services/mandapamService.js");
function getRouteId(req) {
    const rawId = req.params.id;
    return Array.isArray(rawId) ? rawId[0] : rawId ?? '';
}
function handleServiceError(res, error, fallbackMessage = 'Internal server error.') {
    if (error instanceof mandapamService_js_1.MandapamServiceError) {
        res.status(error.status).json({ success: false, error: error.message });
        return;
    }
    console.error('[Admin] Unexpected error:', error);
    res.status(500).json({ success: false, error: fallbackMessage });
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
        res
            .status(400)
            .json({ success: false, error: 'Email and password are required.' });
        return;
    }
    if (!configuredEmail ||
        !configuredPassword ||
        email !== configuredEmail ||
        password !== configuredPassword) {
        res
            .status(401)
            .json({ success: false, error: 'Invalid admin credentials.' });
        return;
    }
    let jwtSecret;
    try {
        jwtSecret = (0, envValidation_js_1.getAdminJwtSecret)();
    }
    catch {
        res
            .status(500)
            .json({ success: false, error: 'Authentication configuration error.' });
        return;
    }
    const token = jsonwebtoken_1.default.sign({ email, role: 'admin' }, jwtSecret, {
        expiresIn: '8h'
    });
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000
    });
    console.log(`[Admin Auth] Admin user '${email}' logged in successfully.`);
    res.json({
        success: true,
        message: 'Logged in successfully.',
        admin: { email }
    });
}
/**
 * POST /api/admin/logout
 * Clears the admin session cookie.
 */
async function adminLogout(_req, res) {
    res.clearCookie('admin_token', {
        httpOnly: true,
        sameSite: 'lax'
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
    try {
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const data = await (0, mandapamService_js_1.listAdminMandapams)(status);
        res.json({ success: true, data });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to fetch mandapams.');
    }
}
/**
 * GET /api/admin/mandapams/:id
 * Fetches full mandapam detail, generating a short-lived signed image URL
 * if a private storage object is present.
 */
async function getAdminMandapamById(req, res) {
    try {
        const id = getRouteId(req);
        const data = await (0, mandapamService_js_1.getAdminMandapamById)(id);
        res.json({ success: true, data });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to fetch mandapam details.');
    }
}
/**
 * PATCH /api/admin/mandapams/:id
 * Allows admin to edit listing metadata. Blocks editing id, created_at, or moderation fields.
 */
async function updateMandapam(req, res) {
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
                res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Name must not exceed 150 characters.'
                });
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
                res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Area must not exceed 100 characters.'
                });
                return;
            }
            updates.area = trimmedArea;
        }
        if (address !== undefined) {
            const trimmedAddress = address ? String(address).trim() : '';
            if (trimmedAddress.length > 300) {
                res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Address must not exceed 300 characters.'
                });
                return;
            }
            updates.address = trimmedAddress || null;
        }
        if (description !== undefined) {
            const trimmedDesc = description ? String(description).trim() : '';
            if (trimmedDesc.length > 2000) {
                res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Description must not exceed 2000 characters.'
                });
                return;
            }
            updates.description = trimmedDesc || null;
        }
        if (latitude !== undefined) {
            const lat = Number(latitude);
            if (Number.isNaN(lat) || lat < -90 || lat > 90) {
                res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Valid latitude between -90 and 90 is required.'
                });
                return;
            }
            updates.latitude = lat;
        }
        if (longitude !== undefined) {
            const lng = Number(longitude);
            if (Number.isNaN(lng) || lng < -180 || lng > 180) {
                res
                    .status(400)
                    .json({
                    success: false,
                    error: 'Valid longitude between -180 and 180 is required.'
                });
                return;
            }
            updates.longitude = lng;
        }
        if (Object.keys(updates).length === 0) {
            res
                .status(400)
                .json({ success: false, error: 'No valid fields provided for update.' });
            return;
        }
        updates.updated_at = new Date().toISOString();
        const id = getRouteId(req);
        const data = await (0, mandapamService_js_1.updateMandapam)(id, updates);
        console.log(`[Admin Action] Admin updated mandapam details for ID: ${id}`);
        res.json({ success: true, message: 'Mandapam updated successfully.', data });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to update mandapam.');
    }
}
/**
 * POST /api/admin/mandapams/:id/approve
 * Approves a mandapam submission so it becomes publicly visible.
 */
async function approveMandapam(req, res) {
    try {
        const id = getRouteId(req);
        await (0, mandapamService_js_1.approveMandapam)(id);
        console.log(`[Admin Action] Admin approved mandapam ID: ${id}`);
        res.json({ success: true, message: 'Mandapam approved successfully.' });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to approve mandapam.');
    }
}
/**
 * POST /api/admin/mandapams/:id/reject
 * Rejects a mandapam submission, hiding it from public visibility.
 */
async function rejectMandapam(req, res) {
    try {
        const id = getRouteId(req);
        await (0, mandapamService_js_1.rejectMandapam)(id);
        console.log(`[Admin Action] Admin rejected mandapam ID: ${id}`);
        res.json({ success: true, message: 'Mandapam rejected.' });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to reject mandapam.');
    }
}
/**
 * POST /api/admin/mandapams/:id/verify
 * Sets is_verified flag.
 */
async function setVerifiedStatus(req, res) {
    try {
        if (typeof req.body.is_verified !== 'boolean') {
            res
                .status(400)
                .json({
                success: false,
                error: 'is_verified must be a boolean (true or false).'
            });
            return;
        }
        const id = getRouteId(req);
        await (0, mandapamService_js_1.setMandapamBooleanFlag)(id, 'is_verified', req.body.is_verified);
        console.log(`[Admin Action] Admin set is_verified=${req.body.is_verified} for mandapam ID: ${id}`);
        res.json({
            success: true,
            message: `Mandapam verification set to ${req.body.is_verified}.`
        });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to update verification status.');
    }
}
/**
 * POST /api/admin/mandapams/:id/feature
 * Sets is_featured flag.
 */
async function setFeaturedStatus(req, res) {
    try {
        if (typeof req.body.is_featured !== 'boolean') {
            res
                .status(400)
                .json({
                success: false,
                error: 'is_featured must be a boolean (true or false).'
            });
            return;
        }
        const id = getRouteId(req);
        await (0, mandapamService_js_1.setMandapamBooleanFlag)(id, 'is_featured', req.body.is_featured);
        console.log(`[Admin Action] Admin set is_featured=${req.body.is_featured} for mandapam ID: ${id}`);
        res.json({
            success: true,
            message: `Mandapam featured set to ${req.body.is_featured}.`
        });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to update featured status.');
    }
}
/**
 * DELETE /api/admin/mandapams/:id
 * Permanently deletes a mandapam record and cleans up any uploaded storage photo.
 */
async function deleteMandapam(req, res) {
    try {
        const id = getRouteId(req);
        await (0, mandapamService_js_1.deleteMandapam)(id);
        console.log(`[Admin Action] Admin deleted mandapam ID: ${id}`);
        res.json({ success: true, message: 'Mandapam deleted successfully.' });
    }
    catch (error) {
        handleServiceError(res, error, 'Failed to delete mandapam record.');
    }
}
