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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const app = (0, app_js_1.createApp)();
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Ganesh Darshan Backend running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`💓 Health:   http://localhost:${PORT}/api/health`);
    console.log(`📦 Supabase Configured: ${(0, supabase_js_1.isSupabaseConfigured)() ? 'YES ✅' : 'NO ⚠️'}`);
    console.log(`===========================================`);
});
