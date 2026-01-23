<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Star } from 'lucide-vue-next'

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

// Social proof stats with animated counter
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
const statsRef = ref<HTMLElement | null>(null)
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
  if (statsRef.value) {
    observer.observe(statsRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Event Coordinator',
    company: 'TechConf Global',
    initials: 'SM',
    text: 'Chronograph.pro transformed how we manage speaker sessions. The real-time sync means our backstage team always knows exactly where we are.'
  },
  {
    name: 'Marcus Chen',
    role: 'Head Pastor',
    company: 'Grace Community',
    initials: 'MC',
    text: 'We use it every Sunday for sermon timing. The visual color alerts help our worship team know when to prepare for transitions.'
  },
  {
    name: 'Elena Rodriguez',
    role: 'CrossFit Coach',
    company: 'Forge Fitness',
    initials: 'ER',
    text: 'Finally, a timer app that understands fitness! The EMOM and Tabata presets are perfect. My clients love the big display.'
  },
  {
    name: 'David Park',
    role: 'Corporate Trainer',
    company: 'LeaderUp Consulting',
    initials: 'DP',
    text: 'I run workshops in different cities every week. The QR code sharing gets participants set up in seconds.'
  },
  {
    name: 'Amanda Foster',
    role: 'Production Manager',
    company: 'Stellar Productions',
    initials: 'AF',
    text: 'The overtime feature and sound alerts are game-changers for live shows. No more awkward speaker overruns.'
  },
  {
    name: 'James Wilson',
    role: 'Studio Owner',
    company: 'Mindful Yoga',
    initials: 'JW',
    text: 'Clean design that fits our studio aesthetic. The timer looks beautiful on our wall-mounted screen.'
  }
]
</script>

<template>
  <section id="testimonials" class="section-wrapper">
    <div class="section-container">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">Trusted by</span>
          <span class="text-red-500"> Professionals</span>
        </h2>
        <p class="section-subtitle">
          See why coaches, event organizers, and trainers love Chronograph.
        </p>
      </div>

      <!-- Social Proof Stats -->
      <div ref="statsRef" class="stats-grid">
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

      <!-- Testimonials Grid -->
      <div class="testimonials-grid">
        <div
          v-for="(testimonial, index) in testimonials"
          :key="testimonial.name"
          class="testimonial-card"
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
            <!-- Rating -->
            <div class="testimonial-rating">
              <Star v-for="i in 5" :key="i" class="w-4 h-4 text-red-400 fill-red-400" />
            </div>

            <!-- Text -->
            <p class="testimonial-text">"{{ testimonial.text }}"</p>

            <!-- Author -->
            <div class="testimonial-author">
              <div class="testimonial-avatar">{{ testimonial.initials }}</div>
              <div>
                <p class="testimonial-name">{{ testimonial.name }}</p>
                <p class="testimonial-role">{{ testimonial.role }}, {{ testimonial.company }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-wrapper {
  position: relative;
  width: 100%;
  padding: 100px 24px;
}

.section-container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;
}

@media (min-width: 768px) {
  .testimonials-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .testimonials-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

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

/* Social Proof Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 64px;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

.stat-card {
  position: relative;
  text-align: center;
  padding: 32px 20px;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
    rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
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
  font-size: clamp(32px, 7vw, 48px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  text-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(255, 255, 255, 0.1);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
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
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.testimonial-card {
  position: relative;
  overflow: hidden;
  padding: 28px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
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

.testimonial-rating {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}

.testimonial-text {
  font-size: 15px;
  line-height: 1.7;
  color: #9ca3af;
  margin-bottom: 20px;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.testimonial-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1));
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

.testimonial-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.testimonial-role {
  font-size: 12px;
  color: #9ca3af;
}
</style>
