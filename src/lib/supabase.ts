import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
// We use the SECRET_KEY for server-side operations to bypass RLS for uploads/deletes if needed, 
// but since this is a private app, using it server-side is fine.
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: -1,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
