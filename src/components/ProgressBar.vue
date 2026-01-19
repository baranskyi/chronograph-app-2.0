<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalSeconds: number
  remainingSeconds: number
  yellowThreshold?: number  // percentage when yellow zone starts (e.g., 30 = 30%)
  redThreshold?: number     // percentage when red zone starts (e.g., 10 = 10%)
}

const props = withDefaults(defineProps<Props>(), {
  yellowThreshold: 30,
  redThreshold: 10
})

// Progress as percentage (0-100)
const progress = computed(() => {
  if (props.totalSeconds <= 0) return 0
  const elapsed = props.totalSeconds - props.remainingSeconds
  return Math.min(100, Math.max(0, (elapsed / props.totalSeconds) * 100))
})

// Zone widths (from left to right: passed, green, yellow, red)
const passedWidth = computed(() => `${progress.value}%`)
const greenWidth = computed(() => `${100 - props.yellowThreshold}%`)
const yellowWidth = computed(() => `${props.yellowThreshold - props.redThreshold}%`)
const redWidth = computed(() => `${props.redThreshold}%`)

// Marker position (at the edge of passed area)
const markerPosition = computed(() => `${progress.value}%`)
</script>

<template>
  <div class="progress-bar-container relative h-5 rounded overflow-hidden">
    <!-- Background zones (static) -->
    <div class="absolute inset-0 flex">
      <!-- Passed zone (dark) -->
      <div
        class="bg-[#1a1a1a] transition-all duration-300 ease-out"
        :style="{ width: passedWidth }"
      />
      <!-- Green zone -->
      <div
        class="bg-emerald-500 flex-shrink-0"
        :style="{ width: greenWidth }"
      />
      <!-- Yellow zone -->
      <div
        class="bg-amber-500 flex-shrink-0"
        :style="{ width: yellowWidth }"
      />
      <!-- Red zone -->
      <div
        class="bg-red-500 flex-shrink-0"
        :style="{ width: redWidth }"
      />
    </div>

    <!-- Marker (triangle) -->
    <div
      class="absolute top-0 -translate-x-1/2 transition-all duration-300 ease-out z-10"
      :style="{ left: markerPosition }"
    >
      <div class="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
    </div>
  </div>
</template>

<style scoped>
.progress-bar-container {
  min-height: 20px;
}
</style>
