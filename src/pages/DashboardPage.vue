<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import ProgressBar from '../components/ProgressBar.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import { Play, Pause, Settings, MoreHorizontal, Plus, GripVertical, Link2, RotateCcw, ArrowLeft } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

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

  // Initialize ocean animation
  initCanvas()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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
  }, 3000)
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
        <button
          class="px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          :class="roomStore.isBlackout ? 'bg-amber-500 text-black' : 'glass-button-subtle hover:bg-white/10'"
          @click="roomStore.toggleBlackout()"
        >
          {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
        </button>
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
          <h2 class="text-2xl font-bold text-gray-100 truncate relative z-10" style="margin-top: 24px; margin-bottom: 16px;">
            {{ timerStore.selectedTimer?.name || 'Timer' }}
          </h2>

          <!-- Big Time Display - Rebuilt from scratch -->
          <div class="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">

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
              <div class="flex justify-between text-xs text-gray-500 mb-1">
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
          <!-- Timers Header - with double spacing from header, aligned with left panel timer name -->
          <div class="flex items-center gap-4 mb-8" style="margin-top: 24px;">
            <span class="font-semibold text-lg leading-none">Timers</span>
            <button
              class="glass-button-red flex items-center gap-2 text-sm font-medium rounded-xl transition-all cursor-pointer"
              style="padding: 10px 20px;"
              @click="handleAddTimer"
            >
              <Plus class="w-4 h-4" />
              <span>Add Timer</span>
            </button>
            <div class="flex-1" />
          </div>

          <!-- Timer List - Bigger items, more spacing (3x gap) -->
          <div class="flex-1 overflow-y-auto flex flex-col gap-12">
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
              style="padding: 20px 24px;"
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

              <!-- Duration -->
              <div class="relative z-10 text-lg font-mono font-bold mr-3" :class="colorClass(timer.id)">
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
                  class="p-3 rounded-xl min-h-12 min-w-12 touch-manipulation active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  :class="timer.status === 'running' ? 'glass-button-amber' : 'glass-button-green'"
                  @click.stop="timer.status === 'running' ? pause(timer.id) : play(timer.id)"
                  :title="timer.status === 'running' ? 'Pause' : 'Play'"
                >
                  <Pause v-if="timer.status === 'running'" class="w-5 h-5" />
                  <Play v-else class="w-5 h-5" />
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

          <!-- Messages Header -->
          <div class="h-12 border-b border-white/10 flex items-center mb-4 relative z-10">
            <span class="font-semibold">Message to Speaker</span>
          </div>

          <!-- Message Input -->
          <div class="flex-1 flex flex-col relative z-10">
            <!-- Timer Target Selector -->
            <div style="margin-bottom: 12px;">
              <label class="block text-xs text-gray-400" style="margin-bottom: 8px;">Send to:</label>
              <select
                v-model="messageTargetTimerId"
                class="w-full bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-red-500/50 backdrop-blur-sm"
                style="padding: 14px 16px;"
              >
                <option :value="null">All timers</option>
                <option v-for="timer in timerStore.orderedTimerList" :key="timer.id" :value="timer.id">
                  {{ timer.name }}
                </option>
              </select>
            </div>

            <textarea
              v-model="customMessage"
              placeholder="Enter message for speaker..."
              rows="4"
              class="w-full bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-red-500/50 resize-none backdrop-blur-sm"
              style="padding: 16px;"
            ></textarea>

            <!-- Splash checkbox -->
            <label class="flex items-center gap-3 cursor-pointer" style="margin-top: 12px;">
              <input
                v-model="messageSplash"
                type="checkbox"
                class="w-5 h-5 rounded border-white/20 bg-black/30 text-red-500 focus:ring-red-500 focus:ring-offset-0 cursor-pointer accent-red-500"
              />
              <span class="text-sm text-gray-300">Make a splash</span>
            </label>

            <button
              class="w-full glass-button-red text-base font-semibold rounded-xl active:scale-[0.98] transition-all touch-manipulation cursor-pointer"
              style="margin-top: 16px; padding: 14px 24px;"
              @click="sendCustomMessage"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Status Bar - Glassmorphism like my-rooms -->
      <footer class="flex-shrink-0 glass-footer flex items-center justify-center relative" style="padding: 16px; z-index: 10;">
        <span class="text-xs text-gray-500">
          chronograph.pro · v{{ APP_VERSION }} · <span class="text-gray-600">&#10003;</span> {{ pingMs !== null ? pingMs + ' ms' : '...' }}
        </span>
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

    <!-- Global Toast - bottom center -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showShareToast"
          class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-black/80 text-white text-sm font-medium px-6 py-3 rounded-xl shadow-lg"
        >
          Link copied
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

/* Toast animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
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
</style>
