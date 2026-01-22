<script setup lang="ts">
import { ref } from 'vue'
import { Timer, Zap, QrCode, Smartphone, Wifi, Bell, Users, Monitor } from 'lucide-vue-next'

const features = [
  {
    icon: Timer,
    title: 'Multiple Timer Types',
    description: 'Countdown, count-up, EMOM, Tabata, and interval timers with custom rounds.'
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Changes sync instantly across all connected devices.'
  },
  {
    icon: QrCode,
    title: 'QR Code Sharing',
    description: 'Share via QR code. Participants join in seconds without an account.'
  },
  {
    icon: Smartphone,
    title: 'Remote Control',
    description: 'Control all timers from your phone. Walk around freely.'
  },
  {
    icon: Monitor,
    title: 'Fullscreen Display',
    description: 'Crystal-clear display optimized for projectors and large screens.'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Visual color changes and sound alerts at critical moments.'
  },
  {
    icon: Users,
    title: 'Unlimited Viewers',
    description: 'No limit on viewers. Perfect for large events.'
  },
  {
    icon: Wifi,
    title: 'Works Offline',
    description: 'PWA support means it works even without internet.'
  }
]

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
</script>

<template>
  <section id="features" class="relative" style="padding: 100px 24px;">
    <div class="w-full max-w-[1200px] mx-auto">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">Powerful Features for</span>
          <br />
          <span class="text-red-500">Professional Sessions</span>
        </h2>
        <p class="section-subtitle">
          Everything you need to run perfectly timed events.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="(feature, index) in features"
          :key="feature.title"
          class="feature-card"
          @mousemove="handleMouseMove(index, $event)"
          @mouseenter="hoveredIndex = index"
          @mouseleave="hoveredIndex = null"
        >
          <!-- Glow effect -->
          <div
            class="card-glow"
            :class="{ active: hoveredIndex === index }"
            :style="{
              '--glow-x': (glowPos[index]?.x || 0) + 'px',
              '--glow-y': (glowPos[index]?.y || 0) + 'px'
            }"
          ></div>

          <div class="relative z-10">
            <!-- Icon -->
            <div class="feature-icon">
              <component :is="feature.icon" class="w-6 h-6 text-red-400" />
            </div>

            <!-- Content -->
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
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

.feature-card {
  position: relative;
  overflow: hidden;
  padding: 28px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  background: radial-gradient(
    400px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(239, 68, 68, 0.15),
    transparent 40%
  );
}

.card-glow.active {
  opacity: 1;
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 14px;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.feature-description {
  font-size: 14px;
  line-height: 1.6;
  color: #9ca3af;
}
</style>
