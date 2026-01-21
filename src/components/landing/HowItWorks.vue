<script setup lang="ts">
import { FolderPlus, Plus, Share2, PlayCircle } from 'lucide-vue-next'

const steps = [
  {
    icon: FolderPlus,
    step: 1,
    title: 'Create a room',
    description: 'Sign up and create your first room. Each room gets a unique code for sharing.'
  },
  {
    icon: Plus,
    step: 2,
    title: 'Add timers',
    description: 'Add as many timers as you need. Choose from EMOM, Tabata, Countdown, Stopwatch, and more.'
  },
  {
    icon: Share2,
    step: 3,
    title: 'Share with clients',
    description: 'Share the viewer link or QR code. Clients see your timers without needing an account.'
  },
  {
    icon: PlayCircle,
    step: 4,
    title: 'Control from anywhere',
    description: 'Start, pause, and reset timers from your phone. Everyone sees changes instantly.'
  }
]
</script>

<template>
  <section id="how-it-works" class="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
    <div class="max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-2xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4">
          How it works
        </h2>
        <p class="text-muted-foreground text-lg">
          Get started in under a minute. No complex setup required.
        </p>
      </div>

      <!-- Steps -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div
          v-for="item in steps"
          :key="item.step"
          class="relative text-center"
        >
          <!-- Step number -->
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary mb-6">
            <component :is="item.icon" class="w-7 h-7 text-primary" />
          </div>

          <!-- Connector line (hidden on last item and mobile) -->
          <div
            v-if="item.step < 4"
            class="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-border"
          />

          <h3 class="text-lg font-semibold mb-2">
            <span class="text-primary">{{ item.step }}.</span> {{ item.title }}
          </h3>
          <p class="text-muted-foreground text-sm">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
