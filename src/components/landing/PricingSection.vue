<script setup lang="ts">
import { Check, X, Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      { text: '1 room', included: true },
      { text: '3 timers per room', included: true },
      { text: 'All timer types', included: true },
      { text: 'QR code sharing', included: true },
      { text: 'Real-time sync', included: true },
      { text: 'Unlimited viewers', included: true },
      { text: 'Custom branding', included: false },
      { text: 'Priority support', included: false }
    ],
    cta: 'Get Started Free',
    ctaLink: '/register',
    highlighted: false,
    badge: null
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For professional coaches',
    features: [
      { text: 'Unlimited rooms', included: true },
      { text: 'Unlimited timers', included: true },
      { text: 'All timer types', included: true },
      { text: 'QR code sharing', included: true },
      { text: 'Real-time sync', included: true },
      { text: 'Unlimited viewers', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Priority support', included: true }
    ],
    cta: 'Coming Soon',
    ctaLink: null,
    highlighted: true,
    badge: 'Most Popular'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'SSO integration', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'On-premise option', included: true },
      { text: 'Training sessions', included: true },
      { text: 'Volume discounts', included: true }
    ],
    cta: 'Contact Us',
    ctaLink: null,
    highlighted: false,
    badge: null
  }
]
</script>

<template>
  <section id="pricing" class="section-wrapper">
    <div class="section-container">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">Simple, Transparent</span>
          <span class="text-red-500"> Pricing</span>
        </h2>
        <p class="section-subtitle">
          Start free. Upgrade when you need more power.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="pricing-grid">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="relative group"
        >
          <!-- Glow effect for highlighted plan -->
          <div
            v-if="plan.highlighted"
            class="absolute -inset-1 bg-gradient-to-r from-red-500/30 to-red-600/30 rounded-3xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity"
          />

          <!-- Card -->
          <div
            class="pricing-card"
            :class="{ 'pricing-card-highlighted': plan.highlighted }"
          >
            <!-- Badge -->
            <div
              v-if="plan.badge"
              class="absolute -top-4 left-1/2 -translate-x-1/2"
            >
              <div class="badge">
                <Sparkles class="w-3.5 h-3.5" />
                {{ plan.badge }}
              </div>
            </div>

            <!-- Header -->
            <div class="text-center" :style="plan.badge ? 'padding-top: 16px; margin-bottom: 32px;' : 'margin-bottom: 32px;'">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <div class="flex items-baseline justify-center gap-1" style="margin-bottom: 8px;">
                <span class="plan-price">{{ plan.price }}</span>
                <span v-if="plan.period" class="plan-period">{{ plan.period }}</span>
              </div>
              <p class="plan-description">{{ plan.description }}</p>
            </div>

            <!-- Features -->
            <ul class="feature-list">
              <li
                v-for="feature in plan.features"
                :key="feature.text"
                class="feature-item"
              >
                <div
                  class="feature-check"
                  :class="feature.included ? 'feature-check-included' : 'feature-check-excluded'"
                >
                  <Check
                    v-if="feature.included"
                    class="w-3 h-3 text-red-400"
                  />
                  <X
                    v-else
                    class="w-3 h-3 text-gray-600"
                  />
                </div>
                <span
                  class="feature-text"
                  :class="feature.included ? 'text-gray-300' : 'text-gray-600'"
                >
                  {{ feature.text }}
                </span>
              </li>
            </ul>

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
              disabled
              class="cta-disabled"
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
        Pro and Enterprise plans coming soon. Join the waitlist by signing up.
      </p>
    </div>
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
}

@media (min-width: 768px) {
  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
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
  margin: 0 auto;
}

.pricing-card {
  position: relative;
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

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  flex: 1;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-check-included {
  background: rgba(239, 68, 68, 0.1);
}

.feature-check-excluded {
  background: rgba(255, 255, 255, 0.05);
}

.feature-text {
  font-size: 14px;
}

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

.cta-disabled {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: center;
  font-weight: 500;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: #6b7280;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: not-allowed;
}

.bottom-note {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  margin-top: 48px;
  line-height: 1.6;
}
</style>
