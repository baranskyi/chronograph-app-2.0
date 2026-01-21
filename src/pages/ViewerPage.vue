<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFullscreen } from '@vueuse/core'
import { useRoomStore } from '../stores/roomStore'
import { useTimerStore } from '../stores/timerStore'
import MessageOverlay from '../components/MessageOverlay.vue'
import ProgressBar from '../components/ProgressBar.vue'
import { useAudio } from '../composables/useAudio'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const timerStore = useTimerStore()
const audio = useAudio()

const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

const loading = ref(true)
const error = ref<string | null>(null)
const showSplash = ref(false)

const roomId = (route.params.roomId as string).toUpperCase()
const requestedTimerId = route.params.timerId as string | undefined

// Get the timer to display
const displayTimer = computed(() => {
  // If a specific timer was requested, show that one
  if (requestedTimerId) {
    return timerStore.timers.get(requestedTimerId)
  }
  // Otherwise show the active (On Air) timer
  return timerStore.activeTimer
})

// Get display values
const colorState = computed(() => {
  if (!displayTimer.value) return 'green'
  if (displayTimer.value.settings.mode === 'clock') return 'green'
  return timerStore.getColorState(displayTimer.value.id)
})

const formattedTime = computed(() => {
  if (!displayTimer.value) return '00:00'
  return timerStore.getFormattedTime(displayTimer.value.id)
})

// Helper to format seconds as mm:ss
function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Get thresholds from timer settings
const yellowThreshold = computed(() => displayTimer.value?.settings.yellowThreshold ?? 60)
const redThreshold = computed(() => displayTimer.value?.settings.redThreshold ?? 30)

// Computed times for legend
const legendTimes = computed(() => {
  if (!displayTimer.value) return null
  const total = displayTimer.value.settings.duration
  return {
    start: '0:00',
    yellowStart: formatSeconds(total - yellowThreshold.value),
    redStart: formatSeconds(total - redThreshold.value),
    end: formatSeconds(total)
  }
})

onMounted(async () => {
  try {
    await roomStore.joinAsViewer(roomId, requestedTimerId)
    loading.value = false

    // Resume audio context on first interaction
    const resumeAudio = () => {
      audio.resumeContext()
      document.removeEventListener('click', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
    }
    document.addEventListener('click', resumeAudio)
    document.addEventListener('keydown', resumeAudio)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    error.value = errorMessage
    loading.value = false
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  roomStore.disconnect()
})

// Play sound when displayed timer reaches zero
watch(
  () => displayTimer.value?.remainingSeconds,
  (newVal, oldVal) => {
    const timer = displayTimer.value
    if (
      timer?.settings.soundEnabled &&
      timer?.settings.mode === 'countdown' &&
      oldVal === 1 &&
      newVal === 0
    ) {
      audio.playEnd()
    }
  }
)

// Trigger splash animation when message with splash arrives
watch(
  () => roomStore.currentMessage,
  (newMessage) => {
    if (newMessage?.splash) {
      showSplash.value = true
      // Animation lasts 3 seconds (3 flashes * 1 sec each)
      setTimeout(() => {
        showSplash.value = false
      }, 3000)
    }
  }
)

function handleKeydown(e: KeyboardEvent) {
  switch (e.key.toLowerCase()) {
    case 'f':
      toggleFullscreen()
      break
    case 'escape':
      if (isFullscreen.value) {
        exitFullscreen()
      }
      break
  }
}
</script>

<template>
  <div class="h-full min-h-screen bg-[#0f0f0f] text-white flex flex-col" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="text-gray-400 text-xl">Connecting to room...</div>
      <div class="text-gray-500 text-sm">{{ roomId }}</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="text-red-500 text-xl">{{ error }}</div>
      <div class="text-gray-500 text-sm">Room: {{ roomId }}</div>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        @click="router.push('/')"
      >
        Go Home
      </button>
    </div>

    <!-- Timer display (read-only) -->
    <template v-else>
      <!-- Branding - always visible, larger in fullscreen -->
      <div
        class="fixed z-10 flex items-center"
        :class="isFullscreen ? 'top-8 left-8 gap-4' : 'top-4 left-4 gap-2'"
      >
        <span class="logo-pulse" :class="isFullscreen ? 'logo-pulse-large' : ''"></span>
        <span class="font-bold text-white" :class="isFullscreen ? 'text-5xl' : 'text-xl'">Chronograph <span class="text-red-500">Pro</span></span>
      </div>

      <!-- No timer to display -->
      <div v-if="!displayTimer" class="flex-1 flex flex-col items-center justify-center gap-4">
        <div class="text-gray-500 text-xl">Waiting for timer...</div>
        <div class="text-gray-600 text-sm">
          {{ requestedTimerId ? `Timer ${requestedTimerId} not found` : 'No active timer' }}
        </div>
      </div>

      <!-- Timer Display -->
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="flex flex-col items-center">
          <!-- ON AIR Badge - Above Timer -->
          <div
            v-if="displayTimer?.status === 'running'"
            class="mb-4"
          >
            <span class="bg-red-600 text-white text-base font-bold rounded-lg shadow-lg animate-pulse" style="padding: 10px 20px;">
              ON AIR
            </span>
          </div>
          <!-- Timer -->
          <div
            class="timer-font text-center select-none transition-colors duration-300"
            :class="`timer-${colorState}`"
          >
            <span class="text-[20vw] font-bold leading-none md:text-[25vw]">
              {{ formattedTime }}
            </span>
          </div>
        </div>
      </div>

      <!-- Message Overlay -->
      <MessageOverlay v-if="roomStore.currentMessage" :message="roomStore.currentMessage" />

      <!-- Splash Flash Overlay -->
      <div
        v-if="showSplash"
        class="fixed inset-0 z-40 pointer-events-none splash-flash"
      ></div>

      <!-- Blackout Overlay -->
      <Transition name="blackout">
        <div
          v-if="roomStore.isBlackout"
          class="fixed inset-0 z-40 bg-black flex items-center justify-center"
        >
          <div class="text-zinc-800 text-2xl font-medium select-none">
            Paused
          </div>
        </div>
      </Transition>

      <!-- Progress Bar at Bottom -->
      <div v-if="displayTimer" class="w-full px-4 pb-2" :class="isFullscreen ? 'px-0 pb-0' : ''">
        <ProgressBar
          :total-seconds="displayTimer.settings.duration"
          :remaining-seconds="displayTimer.remainingSeconds"
          :yellow-threshold="yellowThreshold"
          :red-threshold="redThreshold"
          :class="isFullscreen ? 'h-8 rounded-none' : 'h-5'"
        />

        <!-- Color Legend -->
        <div v-if="legendTimes && !isFullscreen" class="mt-4 flex flex-col items-center gap-3">
          <!-- Start and End time labels -->
          <div class="w-full flex justify-between text-xs text-gray-500 px-1">
            <span>{{ legendTimes.start }}</span>
            <span>{{ legendTimes.end }}</span>
          </div>

          <!-- Legend items -->
          <div class="flex gap-6 text-xs">
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
        </div>
      </div>

      <!-- Minimal controls for viewer (only when not fullscreen) -->
      <div v-if="!isFullscreen" class="px-4 py-4 flex justify-center">
        <button
          class="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm transition-colors flex items-center gap-2 min-h-10 touch-manipulation active:scale-95"
          @click="toggleFullscreen"
          title="Fullscreen (F)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Fullscreen
        </button>
      </div>

      <!-- Fullscreen hint -->
      <div
        v-if="isFullscreen"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 text-gray-600 text-sm opacity-0 hover:opacity-100 transition-opacity"
      >
        Press ESC to exit fullscreen
      </div>
    </template>
  </div>
</template>

<style scoped>
.timer-font {
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.timer-green {
  color: #10b981;
  text-shadow: 0 0 60px rgba(16, 185, 129, 0.5);
}

.timer-yellow {
  color: #eab308;
  text-shadow: 0 0 60px rgba(234, 179, 8, 0.5);
}

.timer-red {
  color: #ef4444;
  text-shadow: 0 0 60px rgba(239, 68, 68, 0.5);
  animation: pulse-red 1s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.blackout-enter-active,
.blackout-leave-active {
  transition: opacity 0.3s ease;
}

.blackout-enter-from,
.blackout-leave-to {
  opacity: 0;
}

/* Splash flash animation - 3 smooth red flashes over 3 seconds */
.splash-flash {
  animation: splash-flash 3s ease-in-out;
}

@keyframes splash-flash {
  /* Flash 1: 0-33% (1 second) */
  0% { background-color: transparent; }
  5% { background-color: rgba(239, 68, 68, 0.5); }
  15% { background-color: rgba(239, 68, 68, 0.5); }
  30% { background-color: transparent; }

  /* Flash 2: 33-66% (1 second) */
  33% { background-color: transparent; }
  38% { background-color: rgba(239, 68, 68, 0.4); }
  48% { background-color: rgba(239, 68, 68, 0.4); }
  63% { background-color: transparent; }

  /* Flash 3: 66-100% (1 second) */
  66% { background-color: transparent; }
  71% { background-color: rgba(239, 68, 68, 0.3); }
  81% { background-color: rgba(239, 68, 68, 0.3); }
  96% { background-color: transparent; }
  100% { background-color: transparent; }
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

.logo-pulse-large {
  width: 20px;
  height: 20px;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.8);
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
