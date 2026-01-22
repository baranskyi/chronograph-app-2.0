<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import ProgressBar from '../components/ProgressBar.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { Play, Pause, Settings, MoreHorizontal, Plus, GripVertical, Link2, RotateCcw, ArrowLeft, X, Send, QrCode } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

// Question type for Q&A feature
interface Question {
  id: string
  room_id: string
  author_name: string
  question_text: string
  status: 'pending' | 'sent' | 'dismissed'
  created_at: string
}

const router = useRouter()
const route = useRoute()

const timerStore = useTimerStore()
const roomStore = useRoomStore()
const authStore = useAuthStore()

// Get roomCode from route params
const props = defineProps<{
  roomCode?: string
}>()

declare const __APP_VERSION__: string
const APP_VERSION = __APP_VERSION__

const showSettings = ref(false)
const isInitializing = ref(true)
const initError = ref<string | null>(null)
const customMessage = ref('')
const messageTargetTimerId = ref<string | null>(null)
const messageSplash = ref(false)
const pingMs = ref<number | null>(null)
const editingTimerId = ref<string | null>(null)
const editingTimerName = ref('')
const deleteConfirmTimerId = ref<string | null>(null)
const draggedTimerId = ref<string | null>(null)
const dragOverTimerId = ref<string | null>(null)

// Share button state - global toast at bottom center
const showShareToast = ref(false)

// Ocean animation toggle - persist to localStorage
const OCEAN_STORAGE_KEY = 'chronograph-ocean-enabled'
const oceanEnabled = ref(localStorage.getItem(OCEAN_STORAGE_KEY) !== 'false')

// Q&A Feature state
const showQRCode = ref(false)
const qrCodeDataUrl = ref<string | null>(null)
const questions = ref<Question[]>([])
const sendingQuestionId = ref<string | null>(null)
const showQuestionTargetDropdown = ref(false)

// Custom dropdown state for "Send to" selector
const isTargetDropdownOpen = ref(false)
const targetDropdownRef = ref<HTMLElement | null>(null)

// Computed for selected timer display
const selectedTargetLabel = computed(() => {
  if (messageTargetTimerId.value === null) return 'All timers'
  const timer = timerStore.timerList.find(t => t.id === messageTargetTimerId.value)
  return timer?.name || 'All timers'
})

// Computed for Q&A URL
const askPageUrl = computed(() => {
  return `${window.location.origin}/ask/${roomStore.roomId}`
})

function selectTarget(timerId: string | null) {
  messageTargetTimerId.value = timerId
  isTargetDropdownOpen.value = false
}

function handleTargetDropdownClickOutside(e: MouseEvent) {
  if (targetDropdownRef.value && !targetDropdownRef.value.contains(e.target as Node)) {
    isTargetDropdownOpen.value = false
  }
}

// Canvas animation for ocean background
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null

// Wave animation constants - same as Login/Register
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

// Glow effect for side panels
const leftPanelRef = ref<HTMLElement | null>(null)
const rightPanelRef = ref<HTMLElement | null>(null)
const leftGlowX = ref(0)
const leftGlowY = ref(0)
const rightGlowX = ref(0)
const rightGlowY = ref(0)
const isLeftHovering = ref(false)
const isRightHovering = ref(false)

function handleLeftPanelMouseMove(e: MouseEvent) {
  if (!leftPanelRef.value) return
  const rect = leftPanelRef.value.getBoundingClientRect()
  leftGlowX.value = e.clientX - rect.left
  leftGlowY.value = e.clientY - rect.top
}

function handleRightPanelMouseMove(e: MouseEvent) {
  if (!rightPanelRef.value) return
  const rect = rightPanelRef.value.getBoundingClientRect()
  rightGlowX.value = e.clientX - rect.left
  rightGlowY.value = e.clientY - rect.top
}

// Refresh connection by reloading the page
function refreshConnection() {
  window.location.reload()
}

function toggleOcean() {
  oceanEnabled.value = !oceanEnabled.value
  // Save preference to localStorage
  localStorage.setItem(OCEAN_STORAGE_KEY, String(oceanEnabled.value))
  if (oceanEnabled.value) {
    initCanvas()
  } else {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    // Clear canvas to black
    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#080808'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }
}

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

  const resizeCanvas = () => {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const distortions: Distortion[] = []
  let lastDistortionTime = 0

  function animate(time: number) {
    ctx!.clearRect(0, 0, width, height)

    // Distortion spawning - 3x more frequent, 2x more likely in center
    if (time - lastDistortionTime > 3333 + Math.random() * 5000) {
      let x, y
      if (Math.random() < 0.66) {
        x = GRID_COLS * 0.25 + Math.random() * GRID_COLS * 0.5
        y = GRID_ROWS * 0.25 + Math.random() * GRID_ROWS * 0.5
      } else {
        x = Math.random() * GRID_COLS
        y = Math.random() * GRID_ROWS
      }
      distortions.push({
        x,
        y,
        intensity: 0.8 + Math.random() * 0.4,
        decay: 0.994,
        time: time
      })
      lastDistortionTime = time
    }

    for (let i = distortions.length - 1; i >= 0; i--) {
      const d = distortions[i]
      if (d) {
        d.intensity *= d.decay
        if (d.intensity < 0.01) {
          distortions.splice(i, 1)
        }
      }
    }

    // 30-DEGREE TILT perspective
    const TILT_ANGLE = 30 * Math.PI / 180
    const perspectiveMin = 0.4
    const perspectiveMax = 1.3
    const extendX = 0.5
    const extendYTop = 0.8
    const extendYBottom = 0.3
    const centerX = width / 2
    const centerY = height / 2

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const nx = col / (GRID_COLS - 1)
        const ny = row / (GRID_ROWS - 1)

        const perspectiveScale = perspectiveMin + ny * (perspectiveMax - perspectiveMin)

        const baseX = (nx - 0.5) * width * (1 + extendX * 2)
        const baseY = -height * extendYTop + ny * height * (1 + extendYTop + extendYBottom)

        const perspX = centerX + baseX * perspectiveScale
        const perspY = centerY + (baseY - centerY) * perspectiveScale * Math.cos(TILT_ANGLE)

        const wavePhase = (col / GRID_COLS) * Math.PI * 4 + (row / GRID_ROWS) * Math.PI * 2
        let waveOffset = Math.sin(wavePhase + time * 0.001 * WAVE_FREQUENCY) * WAVE_AMPLITUDE

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

        const screenX = perspX
        const screenY = perspY + waveOffset * 20 * perspectiveScale + distortionOffset

        if (screenX < -30 || screenX > width + 30 || screenY < -30 || screenY > height + 30) continue

        const depthFade = 0.15 + ny * 0.5
        const waveBonus = (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.2
        const finalOpacity = Math.min(0.9, depthFade + waveBonus + distortionGlow * 0.4)

        const baseSize = (0.6 + ny * 1.4) * perspectiveScale * 0.7
        const waveSize = 1 + (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.25
        const distortionSize = 1 + distortionGlow * 1.5
        const dotSize = baseSize * waveSize * distortionSize

        const r = DOT_COLOR.r
        const g = DOT_COLOR.g + distortionGlow * 80
        const b = DOT_COLOR.b + distortionGlow * 120

        ctx!.beginPath()
        ctx!.arc(screenX, screenY, Math.max(0.4, dotSize), 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`
        ctx!.fill()

        if (distortionGlow > 0.1) {
          ctx!.beginPath()
          ctx!.arc(screenX, screenY, dotSize * 2.5, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${r}, ${g + 40}, ${b + 80}, ${distortionGlow * 0.12})`
          ctx!.fill()
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

// Current time for clock display
const currentTime = ref(new Date())
let clockInterval: number | null = null

onMounted(async () => {
  try {
    // Get roomCode from props (URL param) or route params
    const roomCode = props.roomCode || (route.params.roomCode as string)

    if (!roomCode) {
      // No room code - redirect to my-rooms
      router.push('/my-rooms')
      return
    }

    // Ensure auth is initialized before connecting (for token to be available)
    if (authStore.loading) {
      await authStore.initialize()
    }

    // Join the room as controller
    const success = await roomStore.joinRoomAsController(roomCode)
    if (!success) {
      // Room not found or not authorized - redirect to my-rooms
      initError.value = 'Room not found or you do not have access'
      setTimeout(() => router.push('/my-rooms'), 2000)
      isInitializing.value = false
      return
    }

    timerStore.syncTimerOrder()

    // Fetch room's database ID for Q&A feature
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single()

    if (roomData) {
      roomDbId.value = roomData.id
      // Load existing questions and subscribe to new ones
      await loadQuestions()
      subscribeToQuestions()
    }

    // Check if a specific timer was requested via query param
    const requestedTimerId = route.query.timer as string | undefined
    if (requestedTimerId) {
      // Wait a tick for timers to be loaded, then select the requested timer
      setTimeout(() => {
        timerStore.selectTimer(requestedTimerId)
      }, 100)
    }

    isInitializing.value = false
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    initError.value = `Failed to initialize room: ${errorMessage}`
    isInitializing.value = false
  }
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleTargetDropdownClickOutside)

  // Update clock every second
  clockInterval = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // Measure ping every 5 seconds
  const measurePing = async () => {
    const start = performance.now()
    try {
      await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' })
      pingMs.value = Math.round(performance.now() - start)
    } catch {
      pingMs.value = null
    }
  }
  measurePing()
  window.setInterval(measurePing, 5000)

  // Initialize ocean animation only if enabled
  if (oceanEnabled.value) {
    initCanvas()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleTargetDropdownClickOutside)
  roomStore.disconnect()
  if (clockInterval) clearInterval(clockInterval)
  if (animationId) cancelAnimationFrame(animationId)
})

watch(() => timerStore.selectedTimer, () => {
  if (timerStore.selectedTimerId) {
    roomStore.broadcastTimerState(timerStore.selectedTimerId)
  }
}, { deep: true })

// Sync timer order when timers change
watch(() => timerStore.timerList.length, () => {
  timerStore.syncTimerOrder()
})

// Format duration as MM:SS
const formatDuration = (seconds: number) => {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleOpenSettings(timerId?: string) {
  if (timerId) timerStore.selectTimer(timerId)
  showSettings.value = true
}

async function handleAddTimer() {
  await roomStore.createTimer(`Timer ${timerStore.timerList.length + 1}`)
}

function startEditingTimer(timerId: string, currentName: string, event: Event) {
  event.stopPropagation()
  editingTimerId.value = timerId
  editingTimerName.value = currentName
}

async function saveTimerName(timerId: string) {
  if (editingTimerName.value.trim()) {
    await roomStore.renameTimer(timerId, editingTimerName.value.trim())
  }
  editingTimerId.value = null
  editingTimerName.value = ''
}

function cancelEditingTimer() {
  editingTimerId.value = null
  editingTimerName.value = ''
}

function showDeleteConfirm(timerId: string, event: Event) {
  event.stopPropagation()
  deleteConfirmTimerId.value = timerId
}

async function confirmDeleteTimer() {
  if (deleteConfirmTimerId.value) {
    await roomStore.deleteTimer(deleteConfirmTimerId.value)
    deleteConfirmTimerId.value = null
  }
}

function cancelDelete() {
  deleteConfirmTimerId.value = null
}

function handleDragStart(timerId: string, event: DragEvent) {
  draggedTimerId.value = timerId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', timerId)
  }
}

function handleDragOver(timerId: string, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverTimerId.value = timerId
}

function handleDragLeave() {
  dragOverTimerId.value = null
}

function handleDrop(targetTimerId: string, event: DragEvent) {
  event.preventDefault()
  if (draggedTimerId.value && draggedTimerId.value !== targetTimerId) {
    timerStore.reorderTimers(draggedTimerId.value, targetTimerId)
  }
  draggedTimerId.value = null
  dragOverTimerId.value = null
}

function handleDragEnd() {
  draggedTimerId.value = null
  dragOverTimerId.value = null
}

// Share button handler - simple copy with global toast
function handleShareClick(timerId: string, event: Event) {
  event.stopPropagation()
  const url = roomStore.getTimerShareUrl(timerId)
  if (!url) return
  navigator.clipboard.writeText(url)
  showShareToast.value = true
  setTimeout(() => {
    showShareToast.value = false
  }, 5000)
}

// Calculate progress percentage for timer row
function getTimerProgress(timer: { remainingSeconds: number; settings: { duration: number } }): number {
  const elapsed = timer.settings.duration - timer.remainingSeconds
  return Math.min(100, Math.max(0, (elapsed / timer.settings.duration) * 100))
}

function sendCustomMessage() {
  if (customMessage.value.trim()) {
    roomStore.sendMessage(customMessage.value.trim(), 5000, 'normal', messageTargetTimerId.value, messageSplash.value)
    customMessage.value = ''
  }
}

// Q&A Functions
// Get room database ID for Q&A
const roomDbId = ref<string | null>(null)

async function generateQRCode() {
  showQRCode.value = !showQRCode.value
  if (showQRCode.value && !qrCodeDataUrl.value) {
    // Use room code for URL (user-friendly)
    const askUrl = `${window.location.origin}/ask/${roomStore.roomId}`
    qrCodeDataUrl.value = await QRCode.toDataURL(askUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#00000000'
      }
    })
  }
}

async function loadQuestions() {
  if (!roomDbId.value) return
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('room_id', roomDbId.value)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (!error && data) {
    questions.value = data
  }
}

function subscribeToQuestions() {
  if (!roomDbId.value) return

  const channel = supabase
    .channel('questions-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'questions',
        filter: `room_id=eq.${roomDbId.value}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newQuestion = payload.new as Question
          if (newQuestion.status === 'pending') {
            questions.value.unshift(newQuestion)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Question
          if (updated.status !== 'pending') {
            questions.value = questions.value.filter(q => q.id !== updated.id)
          }
        } else if (payload.eventType === 'DELETE') {
          const deleted = payload.old as Question
          questions.value = questions.value.filter(q => q.id !== deleted.id)
        }
      }
    )
    .subscribe()

  return channel
}

async function sendQuestion(questionId: string, timerId: string | null) {
  sendingQuestionId.value = questionId
  const question = questions.value.find(q => q.id === questionId)
  if (!question) return

  // Send as message to speaker
  const messageText = `${question.author_name}: ${question.question_text}`
  roomStore.sendMessage(messageText, 8000, 'normal', timerId, false)

  // Update question status
  await supabase
    .from('questions')
    .update({ status: 'sent', sent_at: new Date().toISOString(), target_timer_id: timerId })
    .eq('id', questionId)

  questions.value = questions.value.filter(q => q.id !== questionId)
  sendingQuestionId.value = null
  showQuestionTargetDropdown.value = false
}

async function dismissQuestion(questionId: string) {
  await supabase
    .from('questions')
    .update({ status: 'dismissed' })
    .eq('id', questionId)

  questions.value = questions.value.filter(q => q.id !== questionId)
}

async function play(id: string) {
  // Use server-side timer control
  await roomStore.startTimerOnServer(id)
}

async function pause(id: string) {
  // Use server-side timer control
  await roomStore.pauseTimerOnServer(id)
}

async function reset(id: string) {
  // Use server-side timer control
  await roomStore.resetTimerOnServer(id)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  const id = timerStore.selectedTimerId
  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (id) timerStore.timers.get(id)?.status === 'running' ? pause(id) : play(id)
      break
    case 'r': if (id) reset(id); break
    case 'f': toggleFullscreen(); break
    case 'escape':
      if (showSettings.value) showSettings.value = false
      else if (isFullscreen.value) exitFullscreen()
      break
    case 'b': roomStore.toggleBlackout(); break
  }
}

const colorClass = (id: string) => {
  const state = timerStore.getColorState(id)
  return state === 'green' ? 'text-emerald-400' : state === 'yellow' ? 'text-amber-400' : 'text-red-400'
}

</script>

<template>
  <div class="h-screen bg-[#080808] text-white flex flex-col overflow-hidden relative">
    <!-- Ocean Animation Canvas -->
    <canvas
      ref="canvasRef"
      class="fixed inset-0 w-full h-full pointer-events-none"
      style="z-index: 0;"
    ></canvas>

    <!-- Depth overlay -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" style="z-index: 1;"></div>

    <!-- Loading -->
    <div v-if="isInitializing" class="flex-1 flex items-center justify-center relative" style="z-index: 2;">
      <div class="text-xl font-semibold text-gray-400">Loading Chronograph Pro...</div>
    </div>

    <!-- Error -->
    <div v-else-if="initError" class="flex-1 flex flex-col items-center justify-center gap-4 relative" style="z-index: 2;">
      <div class="text-red-400">{{ initError }}</div>
      <button class="px-4 py-2 bg-white/10 rounded hover:bg-white/20" @click="$router.push('/')">Go Home</button>
    </div>

    <!-- Main Dashboard -->
    <template v-else>
      <!-- Top Header - Glassmorphism -->
      <header class="h-14 flex-shrink-0 glass-header flex items-center gap-4 relative" style="padding: 0 24px; z-index: 10;">
        <button
          class="p-2 glass-button-subtle rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          @click="router.push('/my-rooms')"
          title="Back to rooms"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <h1 class="text-xl font-bold flex items-center gap-2">
          <span class="logo-pulse"></span>
          <span>Chronograph <span class="text-red-500">Pro</span></span>
        </h1>
        <div class="text-gray-500 text-sm">|</div>
        <div class="flex flex-col">
          <div class="font-medium text-sm leading-tight">{{ roomStore.roomName || 'Room' }}</div>
          <div class="text-xs text-gray-500 font-mono">{{ roomStore.roomId }}</div>
        </div>

        <div class="flex-1" />
        <button class="p-2 glass-button-subtle rounded-lg hover:bg-white/10 cursor-pointer" @click="toggleFullscreen">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </header>

      <!-- 3-Column Layout -->
      <div class="flex flex-1 overflow-hidden relative" style="z-index: 2;">
        <!-- LEFT: Preview Panel - Glassmorphism with Glow -->
        <div
          ref="leftPanelRef"
          class="w-[300px] glass-panel flex flex-col py-4 relative overflow-hidden"
          style="padding-left: 20px; padding-right: 20px;"
          @mousemove="handleLeftPanelMouseMove"
          @mouseenter="isLeftHovering = true"
          @mouseleave="isLeftHovering = false"
        >
          <!-- Glow effect -->
          <div
            class="glow-effect"
            :class="{ active: isLeftHovering }"
            :style="{
              '--glow-x': leftGlowX + 'px',
              '--glow-y': leftGlowY + 'px'
            }"
          ></div>
          <!-- Timer Name - Large, left-aligned, with double spacing from header -->
          <h2 class="text-2xl font-bold text-gray-100 truncate relative z-10" style="margin-top: 24px; margin-bottom: 32px;">
            {{ timerStore.selectedTimer?.name || 'Timer' }}
          </h2>

          <!-- Big Time Display - Top aligned with double spacing -->
          <div class="flex flex-col items-center gap-6 relative z-10">

            <!-- Section 1: ON AIR Badge -->
            <div v-if="timerStore.selectedTimer">
              <span
                class="text-xs font-bold rounded-md transition-colors"
                :class="timerStore.selectedTimer.status === 'running'
                  ? 'on-air-badge-active'
                  : 'bg-transparent border border-gray-500 text-gray-500'"
                style="padding: 8px 16px;"
              >ON AIR</span>
            </div>

            <!-- Section 2: Timer Display -->
            <div
              v-if="timerStore.selectedTimer"
              class="text-[4.5rem] font-mono font-bold tabular-nums leading-none"
              :class="colorClass(timerStore.selectedTimerId!)"
            >
              {{ timerStore.getFormattedTime(timerStore.selectedTimerId!) }}
            </div>
            <div v-else class="text-4xl text-gray-500">--:--</div>

            <!-- Section 3: Progress Bar with markers -->
            <div class="w-full" v-if="timerStore.selectedTimer">
              <!-- Start and End times ABOVE the bar -->
              <div class="flex justify-between text-xs text-gray-500 mb-2">
                <span>00:00</span>
                <span>{{ formatDuration(timerStore.selectedTimer.settings.duration) }}</span>
              </div>

              <!-- Progress Bar -->
              <div style="position: relative;">
                <ProgressBar
                  :total-seconds="timerStore.selectedTimer.settings.duration"
                  :remaining-seconds="timerStore.selectedTimer.remainingSeconds"
                  :yellow-threshold="timerStore.selectedTimer.settings.yellowThreshold"
                  :red-threshold="timerStore.selectedTimer.settings.redThreshold"
                />

                <!-- Yellow threshold marker - line from bar to label -->
                <div
                  class="flex flex-col items-center"
                  :style="{ position: 'absolute', top: '100%', left: `${((timerStore.selectedTimer.settings.duration - timerStore.selectedTimer.settings.yellowThreshold) / timerStore.selectedTimer.settings.duration) * 100}%`, transform: 'translateX(-50%)' }"
                >
                  <div class="w-px bg-amber-500" style="height: 20px;"></div>
                  <span class="text-xs text-amber-500 mt-1">
                    {{ formatDuration(timerStore.selectedTimer.settings.duration - timerStore.selectedTimer.settings.yellowThreshold) }}
                  </span>
                </div>

                <!-- Red threshold marker - line from bar to label (longer line for second row) -->
                <div
                  class="flex flex-col items-center"
                  :style="{ position: 'absolute', top: '100%', left: `${((timerStore.selectedTimer.settings.duration - timerStore.selectedTimer.settings.redThreshold) / timerStore.selectedTimer.settings.duration) * 100}%`, transform: 'translateX(-50%)' }"
                >
                  <div class="w-px bg-red-500" style="height: 40px;"></div>
                  <span class="text-xs text-red-500 mt-1">
                    {{ formatDuration(timerStore.selectedTimer.settings.duration - timerStore.selectedTimer.settings.redThreshold) }}
                  </span>
                </div>
              </div>

              <!-- Spacer for markers below -->
              <div style="height: 60px;"></div>
            </div>

            <!-- Section 5: Color Legend -->
            <div class="flex justify-center gap-6 text-xs" v-if="timerStore.selectedTimer">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-sm bg-emerald-500"></div>
                <span class="text-gray-400">On time</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-sm bg-amber-500"></div>
                <span class="text-gray-400">Warning</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-sm bg-red-500"></div>
                <span class="text-gray-400">Wrap up</span>
              </div>
            </div>

            <!-- Connection Status -->
            <div class="flex items-center justify-center gap-2 text-sm mt-8">
              <span class="text-gray-400">Connection:</span>
              <span
                v-if="roomStore.viewerCount > 0"
                class="px-2 py-0.5 rounded text-black font-medium"
                style="background-color: #22c55e;"
              >in progress</span>
              <span
                v-else
                class="px-2 py-0.5 rounded text-black font-medium"
                style="background-color: #eab308;"
              >waiting</span>
            </div>

          </div>
        </div>

        <!-- CENTER: Timers Panel -->
        <div class="flex-1 flex flex-col py-4" style="padding-left: 24px; padding-right: 24px;">
          <!-- Timers Header with Ocean Toggle and Action Buttons -->
          <div class="flex items-center justify-between" style="margin-top: 24px; margin-bottom: 48px;">
            <!-- Left: Title and Ocean toggle -->
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-bold text-gray-100">Timers</h2>
              <!-- Ocean toggle button -->
              <button
                class="ocean-toggle-btn"
                :title="oceanEnabled ? 'Hide ocean animation' : 'Show ocean animation'"
                @click="toggleOcean"
              >
                <!-- Eye-off icon (shown when ocean is ON) -->
                <svg v-if="oceanEnabled" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                <!-- Eye icon (shown when ocean is OFF) -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <!-- Right: Action Buttons -->
            <div class="flex items-center gap-3">
              <!-- Blackout Button - Dark, fixed width -->
              <button
                class="blackout-button flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-all cursor-pointer"
                :class="{ 'blackout-active': roomStore.isBlackout }"
                style="padding: 10px 20px; min-width: 120px;"
                @click="roomStore.toggleBlackout()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!roomStore.isBlackout" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path v-if="roomStore.isBlackout" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{{ roomStore.isBlackout ? 'Show' : 'Blackout' }}</span>
              </button>

              <!-- Add Timer Button - same fixed width -->
              <button
                class="glass-button-red flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-all cursor-pointer"
                style="padding: 10px 20px; min-width: 120px;"
                @click="handleAddTimer"
              >
                <Plus class="w-4 h-4" />
                <span>Add Timer</span>
              </button>
            </div>
          </div>

          <!-- Timer List - Bigger items -->
          <div class="flex-1 overflow-y-auto flex flex-col" style="gap: 24px;">
            <div
              v-for="timer in timerStore.orderedTimerList"
              :key="timer.id"
              class="glass-timer-item relative flex items-center rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
              :class="[
                timerStore.selectedTimerId === timer.id ? 'glass-timer-selected' : '',
                timer.status === 'running' ? 'glass-timer-running' : '',
                draggedTimerId === timer.id ? 'opacity-50 scale-[0.98]' : '',
                dragOverTimerId === timer.id && draggedTimerId !== timer.id ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-transparent' : ''
              ]"
              style="padding: 20px 24px; flex-shrink: 0;"
              draggable="true"
              @click="timerStore.selectTimer(timer.id)"
              @dragstart="handleDragStart(timer.id, $event)"
              @dragend="handleDragEnd"
              @dragover="handleDragOver(timer.id, $event)"
              @dragleave="handleDragLeave"
              @drop="handleDrop(timer.id, $event)"
            >
              <!-- Progress overlay for running timer -->
              <div
                v-if="timer.status === 'running'"
                class="absolute inset-0 timer-progress-overlay transition-all duration-200 pointer-events-none"
                :style="{ width: getTimerProgress(timer) + '%' }"
              ></div>

              <!-- Drag Handle -->
              <div class="relative z-10 p-2 mr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors">
                <GripVertical class="w-5 h-5" />
              </div>

              <!-- Timer Name (Editable) -->
              <div class="relative z-10 text-base font-semibold">
                <input
                  v-if="editingTimerId === timer.id"
                  v-model="editingTimerName"
                  type="text"
                  class="bg-black/30 border border-red-500/50 rounded-lg px-3 py-2 text-base w-full max-w-[240px] focus:outline-none focus:border-red-500"
                  @click.stop
                  @blur="saveTimerName(timer.id)"
                  @keydown.enter="saveTimerName(timer.id)"
                  @keydown.escape="cancelEditingTimer"
                  autofocus
                />
                <span
                  v-else
                  class="cursor-text hover:text-red-300 transition-colors"
                  @click="startEditingTimer(timer.id, timer.name, $event)"
                >
                  {{ timer.name }}
                </span>
              </div>

              <!-- Spacer -->
              <div class="relative z-10 flex-1" />

              <!-- Duration - 2x larger, more spacing from buttons (inline style because CSS reset overrides Tailwind) -->
              <div
                class="relative z-10 text-3xl font-mono font-bold"
                :class="colorClass(timer.id)"
                style="margin-right: 32px;"
              >
                {{ formatDuration(timer.remainingSeconds) }}
              </div>

              <!-- Controls - Bigger -->
              <div class="relative z-10 flex items-center gap-3">
                <button
                  class="p-3 rounded-xl glass-button-subtle hover:bg-white/10 min-h-12 min-w-12 touch-manipulation active:scale-95 flex items-center justify-center cursor-pointer"
                  @click.stop="reset(timer.id)"
                  title="Reset"
                >
                  <RotateCcw class="w-5 h-5" />
                </button>
                <button
                  class="p-3 rounded-xl glass-button-subtle hover:bg-white/10 min-h-12 min-w-12 touch-manipulation active:scale-95 flex items-center justify-center cursor-pointer"
                  @click.stop="handleOpenSettings(timer.id)"
                  title="Settings"
                >
                  <Settings class="w-5 h-5" />
                </button>
                <button
                  class="play-pause-btn p-3 rounded-xl min-h-12 min-w-12 touch-manipulation flex items-center justify-center cursor-pointer"
                  :class="timer.status === 'running' ? 'is-playing' : 'is-paused'"
                  @click.stop="timer.status === 'running' ? pause(timer.id) : play(timer.id)"
                  :title="timer.status === 'running' ? 'Pause' : 'Play'"
                >
                  <Transition name="icon-morph" mode="out-in">
                    <Pause v-if="timer.status === 'running'" class="w-5 h-5" key="pause" />
                    <Play v-else class="w-5 h-5" key="play" />
                  </Transition>
                </button>
                <button
                  class="p-3 rounded-xl glass-button-subtle hover:bg-white/10 min-h-12 min-w-12 touch-manipulation active:scale-95 flex items-center justify-center cursor-pointer"
                  @click="handleShareClick(timer.id, $event)"
                  title="Copy viewer link"
                >
                  <Link2 class="w-5 h-5" />
                </button>
                <button
                  class="p-3 rounded-xl glass-button-subtle hover:bg-white/10 min-h-12 min-w-12 touch-manipulation active:scale-95 flex items-center justify-center cursor-pointer"
                  @click="showDeleteConfirm(timer.id, $event)"
                  title="Delete timer"
                >
                  <MoreHorizontal class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Messages Panel - Glassmorphism with Glow -->
        <div
          ref="rightPanelRef"
          class="w-[300px] glass-panel flex flex-col py-4 relative overflow-hidden"
          style="padding-left: 20px; padding-right: 20px;"
          @mousemove="handleRightPanelMouseMove"
          @mouseenter="isRightHovering = true"
          @mouseleave="isRightHovering = false"
        >
          <!-- Glow effect -->
          <div
            class="glow-effect"
            :class="{ active: isRightHovering }"
            :style="{
              '--glow-x': rightGlowX + 'px',
              '--glow-y': rightGlowY + 'px'
            }"
          ></div>

          <!-- Messages Header - Same style as timer name in left panel -->
          <h2 class="text-2xl font-bold text-gray-100 truncate relative z-10" style="margin-top: 24px; margin-bottom: 24px;">
            Message to Speaker
          </h2>

          <!-- Message Form - Redesigned -->
          <div class="flex-1 flex flex-col relative z-10 overflow-y-auto" style="padding-bottom: 16px;">
            <!-- Timer Target Selector - Custom Glassmorphism Dropdown -->
            <div class="form-group">
              <label class="form-label">Send to</label>
              <div ref="targetDropdownRef" class="custom-dropdown">
                <!-- Dropdown Trigger -->
                <button
                  type="button"
                  class="dropdown-trigger"
                  :class="{ open: isTargetDropdownOpen }"
                  @click.stop="isTargetDropdownOpen = !isTargetDropdownOpen"
                >
                  <span class="dropdown-value">{{ selectedTargetLabel }}</span>
                  <span class="dropdown-arrow" :class="{ rotated: isTargetDropdownOpen }">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </button>

                <!-- Dropdown Menu -->
                <Transition name="dropdown">
                  <div v-if="isTargetDropdownOpen" class="dropdown-menu">
                    <button
                      type="button"
                      class="dropdown-option"
                      :class="{ selected: messageTargetTimerId === null }"
                      @click="selectTarget(null)"
                    >
                      <span>All timers</span>
                      <svg v-if="messageTargetTimerId === null" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button
                      v-for="timer in timerStore.orderedTimerList"
                      :key="timer.id"
                      type="button"
                      class="dropdown-option"
                      :class="{ selected: messageTargetTimerId === timer.id }"
                      @click="selectTarget(timer.id)"
                    >
                      <span>{{ timer.name }}</span>
                      <svg v-if="messageTargetTimerId === timer.id" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Message Textarea - Glassmorphism -->
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea
                v-model="customMessage"
                placeholder="Type your message..."
                rows="4"
                class="glass-textarea"
              ></textarea>
            </div>

            <!-- Splash Toggle - Round iOS-style -->
            <label class="toggle-container">
              <span class="toggle-label">Make a splash</span>
              <div class="toggle-switch" :class="{ active: messageSplash }">
                <input
                  v-model="messageSplash"
                  type="checkbox"
                  class="toggle-input"
                />
                <div class="toggle-track">
                  <div class="toggle-thumb"></div>
                </div>
              </div>
            </label>

            <!-- Send Button -->
            <button
              class="send-button"
              @click="sendCustomMessage"
            >
              <span>Send Message</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <!-- Q&A Section Divider -->
            <div class="qa-divider">
              <span class="qa-divider-line"></span>
              <span class="qa-divider-text">Audience Q&A</span>
              <span class="qa-divider-line"></span>
            </div>

            <!-- QR Code Toggle Button -->
            <button
              class="qr-toggle-button"
              :class="{ active: showQRCode }"
              @click="generateQRCode"
            >
              <QrCode class="w-4 h-4" />
              <span>{{ showQRCode ? 'Hide QR Code' : 'Show QR Code' }}</span>
            </button>

            <!-- QR Code Display -->
            <Transition name="qr-expand">
              <div v-if="showQRCode && qrCodeDataUrl" class="qr-code-container">
                <img :src="qrCodeDataUrl" alt="Scan to ask a question" class="qr-code-image" />
                <p class="qr-code-hint">Scan to ask a question</p>
                <p class="qr-code-url">{{ askPageUrl }}</p>
              </div>
            </Transition>

            <!-- Questions List -->
            <div v-if="questions.length > 0" class="questions-list">
              <div class="questions-header">
                <span class="questions-count">{{ questions.length }}</span>
                <span>Pending Questions</span>
              </div>
              <div class="questions-scroll">
                <div
                  v-for="question in questions"
                  :key="question.id"
                  class="question-card"
                >
                  <div class="question-author">{{ question.author_name }}</div>
                  <div class="question-text">{{ question.question_text }}</div>
                  <div class="question-actions">
                    <button
                      class="question-action-btn question-send-btn"
                      :disabled="sendingQuestionId === question.id"
                      @click="sendQuestion(question.id, messageTargetTimerId)"
                    >
                      <Send class="w-3.5 h-3.5" />
                      <span>{{ sendingQuestionId === question.id ? 'Sending...' : `Send to ${selectedTargetLabel}` }}</span>
                    </button>
                    <button
                      class="question-action-btn question-dismiss-btn"
                      @click="dismissQuestion(question.id)"
                      title="Dismiss question"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Status Bar - Glassmorphism like my-rooms -->
      <footer class="flex-shrink-0 glass-footer flex items-center justify-between relative" style="padding: 12px 24px; z-index: 10;">
        <span class="text-xs text-gray-500">
          chronograph.pro · v{{ APP_VERSION }} · <span class="text-gray-600">&#10003;</span> {{ pingMs !== null ? pingMs + ' ms' : '...' }}
        </span>

        <!-- Time Server Status -->
        <div class="flex items-center gap-2">
          <div class="time-server-status" :class="{ connected: roomStore.isConnected, disconnected: !roomStore.isConnected }">
            <span class="status-dot"></span>
            <span class="status-label">Time Server:</span>
            <span class="status-value">{{ roomStore.isConnected ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <button
            v-if="!roomStore.isConnected"
            class="refresh-btn"
            @click="refreshConnection"
            title="Reconnect to server"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </footer>
    </template>

    <!-- Modals -->
    <SettingsPanel v-model:open="showSettings" />

    <!-- Delete Confirmation Dialog - iOS Style Glassmorphism -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="deleteConfirmTimerId"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          @click="cancelDelete"
        >
          <div
            class="ios-dialog"
            @click.stop
          >
            <!-- Icon -->
            <div class="ios-dialog-icon">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <!-- Title -->
            <h3 class="ios-dialog-title">Delete Timer</h3>

            <!-- Description -->
            <p class="ios-dialog-description">
              Are you sure you want to delete this timer? This action cannot be undone.
            </p>

            <!-- Buttons - iOS style stacked -->
            <div class="ios-dialog-buttons">
              <button
                class="ios-dialog-button ios-dialog-button-cancel"
                @click="cancelDelete"
              >
                Cancel
              </button>
              <button
                class="ios-dialog-button ios-dialog-button-destructive"
                @click="confirmDeleteTimer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Global Toast - Black Bottle Glass Effect -->
    <Teleport to="body">
      <Transition name="glass-toast">
        <div
          v-if="showShareToast"
          class="glass-toast-container fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
        >
          <div class="glass-toast">
            <span class="glass-toast-text">Link copied</span>
            <span class="glass-toast-highlight"></span>
            <span class="glass-toast-reflection"></span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Glassmorphism base styles */
.glass-header {
  background: rgba(8, 8, 8, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* Time Server Status */
.time-server-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.time-server-status.connected {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.time-server-status.disconnected {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.time-server-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.time-server-status.connected .status-dot {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
}

.time-server-status.disconnected .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  animation: pulse-disconnect 1.5s ease-in-out infinite;
}

@keyframes pulse-disconnect {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
  }
  50% {
    opacity: 0.5;
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
  }
}

.time-server-status .status-label {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.time-server-status.connected .status-value {
  color: #22c55e;
  font-weight: 600;
}

.time-server-status.disconnected .status-value {
  color: #ef4444;
  font-weight: 600;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
  transform: rotate(90deg);
}

.refresh-btn:active {
  transform: rotate(180deg);
}

.glass-footer {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-panel:last-child {
  border-right: none;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

/* Glow effect for panels */
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

/* Glass buttons */
.glass-button-subtle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-button-red {
  background: rgba(210, 70, 70, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.glass-button-red:hover {
  background: rgba(230, 80, 80, 0.7);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.glass-button-green {
  background: rgba(34, 197, 94, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
  color: white;
}

.glass-button-green:hover {
  background: rgba(34, 197, 94, 0.75);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
}

.glass-button-amber {
  background: rgba(245, 158, 11, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
  color: black;
}

.glass-button-amber:hover {
  background: rgba(245, 158, 11, 0.85);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.3);
}

/* Play/Pause Button with Color Morphing */
.play-pause-btn {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition:
    background-color 280ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 150ms ease-out,
    color 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.play-pause-btn:active {
  transform: scale(0.92);
}

/* Paused state (green - Play button) */
.play-pause-btn.is-paused {
  background: rgba(34, 197, 94, 0.6);
  box-shadow:
    0 4px 15px rgba(34, 197, 94, 0.25),
    0 0 0 0 rgba(34, 197, 94, 0);
  color: white;
}

.play-pause-btn.is-paused:hover {
  background: rgba(34, 197, 94, 0.75);
  box-shadow:
    0 6px 25px rgba(34, 197, 94, 0.35),
    0 0 20px rgba(34, 197, 94, 0.15);
}

/* Playing state (amber - Pause button) */
.play-pause-btn.is-playing {
  background: rgba(245, 158, 11, 0.7);
  box-shadow:
    0 4px 15px rgba(245, 158, 11, 0.25),
    0 0 0 0 rgba(245, 158, 11, 0);
  color: black;
  animation: pulse-amber 2s ease-in-out infinite;
}

.play-pause-btn.is-playing:hover {
  background: rgba(245, 158, 11, 0.85);
  box-shadow:
    0 6px 25px rgba(245, 158, 11, 0.35),
    0 0 20px rgba(245, 158, 11, 0.2);
}

/* Pulse animation for playing state */
@keyframes pulse-amber {
  0%, 100% {
    box-shadow:
      0 4px 15px rgba(245, 158, 11, 0.25),
      0 0 0 0 rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow:
      0 4px 20px rgba(245, 158, 11, 0.35),
      0 0 15px rgba(245, 158, 11, 0.2);
  }
}

/* Icon morph transition */
.icon-morph-enter-active {
  transition: all 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-morph-leave-active {
  transition: all 120ms cubic-bezier(0.4, 0, 1, 1);
}

.icon-morph-enter-from {
  opacity: 0;
  transform: scale(0.6) rotate(-15deg);
}

.icon-morph-leave-to {
  opacity: 0;
  transform: scale(0.6) rotate(15deg);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .play-pause-btn {
    transition: none;
  }
  .play-pause-btn.is-playing {
    animation: none;
  }
  .icon-morph-enter-active,
  .icon-morph-leave-active {
    transition: opacity 100ms ease;
  }
  .icon-morph-enter-from,
  .icon-morph-leave-to {
    transform: none;
  }
}

/* Timer items */
.glass-timer-item {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}

.glass-timer-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.glass-timer-selected {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.1);
}

.glass-timer-running {
  border-color: rgba(239, 68, 68, 0.2);
}

.timer-progress-overlay {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
}

/* iOS-style Delete Dialog */
.ios-dialog {
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 320px;
  max-width: calc(100vw - 48px);
  text-align: center;
  overflow: hidden;
}

.ios-dialog-icon {
  padding: 28px 24px 16px;
  display: flex;
  justify-content: center;
}

.ios-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  padding: 0 24px;
  margin-bottom: 8px;
}

.ios-dialog-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 24px 24px;
  line-height: 1.5;
}

.ios-dialog-buttons {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.ios-dialog-button {
  padding: 16px 24px;
  font-size: 17px;
  font-weight: 400;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.ios-dialog-button:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ios-dialog-button-cancel {
  color: #3b82f6;
  font-weight: 600;
}

.ios-dialog-button-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
}

.ios-dialog-button-destructive {
  color: #ef4444;
}

.ios-dialog-button-destructive:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Dialog animation */
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.25s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .ios-dialog,
.dialog-leave-to .ios-dialog {
  transform: scale(0.9);
  opacity: 0;
}

/* Black Bottle Glass Toast */
.glass-toast-container {
  perspective: 300px;
}

.glass-toast {
  position: relative;
  padding: 14px 28px;
  border-radius: 12px;
  overflow: hidden;

  /* Black bottle glass - translucent but clearly black */
  background: linear-gradient(
    180deg,
    rgba(40, 45, 50, 0.75) 0%,
    rgba(25, 28, 32, 0.82) 30%,
    rgba(15, 18, 22, 0.88) 60%,
    rgba(10, 12, 15, 0.92) 100%
  );

  /* Glass border - subtle light edges */
  border: 1px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.15);
  border-left-color: rgba(255, 255, 255, 0.08);
  border-right-color: rgba(0, 0, 0, 0.3);
  border-bottom-color: rgba(0, 0, 0, 0.4);

  /* Glass depth and glow */
  box-shadow:
    /* Inner top light - refraction */
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    /* Inner bottom shadow */
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    /* Outer shadow for depth */
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3),
    /* Subtle edge glow */
    0 0 1px rgba(255, 255, 255, 0.1);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.glass-toast-text {
  position: relative;
  z-index: 2;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.9);
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.5),
    0 0 8px rgba(255, 255, 255, 0.1);
}

/* Top glossy highlight - light on glass */
.glass-toast-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.04) 50%,
    transparent 100%
  );
  border-radius: 11px 11px 50% 50%;
  pointer-events: none;
}

/* Small reflection spot */
.glass-toast-reflection {
  position: absolute;
  top: 5px;
  left: 16px;
  width: 12px;
  height: 5px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}

/* Smooth glass toast animation */
.glass-toast-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(24px) scale(0.92);
}

.glass-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px) scale(0.96);
}

/* ON AIR badge with smooth pulse animation */
.on-air-badge-active {
  background-color: #dc2626;
  color: white;
  animation: on-air-pulse 2s ease-in-out infinite;
}

@keyframes on-air-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.6);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 16px rgba(220, 38, 38, 0.9);
  }
}

/* Logo pulse - bright red circle */
.logo-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.8);
  animation: logo-pulse 3s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

/* ========================================
   MESSAGE TO SPEAKER - FORM STYLES
   ======================================== */

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

/* Custom Glassmorphism Dropdown */
.custom-dropdown {
  position: relative;
  z-index: 20;
}

.dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.dropdown-trigger:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
}

.dropdown-trigger.open {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 0 3px rgba(239, 68, 68, 0.15);
}

.dropdown-value {
  flex: 1;
  text-align: left;
}

.dropdown-arrow {
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: linear-gradient(
    180deg,
    rgba(30, 32, 38, 0.95) 0%,
    rgba(20, 22, 28, 0.98) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  overflow: hidden;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
  z-index: 100;
}

.dropdown-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.dropdown-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.dropdown-option.selected {
  background: linear-gradient(
    90deg,
    rgba(239, 68, 68, 0.2) 0%,
    rgba(239, 68, 68, 0.1) 100%
  );
  color: #ef4444;
}

.dropdown-option.selected:hover {
  background: linear-gradient(
    90deg,
    rgba(239, 68, 68, 0.25) 0%,
    rgba(239, 68, 68, 0.15) 100%
  );
}

.dropdown-option:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dropdown-option svg {
  flex-shrink: 0;
  color: #ef4444;
}

/* Dropdown Animation */
.dropdown-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* Glassmorphism Textarea */
.glass-textarea {
  width: 100%;
  padding: 16px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  outline: none;
  resize: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.glass-textarea::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.glass-textarea:hover {
  border-color: rgba(255, 255, 255, 0.18);
}

.glass-textarea:focus {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* iOS-style Toggle Switch */
.toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  cursor: pointer;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.toggle-switch {
  position: relative;
  width: 52px;
  height: 28px;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 2;
}

.toggle-track {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border-radius: 50%;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 1px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active .toggle-track {
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.8) 0%,
    rgba(220, 38, 38, 0.9) 100%
  );
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 12px rgba(239, 68, 68, 0.3);
}

.toggle-switch.active .toggle-thumb {
  left: 26px;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.3),
    0 0 8px rgba(255, 255, 255, 0.2);
}

/* Send Button - Enhanced */
.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  margin-top: 20px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  background: linear-gradient(
    180deg,
    rgba(220, 70, 70, 0.85) 0%,
    rgba(185, 50, 50, 0.9) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 4px 16px rgba(239, 68, 68, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.15);
}

.send-button:hover {
  background: linear-gradient(
    180deg,
    rgba(235, 80, 80, 0.9) 0%,
    rgba(200, 60, 60, 0.95) 100%
  );
  box-shadow:
    0 6px 24px rgba(239, 68, 68, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.send-button:active {
  transform: translateY(0) scale(0.98);
  box-shadow:
    0 2px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.send-button svg {
  opacity: 0.9;
}

/* Blackout Button - Dark, less transparent */
.blackout-button {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.8) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.blackout-button:hover {
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.9) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.blackout-button.blackout-active {
  background: linear-gradient(
    180deg,
    rgba(245, 158, 11, 0.85) 0%,
    rgba(217, 119, 6, 0.9) 100%
  );
  border-color: rgba(245, 158, 11, 0.4);
  color: black;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.blackout-button.blackout-active:hover {
  background: linear-gradient(
    180deg,
    rgba(245, 158, 11, 0.95) 0%,
    rgba(217, 119, 6, 1) 100%
  );
}

/* Ocean toggle button */
.ocean-toggle-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ocean-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

/* ========================================
   Q&A SECTION STYLES
   ======================================== */

.qa-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 20px;
}

.qa-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
}

.qa-divider-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

/* QR Toggle Button */
.qr-toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: white;
}

.qr-toggle-button.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* QR Code Container */
.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.qr-code-image {
  width: 180px;
  height: 180px;
  border-radius: 8px;
}

.qr-code-hint {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

.qr-code-url {
  margin-top: 6px;
  font-size: 10px;
  font-family: monospace;
  color: rgba(255, 255, 255, 0.4);
  word-break: break-all;
  text-align: center;
}

/* QR Expand Animation */
.qr-expand-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.qr-expand-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.qr-expand-enter-from,
.qr-expand-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
  transform-origin: top;
}

/* Questions List */
.questions-list {
  margin-top: 20px;
}

.questions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.questions-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
}

.questions-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.questions-scroll::-webkit-scrollbar {
  width: 4px;
}

.questions-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.questions-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.questions-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Question Card */
.question-card {
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.15s ease;
}

.question-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.question-author {
  font-size: 12px;
  font-weight: 600;
  color: rgba(239, 68, 68, 0.9);
  margin-bottom: 6px;
}

.question-text {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 12px;
  word-break: break-word;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.question-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.question-send-btn {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.question-send-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(34, 197, 94, 0.5);
}

.question-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.question-dismiss-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.question-dismiss-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}
</style>
