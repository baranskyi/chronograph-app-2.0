<script setup lang="ts">
import { Check, Sparkles } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 room',
      '3 timers per room',
      'All timer types',
      'QR code sharing',
      'Real-time sync'
    ],
    cta: 'Get Started',
    ctaLink: '/register',
    highlighted: false
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For professional coaches',
    features: [
      'Unlimited rooms',
      'Unlimited timers',
      'All timer types',
      'QR code sharing',
      'Real-time sync',
      'Custom branding',
      'Priority support'
    ],
    cta: 'Coming Soon',
    ctaLink: null,
    highlighted: true
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
          <span class="text-white">Simple</span>
          <span class="text-gray-400"> pricing</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
            class="relative h-full p-8 rounded-3xl border transition-all duration-300"
            :class="plan.highlighted
              ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10'"
          >
            <!-- Popular badge -->
            <div
              v-if="plan.highlighted"
              class="absolute -top-4 left-1/2 -translate-x-1/2"
            >
              <div class="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-xs font-medium">
                <Sparkles class="w-3.5 h-3.5" />
                Coming Soon
              </div>
            </div>

            <!-- Header -->
            <div class="text-center mb-8 pt-4">
              <h3 class="text-xl font-semibold text-white mb-2">{{ plan.name }}</h3>
              <div class="flex items-baseline justify-center gap-1 mb-2">
                <span class="text-5xl font-bold text-white">{{ plan.price }}</span>
                <span class="text-gray-500">{{ plan.period }}</span>
              </div>
              <p class="text-sm text-gray-500">{{ plan.description }}</p>
            </div>

            <!-- Features -->
            <ul class="space-y-4 mb-8">
              <li
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-center gap-3"
              >
                <div class="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check class="w-3 h-3 text-green-400" />
                </div>
                <span class="text-gray-300 text-sm">{{ feature }}</span>
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
    </div>
  </section>
</template>
