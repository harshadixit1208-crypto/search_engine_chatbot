import { createClient } from "@supabase/supabase-js";

// Get environment variables from window object (injected by server)
declare global {
  interface Window {
    env?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_PUBLISHABLE_KEY?: string;
    };
  }
}

const supabaseUrl = window.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = window.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error("VITE_SUPABASE_URL is missing from environment");
  throw new Error("Missing VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  console.error("VITE_SUPABASE_PUBLISHABLE_KEY is missing from environment");
  throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
