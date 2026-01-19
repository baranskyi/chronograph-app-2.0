<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import SettingsPanel from '../components/SettingsPanel.vue'
import SharePanel from '../components/SharePanel.vue'
import ConnectionStatus from '../components/ConnectionStatus.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

const timerStore = useTimerStore()
const roomStore = useRoomStore()

const showSettings = ref(false)
const showShare = ref(false)
const isInitializing = ref(true)
const initError = ref<string | null>(null)

const customMessage = ref('')
const messagePresets = [
  { text: 'Speak louder', icon: '🔊' },
  { text: 'Speak slower', icon: '🐢' },
  { text: 'Speed up', icon: '⚡' },
  { text: 'Wrap up', icon: '⏱️' },
]

const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

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

watch(
  () => timerStore.selectedTimer,
  () => {
    if (timerStore.selectedTimerId) {
      roomStore.broadcastTimerState(timerStore.selectedTimerId)
    }
  },
  { deep: true }
)

function handleOpenSettings(timerId?: string) {
  if (timerId) {
    timerStore.selectTimer(timerId)
  }
  showSettings.value = true
}

async function handleAddTimer() {
  const count = timerStore.timerList.length + 1
  await roomStore.createTimer(`Timer ${count}`)
}

function sendPreset(text: string, urgent = false) {
  roomStore.sendMessage(text, 5000, urgent ? 'urgent' : 'normal')
}

function sendCustomMessage() {
  if (customMessage.value.trim()) {
    roomStore.sendMessage(customMessage.value.trim())
    customMessage.value = ''
  }
}

function handlePlayPause(timerId: string) {
  const timer = timerStore.timers.get(timerId)
  if (timer?.status === 'running') {
    timerStore.pauseTimer(timerId)
  } else {
    timerStore.startTimer(timerId)
  }
  roomStore.broadcastTimerState(timerId)
}

function handleReset(timerId: string) {
  timerStore.resetTimer(timerId)
  roomStore.broadcastTimerState(timerId)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (timerStore.selectedTimerId) {
        handlePlayPause(timerStore.selectedTimerId)
      }
      break
    case 'r':
      if (timerStore.selectedTimerId) {
        handleReset(timerStore.selectedTimerId)
      }
      break
    case 'f':
      toggleFullscreen()
      break
    case 'escape':
      if (showSettings.value) showSettings.value = false
      else if (showShare.value) showShare.value = false
      else if (isFullscreen.value) exitFullscreen()
      break
    case 'b':
      roomStore.toggleBlackout()
      break
  }
}

function getColorState(timerId: string) {
  return timerStore.getColorState(timerId)
}

function getFormattedTime(timerId: string) {
  return timerStore.getFormattedTime(timerId)
}

function getProgress(timerId: string) {
  const timer = timerStore.timers.get(timerId)
  if (!timer || timer.settings.mode !== 'countdown') return 100
  return (timer.remainingSeconds / timer.settings.duration) * 100
}
</script>

<template>
  <div class="min-h-screen bg-[#0f1419]" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Loading -->
    <div v-if="isInitializing" class="h-screen flex items-center justify-center">
      <div class="text-gray-400 text-lg">Creating room...</div>
    </div>

    <!-- Error -->
    <div v-else-if="initError" class="h-screen flex flex-col items-center justify-center gap-6">
      <div class="text-red-400 text-xl">{{ initError }}</div>
      <Button size="lg" @click="$router.push('/')">Go Home</Button>
    </div>

    <!-- Dashboard -->
    <template v-else-if="!isFullscreen">
      <ConnectionStatus />

      <!-- Header -->
      <header class="border-b border-[#2d3548] bg-[#0f1419]">
        <div class="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-xl font-semibold text-white">Timer Dashboard</h1>
            <span class="text-sm text-gray-500 bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-[#2d3548]">
              {{ roomStore.roomId }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <Button variant="outline" size="sm" @click="showShare = true">
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              :class="roomStore.isBlackout ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : ''"
              @click="roomStore.toggleBlackout()"
            >
              {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
            </Button>
            <Button variant="outline" size="icon" @click="toggleFullscreen">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-[1600px] mx-auto p-8">
        <div class="grid grid-cols-12 gap-8">

          <!-- Left Column: Preview -->
          <div class="col-span-3">
            <div class="bg-[#1a1f2e] rounded-2xl border border-[#2d3548] p-6">
              <div class="text-sm text-gray-400 mb-4">Live Preview</div>

              <template v-if="timerStore.selectedTimer">
                <div class="text-center mb-6">
                  <div class="text-lg font-medium text-white mb-2">{{ timerStore.selectedTimer.name }}</div>
                  <div
                    v-if="timerStore.selectedTimer.isOnAir"
                    class="inline-block px-3 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30"
                  >
                    ON AIR
                  </div>
                </div>

                <div
                  class="text-6xl font-mono font-bold text-center py-8 transition-colors"
                  :class="{
                    'text-green-400': getColorState(timerStore.selectedTimerId!) === 'green',
                    'text-yellow-400': getColorState(timerStore.selectedTimerId!) === 'yellow',
                    'text-red-400': getColorState(timerStore.selectedTimerId!) === 'red',
                  }"
                >
                  {{ getFormattedTime(timerStore.selectedTimerId!) }}
                </div>

                <Progress
                  :model-value="getProgress(timerStore.selectedTimerId!)"
                  class="h-2 mb-6"
                />

                <div class="flex justify-center gap-3">
                  <Button variant="outline" size="icon" @click="handleReset(timerStore.selectedTimerId!)">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                  </Button>
                  <Button
                    :variant="timerStore.selectedTimer.status === 'running' ? 'destructive' : 'default'"
                    size="lg"
                    class="px-8"
                    @click="handlePlayPause(timerStore.selectedTimerId!)"
                  >
                    {{ timerStore.selectedTimer.status === 'running' ? 'Pause' : 'Start' }}
                  </Button>
                  <Button variant="outline" size="icon" @click="handleOpenSettings()">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </template>

              <div v-else class="py-16 text-center text-gray-500">
                Select a timer
              </div>
            </div>
          </div>

          <!-- Center Column: Timer List -->
          <div class="col-span-5">
            <div class="bg-[#1a1f2e] rounded-2xl border border-[#2d3548]">
              <div class="px-6 py-4 border-b border-[#2d3548] flex items-center justify-between">
                <div class="text-white font-medium">Timers</div>
                <Button size="sm" @click="handleAddTimer">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Add Timer
                </Button>
              </div>

              <div class="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                <div
                  v-for="timer in timerStore.timerList"
                  :key="timer.id"
                  class="p-4 rounded-xl transition-all cursor-pointer"
                  :class="[
                    timerStore.selectedTimerId === timer.id
                      ? 'bg-blue-500/10 border border-blue-500/30'
                      : 'bg-[#252b3b] border border-transparent hover:border-[#3d4556]'
                  ]"
                  @click="timerStore.selectTimer(timer.id)"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="text-white font-medium">{{ timer.name }}</div>
                      <div
                        v-if="timer.isOnAir"
                        class="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30"
                      >
                        LIVE
                      </div>
                    </div>
                    <div
                      class="text-2xl font-mono font-semibold"
                      :class="{
                        'text-green-400': getColorState(timer.id) === 'green',
                        'text-yellow-400': getColorState(timer.id) === 'yellow',
                        'text-red-400': getColorState(timer.id) === 'red',
                      }"
                    >
                      {{ getFormattedTime(timer.id) }}
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="handlePlayPause(timer.id)"
                    >
                      {{ timer.status === 'running' ? 'Pause' : 'Start' }}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="handleReset(timer.id)"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="handleOpenSettings(timer.id)"
                    >
                      Settings
                    </Button>
                    <div class="flex-1" />
                    <Button
                      :variant="timer.isOnAir ? 'destructive' : 'secondary'"
                      size="sm"
                      @click.stop="roomStore.setTimerOnAir(timer.id)"
                    >
                      {{ timer.isOnAir ? 'On Air' : 'Set Live' }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Messages -->
          <div class="col-span-4">
            <div class="bg-[#1a1f2e] rounded-2xl border border-[#2d3548] p-6">
              <div class="text-white font-medium mb-6">Message to Speaker</div>

              <div class="flex gap-3 mb-6">
                <Input
                  v-model="customMessage"
                  placeholder="Type a message..."
                  class="flex-1"
                  @keydown.enter="sendCustomMessage"
                />
                <Button :disabled="!customMessage.trim()" @click="sendCustomMessage">
                  Send
                </Button>
              </div>

              <div class="text-sm text-gray-400 mb-3">Quick Messages</div>
              <div class="grid grid-cols-2 gap-3 mb-6">
                <Button
                  v-for="preset in messagePresets"
                  :key="preset.text"
                  variant="secondary"
                  class="justify-start"
                  @click="sendPreset(preset.text)"
                >
                  <span class="mr-2">{{ preset.icon }}</span>
                  {{ preset.text }}
                </Button>
              </div>

              <Button
                variant="destructive"
                class="w-full"
                @click="sendPreset('Time is up!', true)"
              >
                ⚠️ Time's Up!
              </Button>

              <div class="mt-8 pt-6 border-t border-[#2d3548]">
                <div class="text-sm text-gray-400 mb-3">Viewer Links</div>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center justify-between p-3 bg-[#252b3b] rounded-lg">
                    <span class="text-gray-400">Active timer</span>
                    <code class="text-blue-400">/v/{{ roomStore.roomId }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </template>

    <!-- Fullscreen Timer -->
    <div v-if="isFullscreen" class="h-screen flex items-center justify-center bg-[#0f1419]">
      <div
        class="text-[20vw] font-mono font-bold transition-colors"
        :class="{
          'text-green-400': timerStore.selectedTimerId && getColorState(timerStore.selectedTimerId) === 'green',
          'text-yellow-400': timerStore.selectedTimerId && getColorState(timerStore.selectedTimerId) === 'yellow',
          'text-red-400': timerStore.selectedTimerId && getColorState(timerStore.selectedTimerId) === 'red',
        }"
      >
        {{ timerStore.selectedTimerId ? getFormattedTime(timerStore.selectedTimerId) : '00:00' }}
      </div>
    </div>

    <!-- Modals -->
    <SettingsPanel v-model:open="showSettings" />
    <SharePanel v-model:open="showShare" />
  </div>
</template>
