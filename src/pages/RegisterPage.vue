<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const localError = ref<string | null>(null)

// Mouse glow effect
const formRef = ref<HTMLElement | null>(null)
const glowX = ref(0)
const glowY = ref(0)
const isHovering = ref(false)

// Canvas animation
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null
let ctx: CanvasRenderingContext2D | null = null

// Wave parameters - TOP-DOWN VIEW for full screen coverage
const WAVE_FREQUENCY = 0.6
const WAVE_AMPLITUDE = 0.4
const DOT_COLOR = { r: 239, g: 68, b: 68 }
const GRID_COLS = 180
const GRID_ROWS = 120

interface Distortion {
  x: number
  y: number
  intensity: number
  decay: number
  time: number
}

let distortions: Distortion[] = []
let lastDistortionTime = 0

function initCanvas() {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')
  resizeCanvas()

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!prefersReducedMotion) {
    animate(0)
  } else {
    drawFrame(0)
  }
}

function resizeCanvas() {
  if (!canvasRef.value) return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
}

function drawFrame(time: number) {
  if (!ctx || !canvasRef.value) return

  const width = canvasRef.value.width
  const height = canvasRef.value.height

  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, width, height)

  const t = time / 1000

  if (time - lastDistortionTime > 10000 + Math.random() * 15000) {
    distortions.push({
      x: Math.random() * GRID_COLS,
      y: Math.random() * GRID_ROWS,
      intensity: 0.8 + Math.random() * 0.4,
      decay: 0.994,
      time: time
    })
    lastDistortionTime = time
  }

  distortions = distortions.filter(d => {
    d.intensity *= d.decay
    return d.intensity > 0.01
  })

  // TOP-DOWN VIEW - full screen coverage with extension beyond edges
  const extendX = 0.15
  const extendY = 0.15
  const startX = -width * extendX
  const endX = width * (1 + extendX)
  const startY = -height * extendY
  const endY = height * (1 + extendY)
  const totalWidth = endX - startX
  const totalHeight = endY - startY

  // Cell spacing for grid
  const cellWidth = totalWidth / GRID_COLS
  const cellHeight = totalHeight / GRID_ROWS

  // Draw dots - TOP DOWN VIEW (no perspective compression)
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      // Base position - evenly distributed across entire screen
      const baseX = startX + col * cellWidth + cellWidth / 2
      const baseY = startY + row * cellHeight + cellHeight / 2

      // Calculate wave offset - same wave mechanics
      const wavePhase = (col / GRID_COLS) * Math.PI * 4 + (row / GRID_ROWS) * Math.PI * 2
      let waveOffset = Math.sin(wavePhase + t * WAVE_FREQUENCY) * WAVE_AMPLITUDE

      // Apply distortions - same distortion mechanics
      let distortionOffset = 0
      let distortionGlow = 0
      for (const d of distortions) {
        const dx = col - d.x
        const dy = row - d.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 40
        if (dist < maxDist) {
          const factor = (1 - dist / maxDist) * d.intensity
          distortionOffset += Math.sin(dist * 0.3 - time * 0.002) * factor * 8
          distortionGlow += factor
        }
      }

      // Final position - wave affects Y position (subtle 3D feel)
      const screenX = baseX
      const screenY = baseY + waveOffset * 15 + distortionOffset

      // Skip if outside viewport
      if (screenX < -20 || screenX > width + 20 || screenY < -20 || screenY > height + 20) continue

      // Opacity based on wave height and position
      const normalizedY = row / GRID_ROWS
      const baseOpacity = 0.2 + normalizedY * 0.25 + (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.2
      const finalOpacity = Math.min(0.85, baseOpacity + distortionGlow * 0.4)

      // Dot size - subtle variation based on wave
      const baseSize = 1.0 + normalizedY * 0.8
      const waveSize = 1 + (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.3
      const distortionSize = 1 + distortionGlow * 1.5
      const dotSize = baseSize * waveSize * distortionSize

      // Color with distortion glow effect
      const r = DOT_COLOR.r
      const g = DOT_COLOR.g + distortionGlow * 80
      const b = DOT_COLOR.b + distortionGlow * 120

      ctx!.beginPath()
      ctx!.arc(screenX, screenY, Math.max(0.5, dotSize), 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`
      ctx!.fill()

      // Glow effect for distortions
      if (distortionGlow > 0.1) {
        ctx!.beginPath()
        ctx!.arc(screenX, screenY, dotSize * 2.5, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${r}, ${g + 40}, ${b + 80}, ${distortionGlow * 0.12})`
        ctx!.fill()
      }
    }
  }
}

function animate(time: number) {
  drawFrame(time)
  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  if (!formRef.value) return
  const rect = formRef.value.getBoundingClientRect()
  glowX.value = e.clientX - rect.left
  glowY.value = e.clientY - rect.top
}

function handleMouseEnter() {
  isHovering.value = true
}

function handleMouseLeave() {
  isHovering.value = false
}

async function handleRegister() {
  localError.value = null

  if (!email.value || !password.value) return

  if (password.value !== confirmPassword.value) {
    localError.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    localError.value = 'Password must be at least 6 characters'
    return
  }

  const success = await authStore.signUp(email.value, password.value)
  if (success) {
    router.push('/my-rooms')
  }
}

function goToLogin() {
  router.push('/login')
}

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div class="register-page">
    <!-- Animated dot wave background -->
    <canvas ref="canvasRef" class="wave-canvas"></canvas>

    <!-- Gradient overlay for depth -->
    <div class="depth-overlay"></div>

    <div class="register-container">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <span class="logo-dot"></span>
          <h1 class="logo-text">Chronograph <span class="logo-accent">Pro</span></h1>
        </div>
        <p class="logo-subtitle">All eyes on you when you're in time</p>
      </div>

      <!-- Register Form with Glow Effect -->
      <form
        ref="formRef"
        @submit.prevent="handleRegister"
        class="register-form"
        @mousemove="handleMouseMove"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- Glow overlay -->
        <div
          class="glow-effect"
          :class="{ active: isHovering }"
          :style="{
            '--glow-x': glowX + 'px',
            '--glow-y': glowY + 'px'
          }"
        ></div>

        <div class="form-content">
          <h2 class="form-title">Create account</h2>
          <p class="form-description">Get started with your free account</p>

          <!-- Email -->
          <div class="input-group">
            <label for="email" class="input-label">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="input-field"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div class="input-group">
            <label for="password" class="input-label">Password</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="input-field"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="input-group">
            <label for="confirmPassword" class="input-label">Confirm password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              class="input-field"
              placeholder="Repeat your password"
            />
          </div>

          <!-- Error Message -->
          <div v-if="localError || authStore.error" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ localError || authStore.error }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.loading || !email || !password || !confirmPassword"
            class="submit-button"
          >
            <svg v-if="authStore.loading" class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ authStore.loading ? 'Creating account...' : 'Create Account' }}</span>
          </button>

          <!-- Login Link -->
          <div class="login-link">
            <span>Already have an account?</span>
            <button type="button" class="link-button" @click="goToLogin">
              Sign in
            </button>
          </div>
        </div>
      </form>

      <!-- Back to Home -->
      <router-link to="/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" class="back-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        <span>Back to home</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #080808;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.wave-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.depth-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(8, 8, 8, 0.7) 0%,
    rgba(8, 8, 8, 0.3) 30%,
    rgba(8, 8, 8, 0.1) 50%,
    rgba(8, 8, 8, 0.5) 80%,
    rgba(8, 8, 8, 0.9) 100%
  );
  pointer-events: none;
}

.register-container {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
}

/* Logo Section */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.logo-text {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.logo-accent {
  color: #ef4444;
}

.logo-subtitle {
  font-size: 16px;
  color: #6b7280;
  font-weight: 400;
}

/* Form */
.register-form {
  position: relative;
  background: rgba(17, 17, 17, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.glow-effect {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  background: radial-gradient(
    600px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(239, 68, 68, 0.1),
    transparent 40%
  );
}

.glow-effect.active {
  opacity: 1;
}

.form-content {
  position: relative;
  z-index: 1;
  padding: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.form-description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
}

/* Input Group */
.input-group {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 10px;
}

.input-wrapper {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 16px 20px;
  background: rgba(10, 10, 10, 0.8);
  border: 1px solid #252525;
  border-radius: 12px;
  font-size: 16px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-field::placeholder {
  color: #4b5563;
}

.input-field:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-wrapper .input-field {
  padding-right: 52px;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #ffffff;
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;
  color: #f87171;
  font-size: 14px;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 18px 24px;
  background: #ef4444;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.submit-button:hover:not(:disabled) {
  background: #dc2626;
}

.submit-button:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-button:disabled {
  background: #7f1d1d;
  cursor: not-allowed;
  opacity: 0.7;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-fill {
  opacity: 0.75;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Login Link */
.login-link {
  margin-top: 28px;
  text-align: center;
  font-size: 15px;
  color: #6b7280;
}

.link-button {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  margin-left: 6px;
  transition: color 0.2s ease;
}

.link-button:hover {
  color: #f87171;
}

/* Back Link */
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  color: #4b5563;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #9ca3af;
}

.back-icon {
  width: 16px;
  height: 16px;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .logo-dot {
    animation: none;
  }
  .spinner {
    animation: none;
  }
}
</style>
