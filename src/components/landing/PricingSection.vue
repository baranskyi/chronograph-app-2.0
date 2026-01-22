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
  <section id="pricing" class="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

    <div class="relative max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">Simple, Transparent</span>
          <span class="text-gray-400"> Pricing</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Start free. Upgrade when you need more power.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="relative group"
        >
          <!-- Glow effect for highlighted plan -->
          <div
            v-if="plan.highlighted"
            class="absolute -inset-px bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition-opacity"
          />

          <!-- Card -->
          <div
            class="relative h-full p-8 rounded-3xl border transition-all duration-300 flex flex-col"
            :class="plan.highlighted
              ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10'"
          >
            <!-- Badge -->
            <div
              v-if="plan.badge"
              class="absolute -top-4 left-1/2 -translate-x-1/2"
            >
              <div class="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-xs font-medium">
                <Sparkles class="w-3.5 h-3.5" />
                {{ plan.badge }}
              </div>
            </div>

            <!-- Header -->
            <div class="text-center mb-8" :class="plan.badge ? 'pt-4' : ''">
              <h3 class="text-xl font-semibold text-white mb-2">{{ plan.name }}</h3>
              <div class="flex items-baseline justify-center gap-1 mb-2">
                <span class="text-5xl font-bold text-white">{{ plan.price }}</span>
                <span v-if="plan.period" class="text-gray-500">{{ plan.period }}</span>
              </div>
              <p class="text-sm text-gray-500">{{ plan.description }}</p>
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8 flex-1">
              <li
                v-for="feature in plan.features"
                :key="feature.text"
                class="flex items-center gap-3"
              >
                <div
                  class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  :class="feature.included ? 'bg-green-500/10' : 'bg-white/5'"
                >
                  <Check
                    v-if="feature.included"
                    class="w-3 h-3 text-green-400"
                  />
                  <X
                    v-else
                    class="w-3 h-3 text-gray-600"
                  />
                </div>
                <span
                  class="text-sm"
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
              class="block w-full py-4 text-center font-medium rounded-xl transition-all duration-300 cursor-pointer"
              :class="plan.highlighted
                ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'"
            >
              {{ plan.cta }}
            </RouterLink>
            <button
              v-else
              disabled
              class="block w-full py-4 text-center font-medium rounded-xl bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
            >
              {{ plan.cta }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom note -->
      <p class="text-center text-gray-500 text-sm mt-12">
        All plans include unlimited viewers, sound alerts, and PWA support.
        <br class="hidden sm:block" />
        Pro and Enterprise plans coming soon. Join the waitlist by signing up.
      </p>
    </div>
  </section>
</template>
