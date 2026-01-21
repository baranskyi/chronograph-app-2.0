import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

if (!config.supabase.url || !config.supabase.serviceKey) {
  console.warn('Supabase credentials not configured. Database persistence will be disabled.')
}

export const supabase = config.supabase.url && config.supabase.serviceKey
  ? createClient(config.supabase.url, config.supabase.serviceKey)
  : null

export function isSupabaseEnabled(): boolean {
  return supabase !== null
}

// Verify JWT token and extract user ID
export async function verifyToken(token: string): Promise<string | null> {
  if (!config.supabase.url || !config.supabase.anonKey) {
    return null
  }

  try {
    // Create a temporary client with the user's token
    const userClient = createClient(config.supabase.url, config.supabase.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error } = await userClient.auth.getUser()
    if (error || !user) {
      console.log('Token verification failed:', error?.message)
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}
