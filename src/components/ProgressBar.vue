<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalSeconds: number
  remainingSeconds: number
  yellowThreshold?: number  // seconds remaining when yellow zone starts
  redThreshold?: number     // seconds remaining when red zone starts
}

const props = withDefaults(defineProps<Props>(), {
  yellowThreshold: 60,
  redThreshold: 30
})

// Progress as percentage (0-100)
const progress = computed(() => {
  if (props.totalSeconds <= 0) return 0
  const elapsed = props.totalSeconds - props.remainingSeconds
  return Math.min(100, Math.max(0, (elapsed / props.totalSeconds) * 100))
})

// Calculate zone widths based on seconds thresholds
// Green: from 0 to (totalSeconds - yellowThreshold)
// Yellow: from (totalSeconds - yellowThreshold) to (totalSeconds - redThreshold)
// Red: from (totalSeconds - redThreshold) to totalSeconds
const greenWidth = computed(() => {
  if (props.totalSeconds <= 0) return '0%'
  const greenSeconds = Math.max(0, props.totalSeconds - props.yellowThreshold)
  return `${(greenSeconds / props.totalSeconds) * 100}%`
})

const yellowWidth = computed(() => {
  if (props.totalSeconds <= 0) return '0%'
  const yellowSeconds = Math.max(0, props.yellowThreshold - props.redThreshold)
  return `${(yellowSeconds / props.totalSeconds) * 100}%`
})

const redWidth = computed(() => {
  if (props.totalSeconds <= 0) return '0%'
  return `${(props.redThreshold / props.totalSeconds) * 100}%`
})

const passedWidth = computed(() => `${progress.value}%`)

// Marker position (at the edge of passed area)
const markerPosition = computed(() => `${progress.value}%`)
</script>

<template>
  <div class="progress-bar-container relative h-5 rounded-lg overflow-visible">
    <!-- Background zones (static) -->
    <div class="absolute inset-0 flex rounded-lg overflow-hidden">
      <!-- Passed zone (dark) -->
      <div
        class="passed-zone transition-all duration-300 ease-out"
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

    <!-- Glowing Line Marker -->
    <div
      class="progress-marker absolute transition-all duration-300 ease-out"
      :style="{ left: markerPosition }"
    >
      <!-- Main vertical line -->
      <div class="marker-line"></div>
      <!-- Top glow dot -->
      <div class="marker-dot-top"></div>
      <!-- Bottom glow dot -->
      <div class="marker-dot-bottom"></div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar-container {
  min-height: 20px;
}

/* Passed zone with subtle gradient edge */
.passed-zone {
  background: linear-gradient(
    90deg,
    #1a1a1a 0%,
    #1a1a1a calc(100% - 4px),
    rgba(26, 26, 26, 0.8) 100%
  );
}

/* Glowing line marker */
.progress-marker {
  top: -4px;
  bottom: -4px;
  width: 3px;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

/* Main vertical line */
.marker-line {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 1) 50%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-radius: 1px;
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.8),
    0 0 16px rgba(255, 255, 255, 0.5),
    0 0 24px rgba(255, 255, 255, 0.3);
  animation: line-glow 2s ease-in-out infinite;
}

/* Top glowing dot */
.marker-dot-top {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  transform: translateX(-50%);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.8) 40%,
    transparent 70%
  );
  border-radius: 50%;
  box-shadow:
    0 0 6px rgba(255, 255, 255, 0.9),
    0 0 12px rgba(255, 255, 255, 0.6);
}

/* Bottom glowing dot */
.marker-dot-bottom {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  transform: translateX(-50%);
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.8) 40%,
    transparent 70%
  );
  border-radius: 50%;
  box-shadow:
    0 0 6px rgba(255, 255, 255, 0.9),
    0 0 12px rgba(255, 255, 255, 0.6);
}

/* Subtle pulsing glow */
@keyframes line-glow {
  0%, 100% {
    box-shadow:
      0 0 8px rgba(255, 255, 255, 0.8),
      0 0 16px rgba(255, 255, 255, 0.5),
      0 0 24px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow:
      0 0 10px rgba(255, 255, 255, 0.9),
      0 0 20px rgba(255, 255, 255, 0.6),
      0 0 30px rgba(255, 255, 255, 0.4);
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .marker-line {
    animation: none;
  }
}
</style>
