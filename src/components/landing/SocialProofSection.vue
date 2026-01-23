<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Stat {
  value: number
  suffix: string
  label: string
  decimals?: number
}

const stats: Stat[] = [
  { value: 34902, suffix: '', label: 'Hours Tracked' },
  { value: 1272, suffix: '', label: 'Rooms Created' },
  { value: 99.92, suffix: '%', label: 'Uptime Cumulative', decimals: 2 }
]

const displayValues = ref<number[]>([0, 0, 0])
const hasAnimated = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function animateCountUp(index: number, target: number, duration: number) {
  const startTime = performance.now()

  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easeOutQuart(progress)

    displayValues.value[index] = easedProgress * target

    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      displayValues.value[index] = target
    }
  }

  requestAnimationFrame(update)
}

function startAnimation() {
  if (hasAnimated.value) return
  hasAnimated.value = true

  stats.forEach((stat, index) => {
    animateCountUp(index, stat.value, 2000)
  })
}

function formatNumber(value: number, decimals: number = 0): string {
  if (decimals > 0) {
    return value.toFixed(decimals)
  }
  return Math.floor(value).toLocaleString()
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startAnimation()
        }
      })
    },
    { threshold: 0.3 }
  )

  if (sectionRef.value) {
    observer.observe(sectionRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <section ref="sectionRef" class="social-proof-section">
    <div class="social-proof-container">
      <div class="stats-grid">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          class="stat-card"
        >
          <div class="stat-value">
            {{ formatNumber(displayValues[index] || 0, stat.decimals ?? 0) }}{{ stat.suffix }}
          </div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.social-proof-section {
  position: relative;
  width: 100%;
  padding: 60px 24px;
}

.social-proof-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
}

.stat-card {
  position: relative;
  text-align: center;
  padding: 40px 24px;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
    rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 40px rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
}

.stat-value {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: clamp(36px, 8vw, 56px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  text-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(255, 255, 255, 0.1);
  letter-spacing: -0.02em;
  margin-bottom: 12px;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 16px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .social-proof-section {
    padding: 40px 16px;
  }

  .stat-card {
    padding: 32px 20px;
  }

  .stat-label {
    font-size: 14px;
  }
}
</style>
