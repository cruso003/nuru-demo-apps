import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/lib/supabase'

// Client-side auth client
export const createAuthClient = () => {
  return createClientComponentClient<Database>()
}

// Server-side auth client
export const createServerAuthClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
})

// Service role client for admin operations
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Authentication utilities
export async function getUser() {
  const supabase = createServerAuthClient()
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    console.error('Error getting user:', error)
    return { user: null, error }
  }
}

export async function requireAuth() {
  const { user, error } = await getUser()
  if (!user || error) {
    throw new Error('Authentication required')
  }
  return user
}

// Sign up function
export async function signUp(email: string, password: string, userData: any) {
  const supabase = createAuthClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  
  return { data, error }
}

// Sign in function
export async function signIn(email: string, password: string) {
  const supabase = createAuthClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  return { data, error }
}

// Sign out function
export async function signOut() {
  const supabase = createAuthClient()
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Anonymous sign in for demo users
export async function signInAnonymously(userData: any) {
  const supabase = createAuthClient()
  
  // For demo users, we'll create a session with guest credentials
  const guestEmail = `guest_${Date.now()}@demo.nuru-learn.com`
  const guestPassword = `demo_${Math.random().toString(36).substring(7)}`
  
  const { data, error } = await supabase.auth.signUp({
    email: guestEmail,
    password: guestPassword,
    options: {
      data: {
        ...userData,
        is_guest: true,
        full_name: userData.name
      }
    }
  })
  
  return { data, error }
}
