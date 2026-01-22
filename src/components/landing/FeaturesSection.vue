<script setup lang="ts">
import { Timer, Zap, QrCode, Smartphone, Wifi, Clock, Bell, Palette, Users, Monitor } from 'lucide-vue-next'

const features = [
  {
    icon: Timer,
    title: 'Multiple Timer Types',
    description: 'Countdown, count-up, EMOM, Tabata, and interval timers. Configure work and rest periods with custom rounds.',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Changes sync instantly across all connected devices. Everyone sees updates the moment they happen.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: QrCode,
    title: 'QR Code Sharing',
    description: 'Share your timer room with a single QR code. Participants scan and join in seconds without creating an account.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Smartphone,
    title: 'Remote Control',
    description: 'Control all timers from your phone or tablet. Walk around freely while managing the session.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Monitor,
    title: 'Fullscreen Display',
    description: 'Crystal-clear timer display optimized for projectors, TVs, and large screens. Perfect for venues of any size.',
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Visual color changes and optional sound alerts. Green for safe, yellow for warning, red for critical time.',
    gradient: 'from-red-500 to-orange-500'
  },
  {
    icon: Users,
    title: 'Unlimited Viewers',
    description: 'No limit on how many people can view your timer. Perfect for events with hundreds of participants.',
    gradient: 'from-teal-500 to-cyan-500'
  },
  {
    icon: Wifi,
    title: 'Works Offline',
    description: 'PWA support means the app works even without internet. Install it on any device for native-like experience.',
    gradient: 'from-violet-500 to-purple-500'
  }
]
</script>

<template>
  <section id="features" class="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />

    <div class="relative max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">Powerful Features for</span>
          <br />
          <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Professional Sessions</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Everything you need to run perfectly timed events, from small meetings to large conferences.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
        >
          <!-- Icon with gradient background -->
          <div class="relative mb-5">
            <div
              class="absolute inset-0 w-12 h-12 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
              :class="`bg-gradient-to-r ${feature.gradient}`"
            />
            <div class="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <component
                :is="feature.icon"
                class="w-6 h-6 text-white/80"
              />
            </div>
          </div>

          <!-- Content -->
          <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
            {{ feature.title }}
          </h3>
          <p class="text-gray-500 text-sm leading-relaxed">
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
