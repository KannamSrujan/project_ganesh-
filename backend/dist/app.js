"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mandapams_routes_js_1 = __importDefault(require("./routes/mandapams.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
function createApp() {
    const app = (0, express_1.default)();
    // Trust first upstream reverse proxy (Render, Railway, Fly.io, Cloudflare)
    // Ensures req.ip correctly identifies client IP for rate limiters without allowing client spoofing
    app.set('trust proxy', 1);
    // Security headers via Helmet (allow cross-origin for local asset images)
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    // HTTP response compression (skip responses < 1KB or already compressed image media)
    app.use((0, compression_1.default)({
        threshold: 1024,
    }));
    // Hardened CORS: allow development origin and any configured in CORS_ORIGIN
    const allowedOrigins = new Set(['http://localhost:5173']);
    if (process.env.CORS_ORIGIN) {
        process.env.CORS_ORIGIN.split(',')
            .map((o) => o.trim())
            .filter(Boolean)
            .forEach((o) => allowedOrigins.add(o));
    }
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. curl, server-to-server, Postman)
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.has(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`CORS error: Origin '${origin}' is not allowed.`));
            }
        },
        credentials: true,
    }));
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json({ limit: '100kb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '100kb' }));
    // Static directory for uploaded mandapam images
    const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    app.use('/api/uploads', express_1.default.static(uploadsDir));
    app.use('/uploads', express_1.default.static(uploadsDir));
    // Health check (explicitly not cached)
    app.get('/api/health', (_req, res) => {
        res.set('Cache-Control', 'no-store');
        res.json({
            status: 'ok',
            service: 'ganesh-darshan-backend',
            timestamp: new Date().toISOString(),
        });
    });
    // API Routes
    app.use('/api/mandapams', mandapams_routes_js_1.default);
    app.use('/api/admin', admin_routes_js_1.default);
    // 404 Handler
    app.use((_req, res) => {
        res.status(404).json({ success: false, error: 'Endpoint not found' });
    });
    // Global Error Handler with production error message masking
    app.use((err, _req, res, _next) => {
        console.error('[App Error]:', err);
        const isProduction = process.env.NODE_ENV === 'production';
        const status = err.status || err.statusCode || 500;
        if (status === 413) {
            res.status(413).json({ success: false, error: 'Request payload too large. Maximum size is 100kb.' });
            return;
        }
        res.status(status).json({
            success: false,
            error: isProduction ? (status === 500 ? 'Internal server error' : err.message) : (err.message || 'Internal server error'),
        });
    });
    return app;
}
