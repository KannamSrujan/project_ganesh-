"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const envValidation_js_1 = require("../config/envValidation.js");
function requireAdminAuth(req, res, next) {
    // 1. Extract token from HTTP-only cookie or Authorization header fallback
    const token = req.cookies?.admin_token ||
        (req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);
    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Authentication required. Please log in to access admin resources.',
        });
        return;
    }
    let jwtSecret;
    try {
        jwtSecret = (0, envValidation_js_1.getAdminJwtSecret)();
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Authentication configuration error.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!decoded || decoded.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Forbidden. Admin privileges required.',
            });
            return;
        }
        req.admin = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired session. Please log in again.',
        });
    }
}
