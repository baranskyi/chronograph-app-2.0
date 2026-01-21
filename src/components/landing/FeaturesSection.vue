<script setup lang="ts">
import { Timer, Zap, QrCode, Smartphone } from 'lucide-vue-next'

const features = [
  {
    icon: Timer,
    title: 'Multiple Timers',
    description: 'Create and manage multiple timers in one room. EMOM, Tabata, Countdown, Stopwatch — all in one place.'
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Changes sync instantly across all connected devices. Start, pause, reset — everyone sees it immediately.'
  },
  {
    icon: QrCode,
    title: 'QR Code Sharing',
    description: 'Share your timer with a single QR code. Clients scan and see your timer on their phones instantly.'
  },
  {
    icon: Smartphone,
    title: 'Remote Control',
    description: 'Control timers from anywhere. Use your phone as a remote while clients watch the big screen.'
  }
]
</script>

<template>
  <section id="features" class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4">
          Everything you need to run great sessions
        </h2>
        <p class="text-muted-foreground text-lg">
          Built for coaches who want simple, reliable timing tools that just work.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative p-6 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <component :is="feature.icon" class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-semibold mb-2">{{ feature.title }}</h3>
              <p class="text-muted-foreground">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
