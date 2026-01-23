<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Play } from 'lucide-vue-next'

// Animated timer display
const timerValue = ref('05:00')
const timerSeconds = ref(300)
const totalSeconds = 300 // 5 minutes total
const yellowThreshold = 60 // 1 minute
const redThreshold = 30 // 30 seconds
let timerInterval: ReturnType<typeof setInterval> | null = null

function formatTime(totalSecs: number): string {
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Progress bar calculations
const progress = computed(() => {
  const elapsed = totalSeconds - timerSeconds.value
  return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100))
})

const greenWidth = computed(() => {
  const greenSeconds = Math.max(0, totalSeconds - yellowThreshold)
  return (greenSeconds / totalSeconds) * 100
})

const yellowWidth = computed(() => {
  const yellowSeconds = Math.max(0, yellowThreshold - redThreshold)
  return (yellowSeconds / totalSeconds) * 100
})

const redWidth = computed(() => {
  return (redThreshold / totalSeconds) * 100
})

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
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-grid">
        <!-- Left: Text Content -->
        <div class="hero-text">
          <!-- Tagline -->
          <p class="tagline">All eyes on you when you're in time</p>

          <!-- Headline -->
          <h1 class="hero-title">
            <span class="text-white">Control Time.</span>
            <br />
            <span class="text-red-500">Lead Sessions.</span>
          </h1>

          <!-- Subheadline -->
          <p class="hero-subtitle">
            Professional timer system for events, conferences, presentations, and training sessions.
            Create, share, and control timers remotely from any device.
          </p>

          <!-- CTA Buttons -->
          <div class="cta-buttons">
            <RouterLink to="/register" class="cta-button-primary group">
              Start Free
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
            <a href="#how-it-works" class="cta-button-secondary group">
              <Play class="w-5 h-5" />
              See How It Works
            </a>
          </div>

          <!-- Trust line -->
          <p class="trust-line">
            No credit card required. Free plan includes everything you need.
          </p>
        </div>

        <!-- Center: 3D Glass Speaker Figure -->
        <div class="speaker-figure-wrapper">
          <div class="speaker-figure">
            <!-- Glow behind figure -->
            <div class="speaker-glow"></div>

            <!-- Head -->
            <div class="speaker-head">
              <div class="speaker-head-inner"></div>
            </div>

            <!-- Neck -->
            <div class="speaker-neck"></div>

            <!-- Torso -->
            <div class="speaker-torso">
              <div class="speaker-torso-inner"></div>
              <!-- Suit details -->
              <div class="speaker-lapel-left"></div>
              <div class="speaker-lapel-right"></div>
              <div class="speaker-tie"></div>
            </div>

            <!-- Raised Arm (passionate gesture) -->
            <div class="speaker-arm-raised">
              <div class="speaker-forearm-raised"></div>
              <div class="speaker-hand-raised">
                <div class="speaker-finger"></div>
              </div>
            </div>

            <!-- Other Arm -->
            <div class="speaker-arm-down">
              <div class="speaker-forearm-down"></div>
            </div>

            <!-- Hips -->
            <div class="speaker-hips"></div>

            <!-- Legs -->
            <div class="speaker-leg-left"></div>
            <div class="speaker-leg-right"></div>

            <!-- Base/Pedestal -->
            <div class="speaker-base">
              <div class="speaker-base-glow"></div>
            </div>
          </div>
        </div>

        <!-- Right: Timer Preview -->
        <div class="timer-preview-wrapper">
          <!-- Glass card -->
          <div class="timer-preview-card">
            <!-- Glow effect behind -->
            <div class="timer-glow"></div>

            <!-- Card content -->
            <div class="relative z-10">
              <!-- Window controls -->
              <div class="timer-header">
                <div class="flex gap-2">
                  <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span class="text-xs text-gray-500 font-mono">chronograph.pro</span>
                <div class="w-16"></div>
              </div>

              <!-- Timer display -->
              <div class="timer-body">
                <!-- Live badge -->
                <div class="live-badge">
                  <span class="live-dot"></span>
                  Live Session
                </div>

                <!-- Timer value -->
                <div class="timer-value">
                  {{ timerValue }}
                </div>

                <!-- Progress Bar -->
                <div class="preview-progress-container">
                  <!-- Background zones -->
                  <div class="preview-progress-track">
                    <!-- Passed zone (dark) -->
                    <div
                      class="preview-progress-passed"
                      :style="{ width: progress + '%' }"
                    />
                    <!-- Green zone -->
                    <div
                      class="preview-zone-green"
                      :style="{ width: greenWidth + '%' }"
                    />
                    <!-- Yellow zone -->
                    <div
                      class="preview-zone-yellow"
                      :style="{ width: yellowWidth + '%' }"
                    />
                    <!-- Red zone -->
                    <div
                      class="preview-zone-red"
                      :style="{ width: redWidth + '%' }"
                    />
                  </div>
                  <!-- Marker -->
                  <div
                    class="preview-progress-marker"
                    :style="{ left: progress + '%' }"
                  />
                </div>
              </div>

              <!-- Bottom controls -->
              <div class="timer-controls">
                <div class="control-btn">
                  <div class="w-3 h-3 border-l-2 border-t-2 border-gray-500 -rotate-45 translate-x-0.5"></div>
                </div>
                <div class="control-btn-main">
                  <div class="w-0 h-0 border-l-[10px] border-l-red-400 border-y-[6px] border-y-transparent translate-x-0.5"></div>
                </div>
                <div class="control-btn">
                  <div class="w-3 h-3 border-r-2 border-t-2 border-gray-500 rotate-45 -translate-x-0.5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 140px 24px 80px;
}

.hero-container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr auto 1fr;
    gap: 40px;
  }
}

@media (min-width: 1280px) {
  .hero-grid {
    gap: 60px;
  }
}

.hero-text {
  text-align: center;
}

@media (min-width: 1024px) {
  .hero-text {
    text-align: left;
  }
}

.cta-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}

@media (min-width: 640px) {
  .cta-buttons {
    flex-direction: row;
  }
}

@media (min-width: 1024px) {
  .cta-buttons {
    justify-content: flex-start;
  }
}

.timer-preview-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
}

@media (min-width: 1024px) {
  .timer-preview-wrapper {
    justify-content: flex-end;
  }
}

.tagline {
  font-size: 16px;
  color: #d1d5db;
  margin-bottom: 24px;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.hero-title {
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.7;
  color: #e5e7eb;
  max-width: 520px;
  margin: 0 auto;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

@media (min-width: 1024px) {
  .hero-subtitle {
    margin: 0;
  }
}

.cta-button-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 18px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(210, 70, 70, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(239, 68, 68, 0.4);
  transition: all 0.2s ease;
  cursor: pointer;
}

@media (min-width: 640px) {
  .cta-button-primary {
    width: auto;
  }
}

.cta-button-primary:hover {
  background: rgba(230, 80, 80, 0.9);
  box-shadow: 0 8px 40px rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

.cta-button-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 18px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

@media (min-width: 640px) {
  .cta-button-secondary {
    width: auto;
  }
}

.cta-button-secondary:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.trust-line {
  margin-top: 24px;
  font-size: 14px;
  color: #9ca3af;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Timer Preview Card */
.timer-preview-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
}

.timer-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.timer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.timer-body {
  padding: 48px 32px;
  text-align: center;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: 24px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.timer-value {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  font-size: clamp(56px, 12vw, 80px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #ef4444;
  text-shadow: 0 0 60px rgba(239, 68, 68, 0.5), 0 0 120px rgba(239, 68, 68, 0.25);
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}

/* Preview Progress Bar */
.preview-progress-container {
  position: relative;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
}

.preview-progress-track {
  position: relative;
  height: 10px;
  display: flex;
  border-radius: 5px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.preview-progress-passed {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(20, 20, 20, 0.9) 0%,
    rgba(20, 20, 20, 0.8) 100%
  );
  z-index: 2;
  transition: width 0.3s ease;
}

.preview-zone-green {
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  flex-shrink: 0;
}

.preview-zone-yellow {
  background: linear-gradient(180deg, #eab308 0%, #ca8a04 100%);
  flex-shrink: 0;
}

.preview-zone-red {
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
  flex-shrink: 0;
}

.preview-progress-marker {
  position: absolute;
  top: -3px;
  width: 3px;
  height: 16px;
  background: #ffffff;
  border-radius: 2px;
  transform: translateX(-50%);
  box-shadow:
    0 0 8px rgba(255, 255, 255, 0.8),
    0 0 16px rgba(255, 255, 255, 0.5);
  transition: left 0.3s ease;
  z-index: 3;
}

.timer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.control-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.control-btn-main {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
}

/* ============================================
   3D Glass Speaker Figure
   ============================================ */
.speaker-figure-wrapper {
  display: none;
  justify-content: center;
  align-items: flex-end;
  height: 66vh;
  perspective: 1200px;
  position: relative;
}

@media (min-width: 1024px) {
  .speaker-figure-wrapper {
    display: flex;
  }
}

.speaker-figure {
  position: relative;
  width: 140px;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateY(-8deg) rotateX(2deg);
  animation: speaker-float 6s ease-in-out infinite;
}

@keyframes speaker-float {
  0%, 100% {
    transform: rotateY(-8deg) rotateX(2deg) translateY(0);
  }
  50% {
    transform: rotateY(-5deg) rotateX(2deg) translateY(-10px);
  }
}

.speaker-glow {
  position: absolute;
  width: 200%;
  height: 120%;
  left: -50%;
  top: -10%;
  background: radial-gradient(
    ellipse at center,
    rgba(239, 68, 68, 0.2) 0%,
    rgba(239, 68, 68, 0.1) 30%,
    transparent 70%
  );
  filter: blur(40px);
  pointer-events: none;
  animation: glow-pulse 4s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Glass material base */
.speaker-head,
.speaker-neck,
.speaker-torso,
.speaker-arm-raised,
.speaker-forearm-raised,
.speaker-hand-raised,
.speaker-arm-down,
.speaker-forearm-down,
.speaker-hips,
.speaker-leg-left,
.speaker-leg-right,
.speaker-base {
  position: absolute;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.25) 0%,
    rgba(239, 68, 68, 0.15) 50%,
    rgba(239, 68, 68, 0.08) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow:
    inset 0 0 30px rgba(239, 68, 68, 0.15),
    0 0 20px rgba(239, 68, 68, 0.2),
    0 10px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Head */
.speaker-head {
  width: 50px;
  height: 60px;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  border-radius: 50% 50% 45% 45%;
  background: linear-gradient(
    160deg,
    rgba(239, 68, 68, 0.35) 0%,
    rgba(239, 68, 68, 0.2) 40%,
    rgba(239, 68, 68, 0.1) 100%
  );
}

.speaker-head-inner {
  position: absolute;
  width: 70%;
  height: 70%;
  left: 15%;
  top: 15%;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 60%
  );
}

/* Neck */
.speaker-neck {
  width: 22px;
  height: 25px;
  left: 50%;
  top: 55px;
  transform: translateX(-50%);
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.3) 0%,
    rgba(239, 68, 68, 0.15) 100%
  );
}

/* Torso */
.speaker-torso {
  width: 70px;
  height: 110px;
  left: 50%;
  top: 75px;
  transform: translateX(-50%);
  border-radius: 8px 8px 4px 4px;
  clip-path: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%);
  background: linear-gradient(
    170deg,
    rgba(239, 68, 68, 0.3) 0%,
    rgba(239, 68, 68, 0.18) 50%,
    rgba(239, 68, 68, 0.1) 100%
  );
}

.speaker-torso-inner {
  position: absolute;
  width: 80%;
  height: 85%;
  left: 10%;
  top: 8%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%
  );
  border-radius: 6px;
}

/* Suit details */
.speaker-lapel-left,
.speaker-lapel-right {
  position: absolute;
  width: 18px;
  height: 50px;
  top: 5px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.speaker-lapel-left {
  left: 12px;
  transform: skewY(-15deg);
  border-radius: 2px 0 0 2px;
}

.speaker-lapel-right {
  right: 12px;
  transform: skewY(15deg);
  border-radius: 0 2px 2px 0;
}

.speaker-tie {
  position: absolute;
  width: 12px;
  height: 55px;
  left: 50%;
  top: 8px;
  transform: translateX(-50%);
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.5) 0%,
    rgba(239, 68, 68, 0.35) 100%
  );
  clip-path: polygon(30% 0%, 70% 0%, 100% 15%, 60% 100%, 40% 100%, 0% 15%);
  border: 1px solid rgba(239, 68, 68, 0.5);
}

/* Raised arm (passionate gesture) */
.speaker-arm-raised {
  width: 18px;
  height: 55px;
  right: -5px;
  top: 80px;
  transform: rotate(-45deg);
  transform-origin: top center;
  border-radius: 10px;
  animation: arm-gesture 3s ease-in-out infinite;
}

@keyframes arm-gesture {
  0%, 100% {
    transform: rotate(-45deg);
  }
  50% {
    transform: rotate(-55deg);
  }
}

.speaker-forearm-raised {
  width: 16px;
  height: 50px;
  right: -2px;
  top: 48px;
  transform: rotate(-30deg);
  transform-origin: top center;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.3) 0%,
    rgba(239, 68, 68, 0.15) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow:
    inset 0 0 20px rgba(239, 68, 68, 0.15),
    0 0 15px rgba(239, 68, 68, 0.2);
}

.speaker-hand-raised {
  width: 22px;
  height: 20px;
  right: -8px;
  top: 90px;
  border-radius: 5px 5px 8px 8px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.35) 0%,
    rgba(239, 68, 68, 0.2) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow:
    inset 0 0 15px rgba(239, 68, 68, 0.15),
    0 0 20px rgba(239, 68, 68, 0.3);
}

.speaker-finger {
  position: absolute;
  width: 6px;
  height: 18px;
  right: 8px;
  top: -14px;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.4) 0%,
    rgba(239, 68, 68, 0.25) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 3px;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  animation: finger-point 3s ease-in-out infinite;
}

@keyframes finger-point {
  0%, 100% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.7); }
}

/* Down arm */
.speaker-arm-down {
  width: 16px;
  height: 50px;
  left: -3px;
  top: 85px;
  transform: rotate(15deg);
  transform-origin: top center;
  border-radius: 8px;
}

.speaker-forearm-down {
  width: 14px;
  height: 45px;
  left: -1px;
  top: 45px;
  transform: rotate(10deg);
  transform-origin: top center;
  border-radius: 7px;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.25) 0%,
    rgba(239, 68, 68, 0.12) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.35);
  box-shadow:
    inset 0 0 20px rgba(239, 68, 68, 0.1),
    0 0 12px rgba(239, 68, 68, 0.15);
}

/* Hips */
.speaker-hips {
  width: 55px;
  height: 35px;
  left: 50%;
  top: 180px;
  transform: translateX(-50%);
  border-radius: 4px 4px 8px 8px;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.22) 0%,
    rgba(239, 68, 68, 0.12) 100%
  );
}

/* Legs */
.speaker-leg-left,
.speaker-leg-right {
  width: 22px;
  height: 120px;
  top: 210px;
  border-radius: 6px 6px 4px 4px;
}

.speaker-leg-left {
  left: 35px;
  transform: rotate(-2deg);
}

.speaker-leg-right {
  right: 35px;
  transform: rotate(2deg);
}

/* Base/Pedestal */
.speaker-base {
  width: 80px;
  height: 15px;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-radius: 4px;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.35) 0%,
    rgba(239, 68, 68, 0.2) 100%
  );
  box-shadow:
    0 5px 30px rgba(239, 68, 68, 0.4),
    0 10px 60px rgba(239, 68, 68, 0.2);
}

.speaker-base-glow {
  position: absolute;
  width: 150%;
  height: 20px;
  left: -25%;
  bottom: -10px;
  background: radial-gradient(
    ellipse at center,
    rgba(239, 68, 68, 0.4) 0%,
    transparent 70%
  );
  filter: blur(10px);
}

/* Mobile: hide figure, show only on larger screens */
@media (max-width: 1023px) {
  .speaker-figure-wrapper {
    display: none;
  }
}
</style>
