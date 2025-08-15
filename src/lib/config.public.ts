// Client-safe public environment configuration
// Only includes NEXT_PUBLIC_* variables that are safe for the browser

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const

export type PublicEnv = typeof publicEnv

/**
 * Get the app URL, with fallback for local development
 */
export function getAppUrl(): string {
  return publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Get Supabase configuration for client use
 */
export function getSupabaseConfig() {
  return {
    url: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}