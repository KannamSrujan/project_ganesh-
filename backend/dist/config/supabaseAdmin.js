"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupabaseAdminConfigured = isSupabaseAdminConfigured;
exports.getSupabaseAdminClient = getSupabaseAdminClient;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
function isSupabaseAdminConfigured() {
    return (!!supabaseUrl &&
        !supabaseUrl.includes('your-project-ref') &&
        !!supabaseServiceRoleKey &&
        !supabaseServiceRoleKey.includes('placeholder') &&
        !supabaseServiceRoleKey.includes('your-service-role-key'));
}
let supabaseAdminInstance = null;
/**
 * Returns the privileged Supabase client with service-role permissions.
 * WARNING: This client bypasses RLS and MUST ONLY be used inside protected
 * admin endpoints after authorization has been strictly verified.
 */
function getSupabaseAdminClient() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.warn('[SupabaseAdmin] Service role credentials missing in backend/.env');
        return null;
    }
    if (!supabaseAdminInstance) {
        supabaseAdminInstance = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
    }
    return supabaseAdminInstance;
}
