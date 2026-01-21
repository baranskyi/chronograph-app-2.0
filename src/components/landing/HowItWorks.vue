<script setup lang="ts">
import { UserPlus, Plus, Share2, PlayCircle } from 'lucide-vue-next'

const steps = [
  {
    icon: UserPlus,
    step: 1,
    title: 'Create a room',
    description: 'Sign up and create your first room in seconds. Each room gets a unique code.'
  },
  {
    icon: Plus,
    step: 2,
    title: 'Add timers',
    description: 'Add EMOM, Tabata, Countdown, or Stopwatch timers. Configure rounds and rest periods.'
  },
  {
    icon: Share2,
    step: 3,
    title: 'Share with clients',
    description: 'Share the QR code or link. Viewers join instantly without creating an account.'
  },
  {
    icon: PlayCircle,
    step: 4,
    title: 'Control remotely',
    description: 'Start, pause, and reset from your phone. Everyone sees changes in real-time.'
  }
]
</script>

<template>
  <section id="how-it-works" class="relative py-24 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-20">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">How it</span>
          <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> works</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Get started in under a minute. No complex setup.
        </p>
      </div>

      <!-- Steps -->
      <div class="relative">
        <!-- Connection line (desktop) -->
        <div class="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          <div
            v-for="item in steps"
            :key="item.step"
            class="relative text-center group"
          >
            <!-- Step number badge -->
            <div class="relative inline-block mb-8">
              <!-- Glow effect -->
              <div class="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <!-- Icon container -->
              <div class="relative w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all duration-300">
                <component :is="item.icon" class="w-8 h-8 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />

                <!-- Step number -->
                <div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {{ item.step }}
                </div>
              </div>
            </div>

            <!-- Content -->
            <h3 class="text-lg font-semibold text-white mb-3">
              {{ item.title }}
            </h3>
            <p class="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
