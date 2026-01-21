<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'

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
      { text: 'Custom branding', included: false },
      { text: 'Priority support', included: false }
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
      { text: 'Unlimited rooms', included: true },
      { text: 'Unlimited timers', included: true },
      { text: 'All timer types', included: true },
      { text: 'QR code sharing', included: true },
      { text: 'Real-time sync', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Priority support', included: true }
    ],
    cta: 'Coming Soon',
    ctaLink: null,
    highlighted: true
  }
]
</script>

<template>
  <section id="pricing" class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4">
          Simple, transparent pricing
        </h2>
        <p class="text-muted-foreground text-lg">
          Start free and upgrade when you need more.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div
          v-for="plan in plans"
          :key="plan.name"
          class="relative rounded-xl border p-8"
          :class="plan.highlighted
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card/50'"
        >
          <!-- Popular badge -->
          <div
            v-if="plan.highlighted"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full"
          >
            Coming Soon
          </div>

          <div class="text-center mb-8">
            <h3 class="text-xl font-semibold mb-2">{{ plan.name }}</h3>
            <div class="flex items-baseline justify-center gap-1">
              <span class="text-4xl font-bold">{{ plan.price }}</span>
              <span class="text-muted-foreground">{{ plan.period }}</span>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">{{ plan.description }}</p>
          </div>

          <ul class="space-y-3 mb-8">
            <li
              v-for="feature in plan.features"
              :key="feature.text"
              class="flex items-center gap-3"
            >
              <Check
                v-if="feature.included"
                class="w-5 h-5 text-green-500 flex-shrink-0"
              />
              <X
                v-else
                class="w-5 h-5 text-muted-foreground/50 flex-shrink-0"
              />
              <span :class="feature.included ? 'text-foreground' : 'text-muted-foreground/50'">
                {{ feature.text }}
              </span>
            </li>
          </ul>

          <Button
            v-if="plan.ctaLink"
            :variant="plan.highlighted ? 'default' : 'outline'"
            class="w-full"
            as-child
          >
            <RouterLink :to="plan.ctaLink">{{ plan.cta }}</RouterLink>
          </Button>
          <Button
            v-else
            :variant="plan.highlighted ? 'default' : 'outline'"
            class="w-full"
            disabled
          >
            {{ plan.cta }}
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>
