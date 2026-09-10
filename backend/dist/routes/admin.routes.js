"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const adminAuth_js_1 = require("../middleware/adminAuth.js");
const csrf_js_1 = require("../middleware/csrf.js");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const router = (0, express_1.Router)();
// Rate limiter for admin login: 5 failed attempts per 15 min per IP
const adminLoginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many failed login attempts. Please try again in 15 minutes.',
    },
});
// Public authentication endpoint with brute-force protection
router.post('/login', adminLoginLimiter, admin_controller_js_1.adminLogin);
// Protected admin endpoints (require valid admin session)
router.use(adminAuth_js_1.requireAdminAuth);
// Enforce CSRF protection header on all state-changing admin operations (POST, PATCH, DELETE)
router.use(csrf_js_1.requireAdminCsrfHeader);
router.post('/logout', admin_controller_js_1.adminLogout);
router.get('/me', admin_controller_js_1.getAdminProfile);
router.get('/mandapams', admin_controller_js_1.getAdminMandapams);
router.get('/mandapams/:id', admin_controller_js_1.getAdminMandapamById);
router.patch('/mandapams/:id', admin_controller_js_1.updateMandapam);
router.post('/mandapams/:id/approve', admin_controller_js_1.approveMandapam);
router.post('/mandapams/:id/reject', admin_controller_js_1.rejectMandapam);
router.post('/mandapams/:id/verify', admin_controller_js_1.setVerifiedStatus);
router.post('/mandapams/:id/feature', admin_controller_js_1.setFeaturedStatus);
router.delete('/mandapams/:id', admin_controller_js_1.deleteMandapam);
exports.default = router;
