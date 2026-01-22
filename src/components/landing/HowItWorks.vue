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
    description: 'Add countdown, EMOM, Tabata, or stopwatch timers. Configure rounds and rest periods.'
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
  <section id="how-it-works" class="relative" style="padding: 100px 24px;">
    <div class="w-full max-w-[1200px] mx-auto">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">How it</span>
          <span class="text-red-500"> works</span>
        </h2>
        <p class="section-subtitle">
          Get started in under a minute. No complex setup.
        </p>
      </div>

      <!-- Steps -->
      <div class="relative">
        <!-- Connection line (desktop) -->
        <div class="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          <div
            v-for="item in steps"
            :key="item.step"
            class="step-card"
          >
            <!-- Icon container -->
            <div class="step-icon-wrapper">
              <div class="step-icon">
                <component :is="item.icon" class="w-7 h-7 text-gray-400 group-hover:text-red-400 transition-colors" />
              </div>
              <!-- Step number -->
              <div class="step-number">{{ item.step }}</div>
            </div>

            <!-- Content -->
            <h3 class="step-title">{{ item.title }}</h3>
            <p class="step-description">{{ item.description }}</p>
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
  color: #6b7280;
  max-width: 500px;
  margin: 0 auto;
}

.step-card {
  text-align: center;
}

.step-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}

.step-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.step-card:hover .step-icon {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.step-card:hover .step-icon svg {
  color: #ef4444;
}

.step-number {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.step-description {
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  max-width: 260px;
  margin: 0 auto;
}
</style>
