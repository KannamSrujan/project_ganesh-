"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupabaseConfigured = isSupabaseConfigured;
exports.getSupabaseClient = getSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
function isSupabaseConfigured() {
    return (!!supabaseUrl &&
        !supabaseUrl.includes('your-project-ref') &&
        !!supabaseAnonKey &&
        !supabaseAnonKey.includes('your-anon-key'));
}
let supabaseInstance = null;
function getSupabaseClient() {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] Credentials not configured or using placeholders in backend/.env');
        return null;
    }
    if (!supabaseInstance) {
        supabaseInstance = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}
