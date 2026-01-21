import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id ?? null)
  const userEmail = computed(() => user.value?.email ?? null)
  const accessToken = computed(() => session.value?.access_token ?? null)

  // Initialize auth state
  async function initialize() {
    loading.value = true
    error.value = null

    try {
      // Get current session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      session.value = currentSession
      user.value = currentSession?.user ?? null

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize auth'
      console.error('Auth initialization error:', err)
    } finally {
      loading.value = false
    }
  }

  // Sign up with email and password
  async function signUp(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) throw signUpError

      // Check if email confirmation is required
      if (data.user && !data.session) {
        error.value = 'Please check your email to confirm your account'
        return false
      }

      session.value = data.session
      user.value = data.user
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign up failed'
      return false
    } finally {
      loading.value = false
    }
  }

  // Sign in with email and password
  async function signIn(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      session.value = data.session
      user.value = data.user
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign in failed'
      return false
    } finally {
      loading.value = false
    }
  }

  // Sign out
  async function signOut(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      session.value = null
      user.value = null

      // Clear room data from localStorage to prevent cross-account data leakage
      localStorage.removeItem('chronograph-roomId')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
    } finally {
      loading.value = false
    }
  }

  // Reset password
  async function resetPassword(email: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (resetError) throw resetError
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password reset failed'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    user,
    session,
    loading,
    error,

    // Computed
    isAuthenticated,
    userId,
    userEmail,
    accessToken,

    // Actions
    initialize,
    signUp,
    signIn,
    signOut,
    resetPassword
  }
})
