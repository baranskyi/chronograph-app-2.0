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
