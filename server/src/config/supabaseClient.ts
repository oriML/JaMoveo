/**
 * @file Supabase client configuration.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create a single Supabase client for the entire application
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);