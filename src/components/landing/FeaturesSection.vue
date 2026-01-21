<script setup lang="ts">
import { Timer, Zap, QrCode, Smartphone } from 'lucide-vue-next'

const features = [
  {
    icon: Timer,
    title: 'Multiple Timers',
    description: 'Create and manage multiple timers in one room. EMOM, Tabata, Countdown, Stopwatch.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Changes sync instantly across all connected devices. Everyone sees updates immediately.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: QrCode,
    title: 'QR Code Sharing',
    description: 'Share your timer with a single QR code. Clients scan and join in seconds.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Smartphone,
    title: 'Remote Control',
    description: 'Control timers from anywhere. Use your phone while clients view the display.',
    gradient: 'from-green-500 to-emerald-500'
  }
]
</script>

<template>
  <section id="features" class="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />

    <div class="relative max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">Everything you need</span>
          <br />
          <span class="text-gray-400">for great sessions</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Built for coaches who want simple, reliable tools that just work.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
        >
          <!-- Icon with gradient background -->
          <div class="relative mb-6">
            <div
              class="absolute inset-0 w-14 h-14 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
              :class="`bg-gradient-to-r ${feature.gradient}`"
            />
            <div class="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <component
                :is="feature.icon"
                class="w-7 h-7"
                :class="`text-transparent bg-gradient-to-r ${feature.gradient} bg-clip-text`"
                style="stroke: url(#icon-gradient); stroke-width: 2;"
              />
              <!-- Use actual color instead of gradient stroke -->
              <component
                :is="feature.icon"
                class="w-7 h-7 absolute text-white/80"
              />
            </div>
          </div>

          <!-- Content -->
          <h3 class="text-xl font-semibold text-white mb-3 group-hover:text-white transition-colors">
            {{ feature.title }}
          </h3>
          <p class="text-gray-400 leading-relaxed">
            {{ feature.description }}
          </p>

          <!-- Hover glow effect -->
          <div
            class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            :class="`bg-gradient-to-r ${feature.gradient}`"
            style="filter: blur(80px); transform: scale(0.8); z-index: -1;"
          />
        </div>
      </div>
    </div>
  </section>
</template>
