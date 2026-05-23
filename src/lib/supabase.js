import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isConfigured =
  supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 10

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
