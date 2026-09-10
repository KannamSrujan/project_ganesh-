import dotenv from 'dotenv';
dotenv.config();

import { validateEnvironment } from './config/envValidation.js';
validateEnvironment();

import { createApp } from './app.js';
import { isSupabaseConfigured } from './config/supabase.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Ganesh Darshan Backend running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`💓 Health:   http://localhost:${PORT}/api/health`);
  console.log(`📦 Supabase Configured: ${isSupabaseConfigured() ? 'YES ✅' : 'NO ⚠️'}`);
  console.log(`===========================================`);
});
