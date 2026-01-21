<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Play, Sparkles } from 'lucide-vue-next'

// Animated timer display
const timerValue = ref('05:00')
const timerSeconds = ref(300)
let timerInterval: ReturnType<typeof setInterval> | null = null

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function animateTimer() {
  timerInterval = setInterval(() => {
    timerSeconds.value = timerSeconds.value > 0 ? timerSeconds.value - 1 : 300
    timerValue.value = formatTime(timerSeconds.value)
  }, 1000)
}

onMounted(() => {
  animateTimer()
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <section class="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 overflow-hidden">
      <!-- Gradient orbs -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;" />
      <div class="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;" />

      <!-- Grid pattern -->
      <div
        class="absolute inset-0 opacity-[0.02]"
        style="background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 60px 60px;"
      />
    </div>

    <div class="relative max-w-7xl mx-auto w-full">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <!-- Left: Text Content -->
        <div class="text-center lg:text-left">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 mb-8">
            <Sparkles class="w-4 h-4" />
            <span>Free for coaches and trainers</span>
          </div>

          <!-- Headline -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            <span class="text-white">Professional</span>
            <br />
            <span class="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Timer System
            </span>
          </h1>

          <!-- Subheadline -->
          <p class="text-lg sm:text-xl text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Create multiple timers, share with clients via QR code, and control everything remotely. Built for gyms, CrossFit boxes, and personal trainers.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <RouterLink
              to="/register"
              class="group relative w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started Free
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
            <RouterLink
              to="/app"
              class="group w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play class="w-5 h-5" />
              Try Demo
            </RouterLink>
          </div>

          <!-- Trust line -->
          <p class="mt-8 text-sm text-gray-500">
            No credit card required
          </p>
        </div>

        <!-- Right: Timer Preview -->
        <div class="relative">
          <!-- Glow effect behind card -->
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl scale-110" />

          <!-- Glass card -->
          <div class="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <!-- Window controls -->
            <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500/80" />
                <div class="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div class="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span class="text-xs text-gray-500 font-mono">chronograph.pro</span>
              <div class="w-16" />
            </div>

            <!-- Timer display -->
            <div class="p-8 sm:p-12 lg:p-16">
              <div class="text-center">
                <!-- Timer label -->
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 mb-6">
                  <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  EMOM Timer
                </div>

                <!-- Timer value -->
                <div
                  class="timer-font text-6xl sm:text-7xl lg:text-8xl font-bold text-green-400 mb-4"
                  style="text-shadow: 0 0 60px rgba(34, 197, 94, 0.4), 0 0 120px rgba(34, 197, 94, 0.2);"
                >
                  {{ timerValue }}
                </div>

                <!-- Round indicator -->
                <p class="text-gray-500 text-sm">
                  Round <span class="text-white font-medium">1</span> of <span class="text-white font-medium">10</span>
                </p>
              </div>
            </div>

            <!-- Bottom controls preview -->
            <div class="px-6 py-4 border-t border-white/5 flex items-center justify-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <div class="w-3 h-3 border-l-2 border-t-2 border-gray-500 -rotate-45 translate-x-0.5" />
              </div>
              <div class="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <div class="w-0 h-0 border-l-[10px] border-l-green-400 border-y-[6px] border-y-transparent translate-x-0.5" />
              </div>
              <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <div class="w-3 h-3 border-r-2 border-t-2 border-gray-500 rotate-45 -translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
