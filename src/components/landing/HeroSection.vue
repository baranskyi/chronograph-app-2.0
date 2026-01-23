<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Play } from 'lucide-vue-next'

// Rotating headline phrases
const phrases = ['Lead Sessions.', 'Engage People.', 'Control Discussion.']
const currentPhraseIndex = ref(0)
const isAnimating = ref(false)
let phraseInterval: ReturnType<typeof setInterval> | null = null

function rotatePhrase() {
  isAnimating.value = true
  setTimeout(() => {
    currentPhraseIndex.value = (currentPhraseIndex.value + 1) % phrases.length
    setTimeout(() => {
      isAnimating.value = false
    }, 50)
  }, 400)
}

// Chat bubbles
const chatMessages = [
  'Wrap up, man, 30 seconds left!',
  'What a speech! People are going crazy!!',
  'Return to the red dot on the floor, camera working!',
  'OMG! OMG!! OMFG!!!',
  'Good luck with the speech, they\'ll love it!'
]

interface ChatBubble {
  id: number
  message: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right'
  size: 'small' | 'medium' | 'large'
}

const activeBubbles = ref<ChatBubble[]>([])
let bubbleId = 0
let bubbleInterval: ReturnType<typeof setInterval> | null = null
let currentMessageIndex = 0

const positions: ChatBubble['position'][] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right']
const sizes: ChatBubble['size'][] = ['small', 'medium', 'large']

function getAvailablePositions(): ChatBubble['position'][] {
  const occupiedPositions = activeBubbles.value.map(b => b.position)
  return positions.filter(p => !occupiedPositions.includes(p))
}

function spawnBubble() {
  // Get available positions (not occupied by current bubbles)
  const available = getAvailablePositions()
  if (available.length === 0) return // No free positions, skip this spawn

  const id = bubbleId++
  const message: string = chatMessages[currentMessageIndex] || 'Great job!'
  currentMessageIndex = (currentMessageIndex + 1) % chatMessages.length

  // Pick from available positions only
  const posIndex = Math.floor(Math.random() * available.length)
  const sizeIndex = Math.floor(Math.random() * sizes.length)
  const position: ChatBubble['position'] = available[posIndex] || 'top-right'
  const size: ChatBubble['size'] = sizes[sizeIndex] || 'medium'

  const bubble: ChatBubble = { id, message, position, size }
  activeBubbles.value.push(bubble)

  // Remove bubble after 4-5 seconds
  setTimeout(() => {
    activeBubbles.value = activeBubbles.value.filter(b => b.id !== id)
  }, 4000 + Math.random() * 1000)
}

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
  // Start phrase rotation after 2 seconds, then every 2 seconds
  phraseInterval = setInterval(rotatePhrase, 2000)
  // Start bubble spawning - first one immediately, then every 3 seconds
  spawnBubble()
  bubbleInterval = setInterval(spawnBubble, 3000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (phraseInterval) clearInterval(phraseInterval)
  if (bubbleInterval) clearInterval(bubbleInterval)
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
            <span class="rotating-phrase" :class="{ 'is-animating': isAnimating }">
              {{ phrases[currentPhraseIndex] }}
            </span>
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

        <!-- Right: Timer Preview -->
        <div class="timer-preview-wrapper">
          <!-- Chat Bubbles -->
          <TransitionGroup name="bubble">
            <div
              v-for="bubble in activeBubbles"
              :key="bubble.id"
              class="chat-bubble"
              :class="[`bubble-${bubble.position}`, `bubble-${bubble.size}`]"
            >
              <span class="bubble-text">{{ bubble.message }}</span>
            </div>
          </TransitionGroup>

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
  gap: 64px;
  align-items: center;
}

@media (min-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr 1fr;
    gap: 96px;
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

/* Rotating phrase animation */
.rotating-phrase {
  display: inline-block;
  color: #ef4444;
  white-space: nowrap;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
  opacity: 1;
  filter: blur(0);
}

.rotating-phrase.is-animating {
  transform: translateY(20px);
  opacity: 0;
  filter: blur(8px);
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

/* Chat Bubbles - Comic style with inner glow */
.chat-bubble {
  position: absolute;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(239, 68, 68, 0.08) 0%, transparent 50%),
    rgba(20, 20, 25, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 14px 18px;
  max-width: 260px;
  z-index: 20;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 30px rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  will-change: opacity;
}


.bubble-text {
  color: #f5f5f5;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Bubble sizes */
.bubble-small {
  max-width: 220px;
  padding: 12px 16px;
}

.bubble-small .bubble-text {
  font-size: 13px;
}

.bubble-medium {
  max-width: 260px;
}

.bubble-large {
  max-width: 300px;
  padding: 16px 20px;
}

.bubble-large .bubble-text {
  font-size: 18px;
}

/* Bubble positions with tails pointing to timer */
.bubble-top-left {
  top: -40px;
  left: -120px;
}


.bubble-top-right {
  top: -50px;
  right: -100px;
}


.bubble-bottom-left {
  bottom: 60px;
  left: -140px;
}


.bubble-bottom-right {
  bottom: 40px;
  right: -120px;
}


.bubble-left {
  top: calc(50% - 30px);
  left: -160px;
}


.bubble-right {
  top: calc(40% - 30px);
  right: -140px;
}


/* Bubble transitions - opacity only, no jumping */
.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.5s ease;
}

.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
}

.bubble-enter-to,
.bubble-leave-from {
  opacity: 1;
}

/* Mobile adjustments - position bubbles inside the card area */
@media (max-width: 1023px) {
  .chat-bubble {
    max-width: 160px;
    padding: 8px 12px;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
  }

  .bubble-text {
    font-size: 11px;
  }

  .bubble-small .bubble-text,
  .bubble-large .bubble-text {
    font-size: 11px;
  }

  .bubble-top-left,
  .bubble-top-right {
    top: -50px;
  }

  .bubble-bottom-left,
  .bubble-bottom-right {
    bottom: -50px;
    top: auto;
  }

  .bubble-left {
    top: -70px;
  }

  .bubble-right {
    bottom: -70px;
    top: auto;
  }
}

</style>
