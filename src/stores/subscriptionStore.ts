import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'

export type SubscriptionPlan = 'trial' | 'basic' | 'unlimited' | 'enterprise'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

// Plan limits
const PLAN_LIMITS = {
  trial: { rooms: Infinity, timersPerRoom: Infinity },
  basic: { rooms: 1, timersPerRoom: 1 },
  unlimited: { rooms: Infinity, timersPerRoom: Infinity },
  enterprise: { rooms: Infinity, timersPerRoom: Infinity }
}

export const useSubscriptionStore = defineStore('subscription', () => {
  const authStore = useAuthStore()

  // State
  const subscription = ref<Subscription | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const plan = computed(() => subscription.value?.plan || 'trial')
  const status = computed(() => subscription.value?.status || 'trialing')

  const isTrialing = computed(() => status.value === 'trialing')
  const isActive = computed(() => status.value === 'active')
  const isPastDue = computed(() => status.value === 'past_due')
  const isCanceled = computed(() => status.value === 'canceled')
  const isExpired = computed(() => status.value === 'expired')

  const trialEndsAt = computed(() => {
    if (!subscription.value?.trial_ends_at) return null
    return new Date(subscription.value.trial_ends_at)
  })

  const currentPeriodEnd = computed(() => {
    if (!subscription.value?.current_period_end) return null
    return new Date(subscription.value.current_period_end)
  })

  const daysLeftInTrial = computed(() => {
    if (!trialEndsAt.value) return 0
    const now = new Date()
    const diff = trialEndsAt.value.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  const isTrialExpired = computed(() => {
    if (!isTrialing.value) return false
    return daysLeftInTrial.value <= 0
  })

  // Check if service should be blocked (trial expired and no active subscription)
  const isBlocked = computed(() => {
    if (isActive.value) return false
    if (isTrialing.value && !isTrialExpired.value) return false
    return true
  })

  // Plan limits
  const maxRooms = computed(() => PLAN_LIMITS[plan.value]?.rooms ?? 1)
  const maxTimersPerRoom = computed(() => PLAN_LIMITS[plan.value]?.timersPerRoom ?? 1)

  // Actions
  async function loadSubscription() {
    if (!authStore.userId) return

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', authStore.userId)
        .single()

      if (fetchError) {
        // No subscription found - might be a new user
        if (fetchError.code === 'PGRST116') {
          subscription.value = null
          return
        }
        throw fetchError
      }

      subscription.value = data

      // Check and update expired trial status
      if (data.status === 'trialing' && data.trial_ends_at) {
        const trialEnd = new Date(data.trial_ends_at)
        if (trialEnd < new Date()) {
          await updateSubscriptionStatus('expired')
        }
      }
    } catch (err) {
      console.error('Failed to load subscription:', err)
      error.value = 'Failed to load subscription'
    } finally {
      loading.value = false
    }
  }

  async function updateSubscriptionStatus(newStatus: SubscriptionStatus) {
    if (!authStore.userId || !subscription.value) return

    try {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ status: newStatus })
        .eq('user_id', authStore.userId)

      if (updateError) throw updateError

      subscription.value.status = newStatus
    } catch (err) {
      console.error('Failed to update subscription status:', err)
    }
  }

  function canCreateRoom(currentRoomCount: number): boolean {
    if (isBlocked.value) return false
    return currentRoomCount < maxRooms.value
  }

  function canCreateTimer(currentTimerCount: number): boolean {
    if (isBlocked.value) return false
    return currentTimerCount < maxTimersPerRoom.value
  }

  function reset() {
    subscription.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    subscription,
    loading,
    error,

    // Computed
    plan,
    status,
    isTrialing,
    isActive,
    isPastDue,
    isCanceled,
    isExpired,
    trialEndsAt,
    currentPeriodEnd,
    daysLeftInTrial,
    isTrialExpired,
    isBlocked,
    maxRooms,
    maxTimersPerRoom,

    // Actions
    loadSubscription,
    updateSubscriptionStatus,
    canCreateRoom,
    canCreateTimer,
    reset
  }
})
