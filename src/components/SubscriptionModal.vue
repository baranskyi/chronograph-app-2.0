<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Lock, Check, CreditCard, Loader2 } from 'lucide-vue-next'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

const emit = defineEmits<{
  close: []
}>()

export type SubscriptionModalReason = 'trial_expired' | 'limit_reached'

const props = defineProps<{
  showClose?: boolean
  reason?: SubscriptionModalReason
}>()

const subscriptionStore = useSubscriptionStore()
const isYearly = ref(true)
const processingPlan = ref<string | null>(null)

const plans = computed(() => [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 9.95,
    yearlyPrice: 59.95,
    description: '1 room, 3 timers',
    highlighted: false
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    monthlyPrice: 24.95,
    yearlyPrice: 149.95,
    description: 'Unlimited rooms & timers',
    highlighted: true
  }
])

function getDisplayPrice(plan: typeof plans.value[0]) {
  return isYearly.value
    ? `$${plan.yearlyPrice}`
    : `$${plan.monthlyPrice}`
}

function getPeriod() {
  return isYearly.value ? '/year' : '/month'
}

const modalTitle = computed(() => {
  if (props.reason === 'limit_reached') {
    return 'Upgrade Your Plan'
  }
  return 'Your Trial Has Ended'
})

const modalSubtitle = computed(() => {
  if (props.reason === 'limit_reached') {
    return 'To add more Rooms and Timers you need to subscribe to a plan'
  }
  return 'Choose a plan to continue using Chronograph'
})

async function handleSelectPlan(planId: string) {
  processingPlan.value = planId

  const url = await subscriptionStore.createCheckoutSession(
    planId as 'basic' | 'unlimited',
    isYearly.value ? 'yearly' : 'monthly'
  )

  if (url) {
    window.location.href = url
  }

  processingPlan.value = null
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop">
      <div class="modal-content">
        <!-- Close button (optional) -->
        <button
          v-if="props.showClose"
          @click="emit('close')"
          class="close-btn"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Header -->
        <div class="modal-header">
          <div class="lock-icon">
            <Lock class="w-8 h-8 text-red-400" />
          </div>
          <h2>{{ modalTitle }}</h2>
          <p>{{ modalSubtitle }}</p>
        </div>

        <!-- Billing Toggle -->
        <div class="billing-toggle">
          <button
            @click="isYearly = false"
            :class="['toggle-btn', { active: !isYearly }]"
          >
            Monthly
          </button>
          <button
            @click="isYearly = true"
            :class="['toggle-btn', { active: isYearly }]"
          >
            Yearly
            <span class="save-badge">Save 50%</span>
          </button>
        </div>

        <!-- Plans -->
        <div class="plans-grid">
          <div
            v-for="plan in plans"
            :key="plan.id"
            :class="['plan-card', { highlighted: plan.highlighted }]"
          >
            <div class="plan-header">
              <h3>{{ plan.name }}</h3>
              <div class="price">
                <span class="amount">{{ getDisplayPrice(plan) }}</span>
                <span class="period">{{ getPeriod() }}</span>
              </div>
              <p class="description">{{ plan.description }}</p>
            </div>

            <button
              @click="handleSelectPlan(plan.id)"
              :disabled="processingPlan !== null"
              :class="['select-btn', { primary: plan.highlighted }]"
            >
              <template v-if="processingPlan === plan.id">
                <Loader2 class="w-4 h-4 animate-spin" />
                Processing...
              </template>
              <template v-else>
                <CreditCard class="w-4 h-4" />
                Select {{ plan.name }}
              </template>
            </button>
          </div>
        </div>

        <!-- Features reminder -->
        <div class="features-reminder">
          <p>All plans include:</p>
          <div class="features-list">
            <span><Check class="w-3 h-3" /> Speaker messages</span>
            <span><Check class="w-3 h-3" /> Q&A sessions</span>
            <span><Check class="w-3 h-3" /> Color zones</span>
            <span><Check class="w-3 h-3" /> Unlimited viewers</span>
          </div>
        </div>

        <!-- Contact Enterprise -->
        <p class="enterprise-link">
          Need more? <a href="/#pricing">Contact us for Enterprise</a>
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 600px;
  padding: 40px;
  background: rgba(17, 17, 17, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.lock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 50%;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.modal-header p {
  font-size: 14px;
  color: #9ca3af;
}

/* Billing Toggle */
.billing-toggle {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: rgba(239, 68, 68, 0.2);
  color: white;
}

.toggle-btn:hover:not(.active) {
  color: white;
}

.save-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

/* Plans Grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

@media (max-width: 500px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}

.plan-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.2s ease;
}

.plan-card.highlighted {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
}

.plan-header {
  text-align: center;
  margin-bottom: 20px;
}

.plan-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.price .amount {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.price .period {
  font-size: 14px;
  color: #9ca3af;
}

.description {
  font-size: 13px;
  color: #6b7280;
}

.select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.select-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.select-btn.primary {
  background: rgba(239, 68, 68, 0.8);
  border: none;
}

.select-btn.primary:hover {
  background: rgba(239, 68, 68, 0.9);
}

/* Features reminder */
.features-reminder {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  margin-bottom: 16px;
}

.features-reminder p {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.features-list span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.features-list span svg {
  color: #22c55e;
}

/* Enterprise link */
.enterprise-link {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.enterprise-link a {
  color: #ef4444;
  text-decoration: none;
}

.enterprise-link a:hover {
  text-decoration: underline;
}
</style>
