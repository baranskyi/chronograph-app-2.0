<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const route = useRoute()
const roomCode = (route.params.roomCode as string).toUpperCase()

const authorName = ref('')
const questionText = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref<string | null>(null)
const roomName = ref<string | null>(null)
const roomId = ref<string | null>(null)
const loading = ref(true)

// Canvas animation refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null

// Wave animation constants
const WAVE_FREQUENCY = 0.6
const WAVE_AMPLITUDE = 0.4
const DOT_COLOR = { r: 239, g: 68, b: 68 }
const GRID_COLS = 180
const GRID_ROWS = 120

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    canvas.style.display = 'none'
    return
  }

  let width = window.innerWidth
  let height = window.innerHeight

  const resize = () => {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }
  resize()
  window.addEventListener('resize', resize)

  const TILT_ANGLE = Math.PI / 6 // 30 degrees
  const sinAngle = Math.sin(TILT_ANGLE)

  let time = 0
  const animate = () => {
    ctx.fillStyle = '#080808'
    ctx.fillRect(0, 0, width, height)

    const spacingX = width / (GRID_COLS - 1)
    const spacingY = height / (GRID_ROWS - 1)

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const baseX = col * spacingX
        const baseY = row * spacingY

        const normalizedX = col / GRID_COLS
        const normalizedY = row / GRID_ROWS

        const distortionX = Math.sin((normalizedY * 4 + time * 0.5) * Math.PI) * 0.03 + Math.sin((normalizedX * 6 + time * 0.3) * Math.PI) * 0.02
        const distortionY = Math.cos((normalizedX * 4 + time * 0.4) * Math.PI) * 0.03 + Math.cos((normalizedY * 5 + time * 0.35) * Math.PI) * 0.02

        const distortedX = normalizedX + distortionX
        const distortedY = normalizedY + distortionY

        const wave1 = Math.sin(distortedX * 8 + time) * WAVE_AMPLITUDE
        const wave2 = Math.sin(distortedY * 6 + time * 0.8) * WAVE_AMPLITUDE * 0.8
        const wave3 = Math.sin((distortedX + distortedY) * 4 + time * 1.2) * WAVE_AMPLITUDE * 0.6
        const waveHeight = (wave1 + wave2 + wave3) * WAVE_FREQUENCY

        const tiltedX = baseX
        const tiltedY = baseY + (baseX - width / 2) * sinAngle * 0.3

        const x = tiltedX
        const y = tiltedY + waveHeight * 50

        const brightness = (waveHeight + WAVE_AMPLITUDE * 2) / (WAVE_AMPLITUDE * 4)
        const alpha = 0.15 + brightness * 0.5

        const size = 1.2 + brightness * 1.2

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${DOT_COLOR.r}, ${DOT_COLOR.g}, ${DOT_COLOR.b}, ${alpha})`
        ctx.fill()
      }
    }

    time += 0.015
    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

async function loadRoom() {
  try {
    const { data, error: fetchError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('room_code', roomCode)
      .single()

    if (fetchError || !data) {
      error.value = 'Room not found'
      return
    }

    roomId.value = data.id
    roomName.value = data.name
  } catch (err) {
    error.value = 'Failed to load room'
  } finally {
    loading.value = false
  }
}

async function submitQuestion() {
  if (!authorName.value.trim() || !questionText.value.trim() || !roomId.value) return

  submitting.value = true
  error.value = null

  try {
    const { error: insertError } = await supabase
      .from('questions')
      .insert({
        room_id: roomId.value,
        author_name: authorName.value.trim(),
        question_text: questionText.value.trim(),
        status: 'pending'
      })

    if (insertError) throw insertError

    submitted.value = true
    questionText.value = ''
  } catch (err) {
    error.value = 'Failed to submit question. Please try again.'
  } finally {
    submitting.value = false
  }
}

function askAnother() {
  submitted.value = false
}

onMounted(() => {
  loadRoom()
  initCanvas()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<template>
  <div class="min-h-screen bg-[#080808] text-white relative overflow-hidden">
    <!-- Ocean animation background -->
    <canvas
      ref="canvasRef"
      class="fixed inset-0 z-0"
      style="pointer-events: none;"
    ></canvas>

    <!-- Content -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
      <!-- Loading -->
      <div v-if="loading" class="text-gray-400">Loading...</div>

      <!-- Error -->
      <div v-else-if="error && !roomId" class="text-center">
        <div class="text-red-500 text-xl mb-4">{{ error }}</div>
        <p class="text-gray-500">Room code: {{ roomCode }}</p>
      </div>

      <!-- Success state -->
      <div v-else-if="submitted" class="glass-card text-center" style="max-width: 400px; width: 100%;">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="22,4 12,14.01 9,11.01" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold mb-2" style="margin-top: 16px;">Question Submitted!</h2>
        <p class="text-gray-400 mb-6">Your question has been sent to the moderator.</p>
        <button
          class="ask-another-btn"
          @click="askAnother"
        >
          Ask Another Question
        </button>
      </div>

      <!-- Form -->
      <div v-else class="glass-card" style="max-width: 400px; width: 100%;">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold mb-2">Ask a Question</h1>
          <p class="text-gray-400 text-sm">{{ roomName || roomCode }}</p>
        </div>

        <form @submit.prevent="submitQuestion" class="space-y-4">
          <!-- Name Input -->
          <div>
            <label class="form-label">Your Name</label>
            <input
              v-model="authorName"
              type="text"
              class="glass-input"
              placeholder="Enter your name"
              required
              maxlength="50"
            />
          </div>

          <!-- Question Input -->
          <div>
            <label class="form-label">Your Question</label>
            <textarea
              v-model="questionText"
              class="glass-textarea"
              placeholder="Type your question here..."
              rows="4"
              required
              maxlength="500"
            ></textarea>
            <div class="text-right text-xs text-gray-500 mt-1">
              {{ questionText.length }}/500
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="submit-btn"
            :disabled="submitting || !authorName.trim() || !questionText.trim()"
          >
            <span v-if="submitting">Sending...</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Send Question
            </span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-xs text-gray-600">
        Powered by Chronograph
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-card {
  background: linear-gradient(
    180deg,
    rgba(20, 22, 28, 0.85) 0%,
    rgba(15, 17, 22, 0.9) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  padding: 32px;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.glass-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  color: white;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
}

.glass-input:focus {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.glass-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 14px;
  color: white;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  outline: none;
  resize: none;
  transition: all 0.2s ease;
}

.glass-textarea:focus {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.glass-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.submit-btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.85) 0%,
    rgba(220, 38, 38, 0.95) 100%
  );
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.95) 0%,
    rgba(220, 38, 38, 1) 100%
  );
  box-shadow: 0 6px 24px rgba(239, 68, 68, 0.35);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    180deg,
    rgba(34, 197, 94, 0.2) 0%,
    rgba(22, 163, 74, 0.3) 100%
  );
  border-radius: 50%;
  color: #22c55e;
}

.ask-another-btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ask-another-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}
</style>
