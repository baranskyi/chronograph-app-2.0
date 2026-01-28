<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Sparkles, Zap } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import ContactModal from './ContactModal.vue'

// Billing toggle
const isYearly = ref(true)

// Contact modal
const showContactModal = ref(false)

// Glow effect
const hoveredIndex = ref<number | null>(null)
const glowPos = ref<{ [key: number]: { x: number; y: number } }>({})

function handleMouseMove(index: number, e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  glowPos.value[index] = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

// All features that apply to all paid plans
const allFeatures = [
  'Speaker messages',
  'Audience messages',
  'Q&A sessions',
  'Add/edit timers',
  'Color zones (green/yellow/red)',
  'Progress line',
  'QR code sharing',
  'Real-time sync',
  'Unlimited viewers',
  'Sound alerts',
  'PWA support'
]

const plans = computed(() => [
  {
    name: 'Basic',
    monthlyPrice: 9.95,
    yearlyPrice: 59.95,
    description: 'Perfect for individual speakers',
    limits: {
      rooms: '1 room',
      timers: '3 timers per room'
    },
    features: allFeatures,
    enterpriseFeatures: [],
    cta: 'Start Free Trial',
    ctaLink: '/register?plan=basic',
    highlighted: false,
    badge: null
  },
  {
    name: 'Unlimited',
    monthlyPrice: 24.95,
    yearlyPrice: 149.95,
    description: 'For professional speakers & events',
    limits: {
      rooms: 'Unlimited rooms',
      timers: 'Unlimited timers'
    },
    features: allFeatures,
    enterpriseFeatures: [],
    cta: 'Start Free Trial',
    ctaLink: '/register?plan=unlimited',
    highlighted: true,
    badge: 'Most Popular'
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'For organizations & conferences',
    limits: {
      rooms: 'Unlimited rooms',
      timers: 'Unlimited timers'
    },
    features: allFeatures,
    enterpriseFeatures: [
      'Custom timer design',
      'Custom logo/branding',
      'Dedicated support',
      'Custom integrations'
    ],
    cta: 'Contact Us',
    ctaLink: null,
    highlighted: false,
    badge: null
  }
])

function getDisplayPrice(plan: typeof plans.value[0]) {
  if (plan.monthlyPrice === null) return 'Custom'
  return isYearly.value
    ? `$${plan.yearlyPrice}`
    : `$${plan.monthlyPrice}`
}

function getPeriod(plan: typeof plans.value[0]) {
  if (plan.monthlyPrice === null) return ''
  return isYearly.value ? '/year' : '/month'
}

function getSavings(plan: typeof plans.value[0]) {
  if (plan.monthlyPrice === null || !isYearly.value) return null
  const monthlyCost = plan.monthlyPrice * 12
  const savings = Math.round(((monthlyCost - plan.yearlyPrice) / monthlyCost) * 100)
  return savings
}

function handleCtaClick(plan: typeof plans.value[0]) {
  if (plan.name === 'Enterprise') {
    showContactModal.value = true
  }
}
</script>

<template>
  <section id="pricing" class="section-wrapper">
    <div class="section-container">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 48px;">
        <h2 class="section-title">
          <span class="text-white">Simple, Transparent</span>
          <span class="text-red-500"> Pricing</span>
        </h2>
        <p class="section-subtitle">
          Try free for 3 days. No credit card required.
        </p>

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
      </div>

      <!-- Pricing Cards -->
      <div class="pricing-grid">
        <div
          v-for="(plan, index) in plans"
          :key="plan.name"
          :class="['plan-wrapper', { 'plan-wrapper-highlighted': plan.highlighted, 'plan-wrapper-side': !plan.highlighted }]"
          @mousemove="handleMouseMove(index, $event)"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
        >
          <!-- Badge (outside card for visibility) -->
          <div
            v-if="plan.badge"
            class="badge-wrapper"
          >
            <div class="badge">
              <Sparkles class="w-3.5 h-3.5" />
              {{ plan.badge }}
            </div>
          </div>

          <!-- Glow effect for highlighted plan -->
          <div
            v-if="plan.highlighted"
            class="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-red-600/30 rounded-3xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity"
            style="top: 16px;"
          />

          <!-- Card -->
          <div
            class="pricing-card"
            :class="{ 'pricing-card-highlighted': plan.highlighted }"
          >
            <!-- Interactive glow effect -->
            <div
              class="card-glow"
              :class="{ active: hoveredIndex === index }"
              :style="{
                '--glow-x': (glowPos[index]?.x || 0) + 'px',
                '--glow-y': (glowPos[index]?.y || 0) + 'px'
              }"
            ></div>

            <!-- Header -->
            <div class="text-center" style="margin-bottom: 24px;">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <div class="flex items-baseline justify-center gap-1" style="margin-bottom: 8px;">
                <span class="plan-price">{{ getDisplayPrice(plan) }}</span>
                <span v-if="getPeriod(plan)" class="plan-period">{{ getPeriod(plan) }}</span>
              </div>
              <p class="plan-description">{{ plan.description }}</p>

              <!-- Savings badge -->
              <div v-if="getSavings(plan)" class="savings-badge">
                <Zap class="w-3.5 h-3.5" />
                Save {{ getSavings(plan) }}% with yearly
              </div>
            </div>

            <!-- Trial badge -->
            <div v-if="plan.monthlyPrice !== null" class="trial-badge">
              <span>3 days free trial</span>
              <span class="trial-sub">No credit card required</span>
            </div>

            <!-- Limits -->
            <div class="limits-section">
              <div class="limit-item">
                <Check class="w-4 h-4 text-red-400" />
                <span>{{ plan.limits.rooms }}</span>
              </div>
              <div class="limit-item">
                <Check class="w-4 h-4 text-red-400" />
                <span>{{ plan.limits.timers }}</span>
              </div>
            </div>

            <!-- Features -->
            <div class="features-section">
              <p class="features-title">All features included:</p>
              <ul class="feature-list">
                <li
                  v-for="feature in plan.features"
                  :key="feature"
                  class="feature-item"
                >
                  <div class="feature-check feature-check-included">
                    <Check class="w-3 h-3 text-red-400" />
                  </div>
                  <span class="feature-text text-gray-300">{{ feature }}</span>
                </li>
              </ul>

              <!-- Enterprise features -->
              <template v-if="plan.enterpriseFeatures.length > 0">
                <p class="features-title" style="margin-top: 16px;">Enterprise extras:</p>
                <ul class="feature-list">
                  <li
                    v-for="feature in plan.enterpriseFeatures"
                    :key="feature"
                    class="feature-item"
                  >
                    <div class="feature-check feature-check-included">
                      <Sparkles class="w-3 h-3 text-yellow-400" />
                    </div>
                    <span class="feature-text text-gray-300">{{ feature }}</span>
                  </li>
                </ul>
              </template>
            </div>

            <!-- CTA -->
            <RouterLink
              v-if="plan.ctaLink"
              :to="plan.ctaLink"
              class="cta-button"
              :class="plan.highlighted ? 'cta-primary' : 'cta-secondary'"
            >
              {{ plan.cta }}
            </RouterLink>
            <button
              v-else
              @click="handleCtaClick(plan)"
              class="cta-button cta-secondary"
            >
              {{ plan.cta }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom note -->
      <p class="bottom-note">
        All plans include unlimited viewers, sound alerts, and PWA support.
        <br class="hidden sm:block" />
        Cancel anytime. 14-day money-back guarantee.
      </p>
    </div>

    <!-- Contact Modal -->
    <ContactModal
      v-if="showContactModal"
      @close="showContactModal = false"
    />
  </section>
</template>

<style scoped>
.section-wrapper {
  position: relative;
  width: 100%;
  padding: 100px 24px;
}

.section-container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 24px;
  align-items: center;
  padding-top: 24px;
}

@media (min-width: 768px) {
  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
    padding-top: 32px;
  }
}

/* Plan wrappers for height difference */
.plan-wrapper {
  position: relative;
}

.plan-wrapper-highlighted {
  z-index: 10;
}

.badge-wrapper {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

@media (min-width: 768px) {
  .plan-wrapper-side {
    margin-top: 32px;
    margin-bottom: 32px;
  }

  .plan-wrapper-highlighted {
    transform: scale(1.02);
  }
}

.section-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 18px;
  color: #9ca3af;
  max-width: 500px;
  margin: 0 auto 32px;
}

/* Billing Toggle */
.billing-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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

/* Cards */
.pricing-card {
  position: relative;
  overflow: hidden;
  height: 100%;
  padding: 32px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.pricing-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    500px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(239, 68, 68, 0.12),
    transparent 40%
  );
}

.card-glow.active {
  opacity: 1;
}

.pricing-card-highlighted {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(239, 68, 68, 0.2);
}

.pricing-card-highlighted:hover {
  border-color: rgba(239, 68, 68, 0.3);
}

.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.plan-name {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.plan-price {
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
}

.plan-period {
  color: #9ca3af;
  font-size: 16px;
}

.plan-description {
  font-size: 14px;
  color: #9ca3af;
}

.savings-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 20px;
  color: #22c55e;
  font-size: 12px;
  font-weight: 500;
}

/* Trial badge */
.trial-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  text-align: center;
}

.trial-badge span:first-child {
  color: #ef4444;
  font-weight: 600;
  font-size: 14px;
}

.trial-sub {
  color: #9ca3af;
  font-size: 12px;
}

/* Limits */
.limits-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-weight: 500;
  font-size: 14px;
}

/* Features */
.features-section {
  flex: 1;
  margin-bottom: 24px;
}

.features-title {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feature-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-check-included {
  background: rgba(239, 68, 68, 0.1);
}

.feature-text {
  font-size: 13px;
}

/* CTA */
.cta-button {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: center;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  text-decoration: none;
  margin-top: auto;
}

.cta-primary {
  background: rgba(210, 70, 70, 0.8);
  color: white;
  border: none;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
}

.cta-primary:hover {
  background: rgba(220, 60, 60, 0.9);
  box-shadow: 0 6px 30px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.cta-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.cta-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}

.bottom-note {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  margin-top: 48px;
  line-height: 1.6;
}
</style>
