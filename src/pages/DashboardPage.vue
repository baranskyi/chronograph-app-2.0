<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import SettingsPanel from '../components/SettingsPanel.vue'
import SharePanel from '../components/SharePanel.vue'

const timerStore = useTimerStore()
const roomStore = useRoomStore()

const showSettings = ref(false)
const showShare = ref(false)
const isInitializing = ref(true)
const initError = ref<string | null>(null)
const customMessage = ref('')

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

watch(() => timerStore.selectedTimer, () => {
  if (timerStore.selectedTimerId) {
    roomStore.broadcastTimerState(timerStore.selectedTimerId)
  }
}, { deep: true })

function handleOpenSettings(timerId?: string) {
  if (timerId) timerStore.selectTimer(timerId)
  showSettings.value = true
}

async function handleAddTimer() {
  await roomStore.createTimer(`Timer ${timerStore.timerList.length + 1}`)
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
</script>

<template>
  <div class="min-h-screen bg-[#1a1714] text-white">
    <!-- Loading -->
    <div v-if="isInitializing" class="h-screen flex items-center justify-center">
      <div class="text-xl font-semibold">Loading stagetimer...</div>
    </div>

    <!-- Error -->
    <div v-else-if="initError" class="h-screen flex flex-col items-center justify-center gap-4">
      <div class="text-red-400">{{ initError }}</div>
      <button class="px-4 py-2 bg-white/10 rounded hover:bg-white/20" @click="$router.push('/')">Go Home</button>
    </div>

    <!-- Main -->
    <template v-else-if="!isFullscreen">
      <!-- Top Bar -->
      <header class="h-14 border-b border-white/10 flex items-center px-4 gap-4">
        <div class="font-semibold">Chronograph</div>
        <div class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded">{{ roomStore.roomId }}</div>
        <div class="flex-1" />
        <button class="px-3 py-1.5 text-sm bg-white/10 rounded hover:bg-white/20" @click="showShare = true">
          Share
        </button>
        <button
          class="px-3 py-1.5 text-sm rounded transition-colors"
          :class="roomStore.isBlackout ? 'bg-amber-500 text-black' : 'bg-white/10 hover:bg-white/20'"
          @click="roomStore.toggleBlackout()"
        >
          {{ roomStore.isBlackout ? 'Show' : 'Blackout' }}
        </button>
        <button class="p-2 bg-white/10 rounded hover:bg-white/20" @click="toggleFullscreen">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </header>

      <div class="flex h-[calc(100vh-3.5rem)]">
        <!-- Sidebar: Messages -->
        <aside class="w-72 border-r border-white/10 flex flex-col">
          <div class="p-4 border-b border-white/10">
            <div class="text-sm font-medium text-white/70 mb-3">Messages</div>
            <div class="flex gap-2 mb-3">
              <input
                v-model="customMessage"
                type="text"
                placeholder="Custom message..."
                class="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                @keydown.enter="sendCustomMessage"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button class="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 text-left" @click="sendMessage('Speak louder')">🔊 Louder</button>
              <button class="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 text-left" @click="sendMessage('Speak slower')">🐢 Slower</button>
              <button class="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 text-left" @click="sendMessage('Speed up')">⚡ Speed up</button>
              <button class="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded hover:bg-white/10 text-left" @click="sendMessage('Wrap up')">⏱️ Wrap up</button>
            </div>
            <button
              class="w-full mt-3 px-3 py-2 text-sm bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30"
              @click="sendMessage('Time is up!', true)"
            >
              ⚠️ Time's up!
            </button>
          </div>
          <div class="p-4 mt-auto border-t border-white/10">
            <div class="text-xs text-white/50 mb-2">Viewer link</div>
            <code class="text-xs text-emerald-400 bg-white/5 px-2 py-1 rounded block">/v/{{ roomStore.roomId }}</code>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col">
          <!-- Timer Preview -->
          <div class="flex-1 flex items-center justify-center bg-[#141210]">
            <div v-if="timerStore.selectedTimer" class="text-center">
              <div class="text-white/50 text-sm mb-2">{{ timerStore.selectedTimer.name }}</div>
              <div
                class="text-[12vw] font-mono font-bold tabular-nums leading-none"
                :class="colorClass(timerStore.selectedTimerId!)"
              >
                {{ timerStore.getFormattedTime(timerStore.selectedTimerId!) }}
              </div>
              <div
                v-if="timerStore.selectedTimer.isOnAir"
                class="inline-block mt-4 px-3 py-1 text-xs font-medium bg-red-500 text-white rounded"
              >
                ON AIR
              </div>
            </div>
            <div v-else class="text-white/30">Select a timer</div>
          </div>

          <!-- Transport Controls -->
          <div class="h-20 border-t border-white/10 flex items-center justify-center gap-3 px-4 bg-[#1a1714]">
            <template v-if="timerStore.selectedTimerId">
              <button class="px-3 py-2 text-sm bg-white/10 rounded hover:bg-white/20" @click="adjust(timerStore.selectedTimerId!, -60)">-1m</button>
              <button class="px-3 py-2 text-sm bg-white/10 rounded hover:bg-white/20" @click="reset(timerStore.selectedTimerId!)">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clip-rule="evenodd" /></svg>
              </button>
              <button
                class="w-16 h-10 rounded font-medium transition-colors"
                :class="timerStore.selectedTimer?.status === 'running' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'"
                @click="timerStore.selectedTimer?.status === 'running' ? pause(timerStore.selectedTimerId!) : play(timerStore.selectedTimerId!)"
              >
                {{ timerStore.selectedTimer?.status === 'running' ? 'Stop' : 'Start' }}
              </button>
              <button class="px-3 py-2 text-sm bg-white/10 rounded hover:bg-white/20" @click="adjust(timerStore.selectedTimerId!, 60)">+1m</button>
              <button class="px-3 py-2 text-sm bg-white/10 rounded hover:bg-white/20" @click="handleOpenSettings()">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>
              </button>
            </template>
          </div>
        </main>

        <!-- Right Sidebar: Timer List -->
        <aside class="w-80 border-l border-white/10 flex flex-col">
          <div class="p-3 border-b border-white/10 flex items-center justify-between">
            <span class="text-sm font-medium">Timers</span>
            <button class="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20" @click="handleAddTimer">+ Add</button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div
              v-for="timer in timerStore.timerList"
              :key="timer.id"
              class="p-3 border-b border-white/10 cursor-pointer transition-colors"
              :class="timerStore.selectedTimerId === timer.id ? 'bg-white/10' : 'hover:bg-white/5'"
              @click="timerStore.selectTimer(timer.id)"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">{{ timer.name }}</span>
                <span
                  v-if="timer.isOnAir"
                  class="px-1.5 py-0.5 text-[10px] font-medium bg-red-500 text-white rounded"
                >LIVE</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-2xl font-mono tabular-nums" :class="colorClass(timer.id)">
                  {{ timerStore.getFormattedTime(timer.id) }}
                </span>
                <div class="flex gap-1">
                  <button
                    class="p-1.5 text-xs rounded transition-colors"
                    :class="timer.status === 'running' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20'"
                    @click.stop="timer.status === 'running' ? pause(timer.id) : play(timer.id)"
                  >
                    {{ timer.status === 'running' ? '⏸' : '▶' }}
                  </button>
                  <button
                    class="p-1.5 text-xs bg-white/10 rounded hover:bg-white/20"
                    @click.stop="roomStore.setTimerOnAir(timer.id)"
                  >
                    📡
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <!-- Fullscreen -->
    <div v-if="isFullscreen" class="h-screen flex items-center justify-center bg-black">
      <div
        v-if="timerStore.selectedTimerId"
        class="text-[25vw] font-mono font-bold tabular-nums"
        :class="colorClass(timerStore.selectedTimerId)"
      >
        {{ timerStore.getFormattedTime(timerStore.selectedTimerId) }}
      </div>
    </div>

    <!-- Modals -->
    <SettingsPanel v-model:open="showSettings" />
    <SharePanel v-model:open="showShare" />
  </div>
</template>
