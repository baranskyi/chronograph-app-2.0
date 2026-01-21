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
  <div class="min-h-screen bg-[#0f0f0f] text-white" style="padding: 8px;">
    <!-- Loading -->
    <div v-if="isInitializing" class="h-screen flex items-center justify-center">
      <div class="text-xl font-semibold text-gray-400">Loading Chronograph Pro...</div>
    </div>

    <!-- Error -->
    <div v-else-if="initError" class="h-screen flex flex-col items-center justify-center gap-4">
      <div class="text-red-400">{{ initError }}</div>
      <button class="px-4 py-2 bg-white/10 rounded hover:bg-white/20" @click="$router.push('/')">Go Home</button>
    </div>

    <!-- Main Dashboard -->
    <template v-else>
      <!-- Top Header -->
      <header class="h-14 bg-[#0f0f0f] border-b border-[#2a2a2a] flex items-center gap-4" style="padding: 0 24px;">
        <button
          class="p-2 bg-[#2a2a2a] rounded hover:bg-[#333] transition-colors"
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
          class="px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2"
          :class="roomStore.isBlackout ? 'bg-amber-500 text-black' : 'bg-[#2a2a2a] hover:bg-[#333]'"
          @click="roomStore.toggleBlackout()"
        >
          {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
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
        <div class="w-[280px] bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col py-4" style="padding-left: 16px; padding-right: 16px;">
          <!-- Timer Name - Large, left-aligned -->
          <h2 class="text-2xl font-bold text-gray-100 truncate" style="margin-bottom: 16px;">
            {{ timerStore.selectedTimer?.name || 'Timer' }}
          </h2>

          <!-- Big Time Display - Rebuilt from scratch -->
          <div class="flex-1 flex flex-col items-center justify-center gap-6">

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
        <div class="flex-1 flex flex-col bg-[#0f0f0f] py-4" style="padding-left: 16px; padding-right: 16px;">
          <!-- Timers Header -->
          <div class="h-12 border-b border-[#2a2a2a] flex items-center gap-4 mb-2">
            <span class="font-medium">Timers</span>
            <button
              class="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-gray-500 hover:border-gray-400 rounded-md transition-colors cursor-pointer"
              style="padding: 6px 12px;"
              @click="handleAddTimer"
            >
              <Plus class="w-4 h-4" />
              <span>Add Timer</span>
            </button>
            <div class="flex-1" />
          </div>

          <!-- Timer List -->
          <div class="flex-1 overflow-y-auto flex flex-col gap-2">
            <div
              v-for="timer in timerStore.orderedTimerList"
              :key="timer.id"
              class="relative flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden"
              :class="[
                timerStore.selectedTimerId === timer.id ? 'bg-blue-600' : 'bg-[#1a1a1a] hover:bg-[#252525]',
                draggedTimerId === timer.id ? 'opacity-50 scale-[0.98]' : '',
                dragOverTimerId === timer.id && draggedTimerId !== timer.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f0f0f]' : ''
              ]"
              draggable="true"
              @click="timerStore.selectTimer(timer.id)"
              @dragstart="handleDragStart(timer.id, $event)"
              @dragend="handleDragEnd"
              @dragover="handleDragOver(timer.id, $event)"
              @dragleave="handleDragLeave"
              @drop="handleDrop(timer.id, $event)"
            >
              <!-- Progress overlay for selected timer -->
              <div
                v-if="timerStore.selectedTimerId === timer.id && timer.status === 'running'"
                class="absolute inset-0 bg-blue-500 transition-all duration-200 pointer-events-none"
                :style="{ width: getTimerProgress(timer) + '%' }"
              ></div>
              <!-- Drag Handle -->
              <div class="relative z-10 p-1 mr-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white transition-colors">
                <GripVertical class="w-4 h-4" />
              </div>

              <!-- Timer Name (Editable) -->
              <div class="relative z-10 text-sm font-medium">
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

              <!-- Spacer -->
              <div class="relative z-10 flex-1" />

              <!-- Duration -->
              <div class="relative z-10 text-sm font-mono font-bold mr-4 text-gray-400">{{ formatDuration(timer.settings.duration) }}</div>

              <!-- Controls -->
              <div class="relative z-10 flex items-center gap-1">
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95 flex items-center justify-center"
                  @click.stop="reset(timer.id)"
                  title="Reset"
                >
                  <RotateCcw class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95 flex items-center justify-center"
                  @click.stop="handleOpenSettings(timer.id)"
                  title="Settings"
                >
                  <Settings class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded min-h-10 min-w-10 touch-manipulation active:scale-95 transition-colors flex items-center justify-center"
                  :class="timer.status === 'running' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-emerald-600 hover:bg-emerald-700'"
                  @click.stop="timer.status === 'running' ? pause(timer.id) : play(timer.id)"
                  :title="timer.status === 'running' ? 'Pause' : 'Play'"
                >
                  <Pause v-if="timer.status === 'running'" class="w-4 h-4" />
                  <Play v-else class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95 flex items-center justify-center"
                  @click="handleShareClick(timer.id, $event)"
                  title="Copy viewer link"
                >
                  <Link2 class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded hover:bg-white/10 min-h-10 min-w-10 touch-manipulation active:scale-95 flex items-center justify-center"
                  @click="showDeleteConfirm(timer.id, $event)"
                  title="Delete timer"
                >
                  <MoreHorizontal class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Messages Panel -->
        <div class="w-[280px] bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col py-4" style="padding-left: 16px; padding-right: 16px;">
          <!-- Messages Header -->
          <div class="h-12 border-b border-[#2a2a2a] flex items-center mb-4">
            <span class="font-medium">Message to Speaker</span>
          </div>

          <!-- Message Input -->
          <div class="flex-1 flex flex-col">
            <!-- Timer Target Selector -->
            <div style="margin-bottom: 12px;">
              <label class="block text-xs text-gray-400" style="margin-bottom: 8px;">Send to:</label>
              <select
                v-model="messageTargetTimerId"
                class="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:border-blue-500"
                style="padding: 12px 16px;"
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
              class="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
              style="padding: 16px;"
            ></textarea>

            <!-- Splash checkbox -->
            <label class="flex items-center gap-3 cursor-pointer" style="margin-top: 12px;">
              <input
                v-model="messageSplash"
                type="checkbox"
                class="w-5 h-5 rounded border-[#2a2a2a] bg-[#0f0f0f] text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <span class="text-sm text-gray-300">Make a splash</span>
            </label>

            <button
              class="w-full px-4 py-3 text-base font-medium bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all touch-manipulation"
              style="margin-top: 16px;"
              @click="sendCustomMessage"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom Status Bar -->
      <footer class="h-12 bg-[#1a1a1a] border-t border-[#2a2a2a] flex items-center px-4">
        <div class="text-xs text-gray-500">
          chronograph.pro · v{{ APP_VERSION }} · <span class="text-gray-600">&#10003;</span> {{ pingMs !== null ? pingMs + ' ms' : '...' }}
        </div>
      </footer>
    </template>

    <!-- Modals -->
    <SettingsPanel v-model:open="showSettings" />

    <!-- Delete Confirmation Dialog -->
    <Teleport to="body">
      <div
        v-if="deleteConfirmTimerId"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click="cancelDelete"
      >
        <div
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-sm mx-4"
          @click.stop
        >
          <h3 class="text-lg font-semibold mb-2">Delete Timer</h3>
          <p class="text-gray-400 mb-6">Are you sure you want to delete this timer?</p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm bg-[#2a2a2a] rounded hover:bg-[#333] transition-colors"
              @click="cancelDelete"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm bg-red-600 rounded hover:bg-red-700 transition-colors"
              @click="confirmDeleteTimer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
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
