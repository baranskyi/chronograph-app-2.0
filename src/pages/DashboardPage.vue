<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import ProgressBar from '../components/ProgressBar.vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import SharePanel from '../components/SharePanel.vue'
import { Play, Pause, SkipBack, SkipForward, Settings, MoreHorizontal, Plus, Trash2 } from 'lucide-vue-next'

const timerStore = useTimerStore()
const roomStore = useRoomStore()

const APP_VERSION = '0.1.0'

const showSettings = ref(false)
const showShare = ref(false)
const isInitializing = ref(true)
const initError = ref<string | null>(null)
const customMessage = ref('')
const pingMs = ref<number | null>(null)
const editingTimerId = ref<string | null>(null)
const editingTimerName = ref('')

const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

// Current time for clock display
const currentTime = ref(new Date())
let clockInterval: number | null = null

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
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  roomStore.disconnect()
  if (clockInterval) clearInterval(clockInterval)
})

watch(() => timerStore.selectedTimer, () => {
  if (timerStore.selectedTimerId) {
    roomStore.broadcastTimerState(timerStore.selectedTimerId)
  }
}, { deep: true })

// Format current time as HH:MM:SS AM/PM
const formattedClock = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
})

// Calculate scheduled start times for timers
const getScheduledStart = (index: number) => {
  const now = new Date()
  let offset = 0
  for (let i = 0; i < index; i++) {
    const timer = timerStore.timerList[i]
    if (timer) offset += timer.settings.duration
  }
  const start = new Date(now.getTime() + offset * 1000)
  return start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

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

async function deleteTimer(timerId: string, event: Event) {
  event.stopPropagation()
  await roomStore.deleteTimer(timerId)
}

function sendMessage(text: string, urgent = false) {
  roomStore.sendMessage(text, 5000, urgent ? 'urgent' : 'normal')
}

function sendCustomMessage() {
  if (customMessage.value.trim()) {
    roomStore.sendMessage(customMessage.value.trim())
    customMessage.value = ''
  }
}

function play(id: string) {
  timerStore.startTimer(id)
  roomStore.broadcastTimerState(id)
}

function pause(id: string) {
  timerStore.pauseTimer(id)
  roomStore.broadcastTimerState(id)
}

function reset(id: string) {
  timerStore.resetTimer(id)
  roomStore.broadcastTimerState(id)
}

function adjust(id: string, seconds: number) {
  timerStore.adjustTime(id, seconds)
  roomStore.broadcastTimerState(id)
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
      else if (showShare.value) showShare.value = false
      else if (isFullscreen.value) exitFullscreen()
      break
    case 'b': roomStore.toggleBlackout(); break
  }
}

const colorClass = (id: string) => {
  const state = timerStore.getColorState(id)
  return state === 'green' ? 'text-emerald-400' : state === 'yellow' ? 'text-amber-400' : 'text-red-400'
}

// Total elapsed and remaining for all timers
const totalElapsed = computed(() => {
  return timerStore.timerList.reduce((sum, t) => sum + t.elapsedSeconds, 0)
})

const totalRemaining = computed(() => {
  return timerStore.timerList.reduce((sum, t) => sum + t.remainingSeconds, 0)
})
</script>

<template>
  <div class="min-h-screen bg-[#0f0f0f] text-white">
    <!-- Loading -->
    <div v-if="isInitializing" class="h-screen flex items-center justify-center">
      <div class="text-xl font-semibold text-gray-400">Loading stagetimer...</div>
    </div>

    <!-- Error -->
    <div v-else-if="initError" class="h-screen flex flex-col items-center justify-center gap-4">
      <div class="text-red-400">{{ initError }}</div>
      <button class="px-4 py-2 bg-white/10 rounded hover:bg-white/20" @click="$router.push('/')">Go Home</button>
    </div>

    <!-- Main Dashboard -->
    <template v-else>
      <!-- Top Header -->
      <header class="h-12 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center px-4 gap-4">
        <div class="font-semibold text-lg">{{ roomStore.roomId || 'Chronograph' }}</div>
        <button
          class="px-3 py-1.5 text-sm bg-[#2a2a2a] rounded hover:bg-[#333] flex items-center gap-2"
          @click="showShare = true"
        >
          <span>Output Links</span>
        </button>
        <div class="flex-1" />
        <button
          class="px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2"
          :class="roomStore.isBlackout ? 'bg-amber-500 text-black' : 'bg-[#2a2a2a] hover:bg-[#333]'"
          @click="roomStore.toggleBlackout()"
        >
          {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
        </button>
        <button class="px-3 py-1.5 text-sm bg-blue-600 rounded hover:bg-blue-700">
          Room
        </button>
        <button class="p-2 bg-[#2a2a2a] rounded hover:bg-[#333]" @click="toggleFullscreen">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </header>

      <!-- 3-Column Layout -->
      <div class="flex h-[calc(100vh-3rem-3rem)]">
        <!-- LEFT: Preview Panel -->
        <div class="w-[280px] bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col">
          <!-- Timer Preview Header -->
          <div class="px-3 py-2 border-b border-[#2a2a2a] flex items-center gap-2">
            <span class="text-xs text-cyan-400 font-medium">
              {{ timerStore.selectedTimer?.name || 'Timer 1' }}
            </span>
          </div>

          <!-- Big Time Display -->
          <div class="flex-1 flex flex-col items-center justify-center px-4">
            <div
              v-if="timerStore.selectedTimer"
              class="text-[4.5rem] font-mono font-bold tabular-nums leading-none"
              :class="colorClass(timerStore.selectedTimerId!)"
            >
              {{ timerStore.getFormattedTime(timerStore.selectedTimerId!) }}
            </div>
            <div v-else class="text-4xl text-gray-500">--:--</div>

            <!-- Progress Bar -->
            <div class="w-full mt-4" v-if="timerStore.selectedTimer">
              <ProgressBar
                :total-seconds="timerStore.selectedTimer.settings.duration"
                :remaining-seconds="timerStore.selectedTimer.remainingSeconds"
                :yellow-threshold="30"
                :red-threshold="10"
              />
            </div>

            <!-- ON AIR Badge -->
            <div class="mt-4 flex items-center gap-3">
              <span
                v-if="timerStore.selectedTimer?.isOnAir"
                class="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded"
              >ON AIR</span>
              <span class="text-sm text-gray-400 font-mono">
                {{ timerStore.selectedTimer ? formatDuration(timerStore.selectedTimer.elapsedSeconds) : '0:00:00' }}.0
              </span>
            </div>

            <!-- Time Scale -->
            <div class="w-full mt-3 flex justify-between text-xs text-gray-500 px-1" v-if="timerStore.selectedTimer">
              <span>{{ formatDuration(timerStore.selectedTimer.settings.duration) }}</span>
              <span>{{ formatDuration(Math.floor(timerStore.selectedTimer.settings.duration * 0.75)) }}</span>
              <span>{{ formatDuration(Math.floor(timerStore.selectedTimer.settings.duration * 0.5)) }}</span>
              <span>{{ formatDuration(Math.floor(timerStore.selectedTimer.settings.duration * 0.25)) }}</span>
            </div>
          </div>

          <!-- Transport Controls -->
          <div class="px-4 py-3 border-t border-[#2a2a2a]">
            <div class="flex items-center justify-center gap-2" v-if="timerStore.selectedTimerId">
              <button
                class="px-3 py-2 text-sm bg-[#2a2a2a] rounded hover:bg-[#333] min-h-10 min-w-10 touch-manipulation active:scale-95"
                @click="adjust(timerStore.selectedTimerId!, -60)"
              >-1m</button>
              <button
                class="p-2 bg-[#2a2a2a] rounded hover:bg-[#333] min-h-10 min-w-10 touch-manipulation active:scale-95"
                @click="reset(timerStore.selectedTimerId!)"
              >
                <SkipBack class="w-4 h-4" />
              </button>
              <button
                class="p-2 rounded min-h-10 min-w-12 touch-manipulation active:scale-95 transition-colors"
                :class="timerStore.selectedTimer?.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'"
                @click="timerStore.selectedTimer?.status === 'running' ? pause(timerStore.selectedTimerId!) : play(timerStore.selectedTimerId!)"
              >
                <Pause v-if="timerStore.selectedTimer?.status === 'running'" class="w-4 h-4 mx-auto" />
                <Play v-else class="w-4 h-4 mx-auto" />
              </button>
              <button
                class="p-2 bg-[#2a2a2a] rounded hover:bg-[#333] min-h-10 min-w-10 touch-manipulation active:scale-95"
              >
                <SkipForward class="w-4 h-4" />
              </button>
              <button
                class="px-3 py-2 text-sm bg-[#2a2a2a] rounded hover:bg-[#333] min-h-10 min-w-10 touch-manipulation active:scale-95"
                @click="adjust(timerStore.selectedTimerId!, 60)"
              >+1m</button>
            </div>
          </div>

          <!-- Clock & Cue Info -->
          <div class="px-4 py-3 border-t border-[#2a2a2a] text-xs text-gray-400">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-gray-500">&#128340;</span>
              <span>{{ formattedClock }}</span>
              <span class="ml-2 text-gray-600">Europe/Madrid</span>
            </div>
            <div class="flex gap-4">
              <div>
                <span class="text-gray-500">Cue finish</span>
                <div class="text-white">{{ formattedClock }}</div>
              </div>
              <div>
                <span class="text-gray-500">Over/Under</span>
                <div class="text-white">–</div>
              </div>
            </div>
          </div>

          <!-- Live Connections -->
          <div class="px-4 py-2 border-t border-[#2a2a2a]">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-gray-500">Live Connections</span>
              <span class="text-white">{{ roomStore.viewerCount }}/3</span>
              <span class="ml-auto text-gray-600">&gt;</span>
            </div>
          </div>
        </div>

        <!-- CENTER: Timers Panel -->
        <div class="flex-1 flex flex-col bg-[#0f0f0f]">
          <!-- Timers Header -->
          <div class="h-12 px-4 border-b border-[#2a2a2a] flex items-center gap-4">
            <span class="font-medium">Timers</span>
            <button
              class="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              @click="handleAddTimer"
            >
              <Plus class="w-4 h-4" />
              <span>Add Timer</span>
            </button>
            <div class="flex-1" />
            <label class="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" class="rounded bg-[#2a2a2a] border-[#333]" />
              Follow
            </label>
            <button
              class="px-3 py-1.5 text-sm rounded transition-colors"
              :class="roomStore.isBlackout ? 'bg-amber-500 text-black' : 'bg-[#2a2a2a] hover:bg-[#333]'"
              @click="roomStore.toggleBlackout()"
            >
              Blackout
            </button>
            <button class="p-1.5 bg-[#2a2a2a] rounded hover:bg-[#333]">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zm6 0a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zm5 0a1 1 0 10-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4z" /></svg>
            </button>
          </div>

          <!-- Timer List -->
          <div class="flex-1 overflow-y-auto">
            <div
              v-for="(timer, index) in timerStore.timerList"
              :key="timer.id"
              class="flex items-center px-4 py-3 border-b border-[#2a2a2a] cursor-pointer transition-colors"
              :class="timerStore.selectedTimerId === timer.id ? 'bg-blue-600' : 'hover:bg-[#1a1a1a]'"
              @click="timerStore.selectTimer(timer.id)"
            >
              <!-- Row Number -->
              <div class="w-8 text-sm text-gray-500">{{ index + 1 }}</div>

              <!-- Delete Button -->
              <button
                class="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 mr-3 touch-manipulation active:scale-95"
                @click="deleteTimer(timer.id, $event)"
                title="Delete timer"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <!-- Start Time -->
              <div class="w-24 text-sm text-gray-400">{{ getScheduledStart(index) }}</div>

              <!-- Duration -->
              <div class="w-16 text-sm font-mono font-bold">{{ formatDuration(timer.settings.duration) }}</div>

              <!-- Timer Name (Editable) -->
              <div class="flex-1 text-sm font-medium">
                <input
                  v-if="editingTimerId === timer.id"
                  v-model="editingTimerName"
                  type="text"
                  class="bg-[#0f0f0f] border border-blue-500 rounded px-2 py-1 text-sm w-full max-w-[200px] focus:outline-none"
                  @click.stop
                  @blur="saveTimerName(timer.id)"
                  @keydown.enter="saveTimerName(timer.id)"
                  @keydown.escape="cancelEditingTimer"
                  autofocus
                />
                <span
                  v-else
                  class="cursor-text hover:text-blue-300"
                  @click="startEditingTimer(timer.id, timer.name, $event)"
                >
                  {{ timer.name }}
                </span>
              </div>

              <!-- Controls -->
              <div class="flex items-center gap-1">
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95"
                  @click.stop="reset(timer.id)"
                >
                  <SkipBack class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95"
                  @click.stop="handleOpenSettings(timer.id)"
                >
                  <Settings class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 rounded touch-manipulation active:scale-95 transition-colors flex items-center justify-center"
                  :class="timer.status === 'running' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-600 hover:bg-emerald-700'"
                  @click.stop="timer.status === 'running' ? pause(timer.id) : play(timer.id)"
                >
                  <Pause v-if="timer.status === 'running'" class="w-4 h-4" />
                  <Play v-else class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95"
                  @click.stop
                >
                  <MoreHorizontal class="w-4 h-4" />
                </button>
              </div>
            </div>


          </div>
        </div>

        <!-- RIGHT: Messages Panel -->
        <div class="w-[280px] bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col">
          <!-- Messages Header -->
          <div class="h-12 px-4 border-b border-[#2a2a2a] flex items-center">
            <span class="font-medium">Messages</span>
            <button class="ml-auto px-3 py-1 text-sm bg-[#2a2a2a] rounded hover:bg-[#333]">Focus</button>
          </div>

          <!-- Message Input -->
          <div class="p-4 border-b border-[#2a2a2a]">
            <input
              v-model="customMessage"
              type="text"
              placeholder="Enter message ..."
              class="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              @keydown.enter="sendCustomMessage"
            />

            <!-- Font Style Buttons (placeholder) -->
            <div class="flex items-center gap-2 mt-3">
              <span class="text-gray-500 text-sm">1</span>
              <button class="px-2 py-1 text-sm bg-[#2a2a2a] rounded hover:bg-[#333]">A</button>
              <button class="px-2 py-1 text-sm text-red-400 bg-[#2a2a2a] rounded hover:bg-[#333]">A</button>
              <button class="px-2 py-1 text-sm text-red-400 bg-[#2a2a2a] rounded hover:bg-[#333]">A</button>
              <button class="px-2 py-1 text-sm font-bold bg-[#2a2a2a] rounded hover:bg-[#333]">B</button>
              <button class="px-2 py-1 text-xs bg-[#2a2a2a] rounded hover:bg-[#333]">aA</button>
            </div>

            <!-- Show Button -->
            <button class="w-full mt-3 px-3 py-2 text-sm bg-[#2a2a2a] rounded hover:bg-[#333] flex items-center justify-center gap-2">
              <span>&#8679;</span>
              <span>Show</span>
            </button>
          </div>

          <!-- Quick Messages -->
          <div class="flex-1 p-4 overflow-y-auto">
            <div class="grid grid-cols-2 gap-2">
              <button
                class="px-3 py-2 text-xs text-left bg-[#0f0f0f] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] min-h-10 touch-manipulation active:scale-95"
                @click="sendMessage('Speak louder')"
              >
                Louder
              </button>
              <button
                class="px-3 py-2 text-xs text-left bg-[#0f0f0f] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] min-h-10 touch-manipulation active:scale-95"
                @click="sendMessage('Speak slower')"
              >
                Slower
              </button>
              <button
                class="px-3 py-2 text-xs text-left bg-[#0f0f0f] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] min-h-10 touch-manipulation active:scale-95"
                @click="sendMessage('Speed up')"
              >
                Speed up
              </button>
              <button
                class="px-3 py-2 text-xs text-left bg-[#0f0f0f] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] min-h-10 touch-manipulation active:scale-95"
                @click="sendMessage('Wrap up')"
              >
                Wrap up
              </button>
            </div>

            <button
              class="w-full mt-4 px-3 py-2 text-sm bg-[#2a2a2a] border border-[#333] rounded hover:bg-[#333] flex items-center justify-center gap-2"
              @click="handleAddTimer"
            >
              <Plus class="w-4 h-4" />
              <span>Add Message</span>
            </button>

            <div class="mt-4 text-xs text-gray-500 text-center">
              Submit questions link
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Status Bar -->
      <footer class="h-12 bg-[#1a1a1a] border-t border-[#2a2a2a] flex items-center px-4 gap-4">
        <div class="text-xs text-gray-500">
          chronograph.pro · v{{ APP_VERSION }} · <span class="text-gray-600">&#10003;</span> {{ pingMs !== null ? pingMs + ' ms' : '...' }}
        </div>
        <div class="flex-1 flex items-center gap-2 px-4">
          <span class="text-xs text-gray-400 w-12">{{ formatDuration(totalElapsed) }}</span>
          <!-- Timeline Scrubber -->
          <div class="flex-1 relative h-2 bg-[#2a2a2a] rounded">
            <div
              class="absolute inset-y-0 left-0 bg-gray-500 rounded"
              :style="{ width: `${totalElapsed > 0 ? (totalElapsed / (totalElapsed + totalRemaining)) * 100 : 0}%` }"
            />
            <div
              class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"
              :style="{ left: `${totalElapsed > 0 ? (totalElapsed / (totalElapsed + totalRemaining)) * 100 : 0}%` }"
            />
          </div>
          <span class="text-xs text-gray-400 w-12 text-right">{{ formatDuration(totalRemaining) }}</span>
        </div>
      </footer>
    </template>

    <!-- Modals -->
    <SettingsPanel v-model:open="showSettings" />
    <SharePanel v-model:open="showShare" />
  </div>
</template>
