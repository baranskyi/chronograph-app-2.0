<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Mail,
  CreditCard,
  Calendar,
  Crown,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Check,
  Clock
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

const router = useRouter()
const authStore = useAuthStore()
const subscriptionStore = useSubscriptionStore()

const loading = ref(false)

onMounted(async () => {
  loading.value = true
  await subscriptionStore.loadSubscription()
  loading.value = false
})

const planDisplay = computed(() => {
  const planNames: Record<string, string> = {
    trial: 'Trial',
    basic: 'Basic',
    unlimited: 'Unlimited',
    enterprise: 'Enterprise'
  }
  return planNames[subscriptionStore.plan] || 'Unknown'
})

const statusDisplay = computed(() => {
  const statusMap: Record<string, { text: string; color: string; icon: typeof Check }> = {
    trialing: { text: 'Trial', color: 'text-yellow-400', icon: Clock },
    active: { text: 'Active', color: 'text-green-400', icon: Check },
    past_due: { text: 'Past Due', color: 'text-red-400', icon: AlertTriangle },
    canceled: { text: 'Canceled', color: 'text-gray-400', icon: AlertTriangle },
    expired: { text: 'Expired', color: 'text-red-400', icon: AlertTriangle }
  }
  return statusMap[subscriptionStore.status] || { text: 'Unknown', color: 'text-gray-400', icon: AlertTriangle }
})

const formattedTrialEnd = computed(() => {
  if (!subscriptionStore.trialEndsAt) return null
  return subscriptionStore.trialEndsAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

const formattedPeriodEnd = computed(() => {
  if (!subscriptionStore.currentPeriodEnd) return null
  return subscriptionStore.currentPeriodEnd.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

function handleUpgrade() {
  router.push('/#pricing')
}

function handleManageSubscription() {
  // TODO: Redirect to Stripe Customer Portal
  console.log('Open Stripe Customer Portal')
}

function goBack() {
  router.push('/my-rooms')
}
</script>

<template>
  <div class="profile-page">
    <!-- Header -->
    <header class="page-header">
      <button @click="goBack" class="back-btn">
        <ArrowLeft class="w-5 h-5" />
        Back to Rooms
      </button>
      <h1>Account Settings</h1>
    </header>

    <div class="content">
      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>

      <template v-else>
        <!-- Profile Section -->
        <section class="section">
          <h2 class="section-title">
            <User class="w-5 h-5" />
            Profile
          </h2>

          <div class="info-card">
            <div class="info-row">
              <div class="info-label">
                <Mail class="w-4 h-4" />
                Email
              </div>
              <div class="info-value">{{ authStore.userEmail }}</div>
            </div>
          </div>
        </section>

        <!-- Subscription Section -->
        <section class="section">
          <h2 class="section-title">
            <CreditCard class="w-5 h-5" />
            Subscription
          </h2>

          <div class="info-card">
            <!-- Current Plan -->
            <div class="info-row">
              <div class="info-label">
                <Crown class="w-4 h-4" />
                Current Plan
              </div>
              <div class="info-value plan-badge">
                {{ planDisplay }}
              </div>
            </div>

            <!-- Status -->
            <div class="info-row">
              <div class="info-label">
                <component :is="statusDisplay.icon" class="w-4 h-4" />
                Status
              </div>
              <div :class="['info-value', statusDisplay.color]">
                {{ statusDisplay.text }}
              </div>
            </div>

            <!-- Trial End (if trialing) -->
            <div v-if="subscriptionStore.isTrialing && formattedTrialEnd" class="info-row">
              <div class="info-label">
                <Calendar class="w-4 h-4" />
                Trial Ends
              </div>
              <div class="info-value">
                {{ formattedTrialEnd }}
                <span v-if="subscriptionStore.daysLeftInTrial > 0" class="days-left">
                  ({{ subscriptionStore.daysLeftInTrial }} days left)
                </span>
                <span v-else class="text-red-400">(Expired)</span>
              </div>
            </div>

            <!-- Period End (if active) -->
            <div v-if="subscriptionStore.isActive && formattedPeriodEnd" class="info-row">
              <div class="info-label">
                <Calendar class="w-4 h-4" />
                Next Billing
              </div>
              <div class="info-value">{{ formattedPeriodEnd }}</div>
            </div>

            <!-- Plan Limits -->
            <div class="limits-section">
              <h3>Plan Limits</h3>
              <div class="limits-grid">
                <div class="limit-item">
                  <span class="limit-value">
                    {{ subscriptionStore.maxRooms === Infinity ? 'Unlimited' : subscriptionStore.maxRooms }}
                  </span>
                  <span class="limit-label">Rooms</span>
                </div>
                <div class="limit-item">
                  <span class="limit-value">
                    {{ subscriptionStore.maxTimersPerRoom === Infinity ? 'Unlimited' : subscriptionStore.maxTimersPerRoom }}
                  </span>
                  <span class="limit-label">Timers per room</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <button
              v-if="!subscriptionStore.isActive"
              @click="handleUpgrade"
              class="btn-primary"
            >
              <Crown class="w-4 h-4" />
              Upgrade Plan
            </button>

            <button
              v-if="subscriptionStore.isActive"
              @click="handleManageSubscription"
              class="btn-secondary"
            >
              <ExternalLink class="w-4 h-4" />
              Manage Subscription
            </button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  padding: 24px;
}

.page-header {
  max-width: 600px;
  margin: 0 auto 32px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 24px;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: white;
}

.content {
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #9ca3af;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ef4444;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
}

.info-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #9ca3af;
}

.info-value {
  font-size: 14px;
  color: white;
  font-weight: 500;
}

.plan-badge {
  padding: 4px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 20px;
  color: #ef4444;
}

.days-left {
  margin-left: 8px;
  color: #9ca3af;
  font-weight: 400;
}

.limits-section {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
}

.limits-section h3 {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.limits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.limit-item {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.limit-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.limit-label {
  font-size: 12px;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
