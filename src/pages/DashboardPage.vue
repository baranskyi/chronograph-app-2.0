<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import TimerPreview from '../components/TimerPreview.vue'
import TimerCard from '../components/TimerCard.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import SharePanel from '../components/SharePanel.vue'
import ConnectionStatus from '../components/ConnectionStatus.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const timerStore = useTimerStore()
const roomStore = useRoomStore()

const showSettings = ref(false)
const showShare = ref(false)
const isInitializing = ref(true)
const initError = ref<string | null>(null)
const settingsTimerId = ref<string | null>(null)

// Message to speaker
const customMessage = ref('')
const messagePresets = [
  { text: 'Speak louder', icon: '🔊' },
  { text: 'Speak slower', icon: '🐢' },
  { text: 'Speed up', icon: '⚡' },
  { text: 'Wrap up', icon: '⏱️' },
  { text: 'Next slide', icon: '➡️' }
]

const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

// Create room on mount
onMounted(async () => {
  try {
    await roomStore.createRoom()
    isInitializing.value = false
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    initError.value = `Failed to create room: ${errorMessage}`
    isInitializing.value = false
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  roomStore.disconnect()
})

// Broadcast state changes for selected timer
watch(
  () => timerStore.selectedTimer,
  () => {
    if (timerStore.selectedTimerId) {
      roomStore.broadcastTimerState(timerStore.selectedTimerId)
    }
  },
  { deep: true }
)

// Actions
function handleSelectTimer(timerId: string) {
  timerStore.selectTimer(timerId)
}

function handleOpenSettings(timerId?: string) {
  if (timerId) {
    timerStore.selectTimer(timerId)
  }
  settingsTimerId.value = timerId || timerStore.selectedTimerId
  showSettings.value = true
}

async function handleAddTimer() {
  const count = timerStore.timerList.length + 1
  await roomStore.createTimer(`Timer ${count}`)
}

// Delete timer - keeping for future use (context menu)
// async function handleDeleteTimer(timerId: string) {
//   if (timerStore.timerList.length <= 1) return // Keep at least one timer
//   await roomStore.deleteTimer(timerId)
// }

function sendPreset(text: string, urgent = false) {
  roomStore.sendMessage(text, 5000, urgent ? 'urgent' : 'normal')
}

function sendCustomMessage() {
  if (customMessage.value.trim()) {
    roomStore.sendMessage(customMessage.value.trim())
    customMessage.value = ''
  }
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (timerStore.selectedTimerId) {
        if (timerStore.isRunning) {
          timerStore.pauseTimer(timerStore.selectedTimerId)
        } else {
          timerStore.startTimer(timerStore.selectedTimerId)
        }
        roomStore.broadcastTimerState(timerStore.selectedTimerId)
      }
      break
    case 'r':
      if (timerStore.selectedTimerId) {
        timerStore.resetTimer(timerStore.selectedTimerId)
        roomStore.broadcastTimerState(timerStore.selectedTimerId)
      }
      break
    case 'f':
      toggleFullscreen()
      break
    case 'escape':
      if (showSettings.value) {
        showSettings.value = false
      } else if (showShare.value) {
        showShare.value = false
      } else if (isFullscreen.value) {
        exitFullscreen()
      }
      break
    case 's':
      if (!isFullscreen.value && !showSettings.value) {
        handleOpenSettings()
      }
      break
    case 'b':
      roomStore.toggleBlackout()
      break
    case 'n':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleAddTimer()
      }
      break
  }
}
</script>

<template>
  <div class="h-full flex flex-col" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Initializing state -->
    <div v-if="isInitializing" class="flex-1 flex items-center justify-center">
      <div class="text-gray-400">Creating room...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="initError" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="text-red-500 text-xl">{{ initError }}</div>
      <Button @click="$router.push('/')">
        Go Home
      </Button>
    </div>

    <!-- Main Dashboard -->
    <template v-else>
      <!-- Connection status -->
      <ConnectionStatus v-if="!isFullscreen" />

      <!-- Header -->
      <div v-if="!isFullscreen" class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold">Timer Dashboard</h1>
          <span class="text-xs text-gray-500 bg-zinc-800 px-2 py-1 rounded">
            Room: {{ roomStore.roomId }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            class="bg-green-600 hover:bg-green-500"
            @click="showShare = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </Button>
          <Button
            variant="secondary"
            size="sm"
            :class="roomStore.isBlackout ? 'bg-yellow-600 hover:bg-yellow-500' : ''"
            @click="roomStore.toggleBlackout()"
            title="Blackout mode (B)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            @click="toggleFullscreen"
            title="Fullscreen (F)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      <!-- 3-Column Layout -->
      <div v-if="!isFullscreen" class="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        <!-- Left: Timer Preview -->
        <div class="col-span-3">
          <TimerPreview @open-settings="handleOpenSettings()" />
        </div>

        <!-- Center: Timer List -->
        <div class="col-span-6 flex flex-col bg-zinc-900/50 rounded-xl overflow-hidden">
          <!-- List header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div class="text-sm font-medium text-gray-300">Timers ({{ timerStore.timerList.length }})</div>
            <Button
              size="sm"
              @click="handleAddTimer"
              title="Add timer (Ctrl+N)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Add Timer
            </Button>
          </div>

          <!-- Timer list -->
          <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <TimerCard
              v-for="(timer, index) in timerStore.timerList"
              :key="timer.id"
              :timer="timer"
              :index="index"
              @select="handleSelectTimer"
              @open-settings="handleOpenSettings"
            />
          </div>
        </div>

        <!-- Right: Messages -->
        <div class="col-span-3 flex flex-col bg-zinc-900/50 rounded-xl overflow-hidden">
          <!-- Messages header -->
          <div class="px-4 py-3 border-b border-zinc-800">
            <div class="text-sm font-medium text-gray-300">Message to Speaker</div>
          </div>

          <div class="flex-1 p-4 flex flex-col gap-4">
            <!-- Custom message input -->
            <div class="flex gap-2">
              <Input
                v-model="customMessage"
                type="text"
                placeholder="Type message..."
                class="flex-1"
                @keydown.enter="sendCustomMessage"
              />
              <Button
                :disabled="!customMessage.trim()"
                @click="sendCustomMessage"
              >
                Send
              </Button>
            </div>

            <!-- Preset buttons -->
            <div class="space-y-2">
              <div class="text-xs text-gray-500 uppercase tracking-wide">Presets</div>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="preset in messagePresets"
                  :key="preset.text"
                  variant="secondary"
                  size="sm"
                  @click="sendPreset(preset.text)"
                >
                  <span class="mr-1">{{ preset.icon }}</span>
                  <span>{{ preset.text }}</span>
                </Button>
              </div>
              <Button
                variant="destructive"
                class="w-full"
                @click="sendPreset('Time is up!', true)"
              >
                ⚠️ Time's up!
              </Button>
            </div>

            <!-- Share links -->
            <div class="mt-auto pt-4 border-t border-zinc-800">
              <div class="text-xs text-gray-500 uppercase tracking-wide mb-2">Quick Links</div>
              <div class="space-y-1 text-xs">
                <div class="flex items-center justify-between text-gray-400">
                  <span>Viewer (active):</span>
                  <code class="bg-zinc-800 px-2 py-0.5 rounded">/v/{{ roomStore.roomId }}</code>
                </div>
                <div v-if="timerStore.selectedTimerId" class="flex items-center justify-between text-gray-400">
                  <span>Selected timer:</span>
                  <code class="bg-zinc-800 px-2 py-0.5 rounded">/v/{{ roomStore.roomId }}/{{ timerStore.selectedTimerId }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fullscreen mode: Just show selected timer -->
      <div v-if="isFullscreen" class="flex-1 flex items-center justify-center">
        <div
          class="timer-font text-center select-none transition-colors duration-300"
          :class="`timer-${timerStore.colorState}`"
        >
          <span class="text-[20vw] font-bold leading-none md:text-[25vw]">
            {{ timerStore.formattedTime }}
          </span>
        </div>
      </div>

      <!-- Fullscreen hint -->
      <div
        v-if="isFullscreen"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-sm opacity-0 hover:opacity-100 transition-opacity"
      >
        Press ESC to exit fullscreen
      </div>

      <!-- Modals -->
      <SettingsPanel v-model:open="showSettings" />
      <SharePanel v-model:open="showShare" />
    </template>
  </div>
</template>

<style scoped>
.timer-green {
  color: var(--color-green);
  text-shadow: 0 0 60px rgba(34, 197, 94, 0.5);
}
.timer-yellow {
  color: var(--color-yellow);
  text-shadow: 0 0 60px rgba(234, 179, 8, 0.5);
}
.timer-red {
  color: var(--color-red);
  text-shadow: 0 0 60px rgba(239, 68, 68, 0.5);
  animation: pulse-red 1s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
