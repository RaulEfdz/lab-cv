import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabasePublishableKey, getSupabaseUrl } from "./env"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Backwards-compatible alias for existing imports.
export async function createClient() {
  return createSupabaseServerClient()
}
