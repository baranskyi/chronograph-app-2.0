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
    <!-- SVG Filter for lens distortion effect -->
    <svg class="absolute w-0 h-0">
      <defs>
        <filter id="lens-distortion" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feDisplacementMap in="SourceGraphic" in2="blur" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <!-- Background zones (static) -->
    <div class="absolute inset-0 flex rounded-lg overflow-hidden">
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

    <!-- Glassmorphism Triangle Marker with Lens Effect -->
    <div
      class="glass-marker absolute -translate-x-1/2 transition-all duration-300 ease-out z-10"
      :style="{ left: markerPosition, top: '-6px' }"
    >
      <!-- Water droplet distortion effect under triangle -->
      <div class="lens-distortion"></div>

      <!-- Glass triangle -->
      <div class="glass-triangle">
        <!-- Inner glow -->
        <div class="glass-triangle-inner"></div>
        <!-- Reflection line -->
        <div class="glass-reflection"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-bar-container {
  min-height: 20px;
}

/* Glassmorphism marker container */
.glass-marker {
  width: 28px;
  height: 32px;
  pointer-events: none;
}

/* Lens distortion effect - water droplet */
.lens-distortion {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 16px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 40%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(1px);
  animation: lens-pulse 2s ease-in-out infinite;
}

@keyframes lens-pulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-50%) scale(1.1);
    opacity: 1;
  }
}

/* Glass triangle with glassmorphism */
.glass-triangle {
  position: relative;
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 18px solid rgba(255, 255, 255, 0.45);
  filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.35))
          drop-shadow(0 0 12px rgba(255, 255, 255, 0.2));
}

/* Inner triangle for depth effect */
.glass-triangle-inner {
  position: absolute;
  top: -16px;
  left: -10px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 14px solid rgba(255, 255, 255, 0.25);
}

/* Reflection highlight on glass */
.glass-reflection {
  position: absolute;
  top: -15px;
  left: -6px;
  width: 8px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  border-radius: 1px;
  transform: rotate(-30deg);
}

/* Add subtle glow animation */
.glass-triangle::after {
  content: '';
  position: absolute;
  top: -18px;
  left: -14px;
  width: 28px;
  height: 18px;
  background: radial-gradient(
    ellipse at 50% 100%,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: triangle-glow 3s ease-in-out infinite;
}

@keyframes triangle-glow {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
