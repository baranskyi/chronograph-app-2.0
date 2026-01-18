<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import TimerDisplay from '../components/TimerDisplay.vue'
import TimerControls from '../components/TimerControls.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import SharePanel from '../components/SharePanel.vue'
import ConnectionStatus from '../components/ConnectionStatus.vue'

const timerStore = useTimerStore()
const roomStore = useRoomStore()
const showSettings = ref(false)
const showShare = ref(false)
const isInitializing = ref(true)
const initError = ref<string | null>(null)

// Message to speaker
const customMessage = ref('')
const messagePresets = [
  { text: 'Speak louder', icon: '🔊' },
  { text: 'Speak slower', icon: '🐢' },
  { text: 'Speed up', icon: '⚡' },
  { text: 'Wrap up', icon: '⏱️' },
  { text: 'Next slide', icon: '➡️' }
]

function sendPreset(text: string, urgent = false) {
  roomStore.sendMessage(text, 5000, urgent ? 'urgent' : 'normal')
}

function sendCustomMessage() {
  if (customMessage.value.trim()) {
    roomStore.sendMessage(customMessage.value.trim())
    customMessage.value = ''
  }
}

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

// Broadcast state changes to viewers
watch(
  () => timerStore.getStateForSync(),
  () => {
    roomStore.broadcastState()
  },
  { deep: true }
)

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (timerStore.isRunning) {
        timerStore.pause()
      } else {
        timerStore.start()
      }
      break
    case 'r':
      timerStore.reset()
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
      if (!isFullscreen.value) {
        showSettings.value = !showSettings.value
      }
      break
    case 'b':
      roomStore.toggleBlackout()
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
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        @click="$router.push('/')"
      >
        Go Home
      </button>
    </div>

    <!-- Main content -->
    <template v-else>
      <!-- Connection status -->
      <ConnectionStatus v-if="!isFullscreen" />

      <!-- Room ID badge -->
      <div
        v-if="!isFullscreen"
        class="fixed top-4 right-4 text-xs text-gray-400 bg-gray-800/80 px-3 py-1.5 rounded-full z-10"
      >
        Room: {{ roomStore.roomId }}
      </div>

      <!-- Timer Display -->
      <TimerDisplay />

      <!-- Controls -->
      <TimerControls
        v-if="!isFullscreen"
        @open-settings="showSettings = true"
      >
        <template #extra>
          <button
            :class="[
              'px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
              roomStore.isBlackout
                ? 'bg-yellow-600 hover:bg-yellow-500'
                : 'bg-zinc-700 hover:bg-zinc-600'
            ]"
            @click="roomStore.toggleBlackout()"
            title="Toggle blackout mode (B)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
          </button>
          <button
            class="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm transition-colors flex items-center gap-2"
            @click="showShare = true"
            title="Share viewer link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
        </template>
      </TimerControls>

      <!-- Message to Speaker -->
      <div v-if="!isFullscreen" class="px-4 pb-4">
        <div class="max-w-2xl mx-auto bg-zinc-800/50 rounded-xl p-4">
          <div class="text-xs text-gray-400 mb-3 uppercase tracking-wide">Message to Speaker</div>

          <!-- Preset buttons -->
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="preset in messagePresets"
              :key="preset.text"
              class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors flex items-center gap-1.5"
              @click="sendPreset(preset.text)"
            >
              <span>{{ preset.icon }}</span>
              <span>{{ preset.text }}</span>
            </button>
            <button
              class="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded-lg text-sm transition-colors"
              @click="sendPreset('Time is up!', true)"
              title="Urgent message"
            >
              ⚠️ Time's up!
            </button>
          </div>

          <!-- Custom message input -->
          <div class="flex gap-2">
            <input
              v-model="customMessage"
              type="text"
              placeholder="Custom message..."
              class="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              @keydown.enter="sendCustomMessage"
            />
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
              :disabled="!customMessage.trim()"
              @click="sendCustomMessage"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <SettingsPanel v-if="showSettings" @close="showSettings = false" />
      <SharePanel v-if="showShare" @close="showShare = false" />

      <!-- Fullscreen hint -->
      <div
        v-if="isFullscreen"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-sm opacity-0 hover:opacity-100 transition-opacity"
      >
        Press ESC to exit fullscreen
      </div>
    </template>
  </div>
</template>
