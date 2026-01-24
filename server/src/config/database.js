/**
 * Supabase Client Configuration
 * Provides both anonymous and service role clients
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Check your .env file.');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY');
}

/**
 * Supabase client with anonymous key
 * Use for operations that respect RLS policies
 */
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

/**
 * Supabase client with service role key
 * Use for admin operations that bypass RLS
 * ⚠️ Use with caution - this bypasses all security policies
 */
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Get a Supabase client authenticated with user's JWT
 * @param {string} accessToken - User's JWT access token
 * @returns {SupabaseClient} Authenticated Supabase client
 */
const getAuthenticatedClient = (accessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

module.exports = {
  supabase,
  supabaseAdmin,
  getAuthenticatedClient,
};
