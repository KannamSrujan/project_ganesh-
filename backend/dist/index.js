"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envValidation_js_1 = require("./config/envValidation.js");
(0, envValidation_js_1.validateEnvironment)();
const app_js_1 = require("./app.js");
const supabase_js_1 = require("./config/supabase.js");
const localStore_js_1 = require("./services/localStore.js");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const app = (0, app_js_1.createApp)();
const server = app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Ganesh Darshan Backend running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`💓 Health:   http://localhost:${PORT}/api/health`);
    console.log(`📦 Supabase Configured: ${(0, supabase_js_1.isSupabaseConfigured)() ? 'YES ✅' : 'NO ⚠️'}`);
    console.log(`===========================================`);
});
let isShuttingDown = false;
async function handleGracefulShutdown(signal, exitCode = 0) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    console.log(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);
    // Force exit if shutdown takes longer than 10 seconds
    const forceExitTimeout = setTimeout(() => {
        console.error('[Shutdown] Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
    forceExitTimeout.unref();
    // Stop accepting new HTTP connections and wait for pending requests
    server.close(async (err) => {
        if (err) {
            console.error('[Shutdown] Error closing HTTP server:', err.message);
        }
        else {
            console.log('[Shutdown] Closed HTTP server. No longer accepting connections.');
        }
        try {
            console.log('[Shutdown] Flushing pending local store writes...');
            await localStore_js_1.localStore.waitForPendingWrites();
            console.log('[Shutdown] Local store persistence complete.');
        }
        catch (persistErr) {
            console.error('[Shutdown] Error flushing local store writes:', persistErr instanceof Error ? persistErr.message : String(persistErr));
        }
        console.log('[Shutdown] Graceful shutdown completed cleanly.');
        process.exit(exitCode);
    });
}
// OS process termination signals
process.on('SIGTERM', () => {
    handleGracefulShutdown('SIGTERM', 0);
});
process.on('SIGINT', () => {
    handleGracefulShutdown('SIGINT', 0);
});
// Process-level safety handler for unexpected unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    const safeMessage = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Unknown rejection';
    console.error('[Process] Unhandled Promise Rejection detected:', safeMessage);
    handleGracefulShutdown('unhandledRejection', 1);
});
