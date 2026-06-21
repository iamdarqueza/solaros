import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for TypeScript
export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface User {
  id: string
  org_id: string
  role: 'owner' | 'admin' | 'manager' | 'support_agent' | 'technician'
  full_name: string
  email?: string
  avatar_url?: string | null
  phone?: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  org_id: string
  plate_number: string
  location: {
    latitude: number
    longitude: number
  }
  status: 'idle' | 'en_route' | 'maintenance' | 'offline' | 'error'
  vehicle_type: 'logistics_freight' | 'electric_autonomous' | 'utility_support' | 'simulated_truck'
  av_events?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Route {
  id: string
  org_id: string
  vehicle_id: string
  start: {
    latitude: number
    longitude: number
  }
  end: {
    latitude: number
    longitude: number
  }
  waypoints?: Record<string, unknown>
  created_at: string
} 