<script setup lang="ts">
import { ref } from 'vue'
import { useTimerStore } from '../stores/timerStore'
import type { TimerMode } from '../types/timer'

const store = useTimerStore()

const emit = defineEmits<{
  close: []
}>()

// Local state for form inputs
const durationMinutes = ref(Math.floor(store.settings.duration / 60))
const durationSeconds = ref(store.settings.duration % 60)
const yellowMinutes = ref(Math.floor(store.settings.yellowThreshold / 60))
const yellowSeconds = ref(store.settings.yellowThreshold % 60)
const redMinutes = ref(Math.floor(store.settings.redThreshold / 60))
const redSeconds = ref(store.settings.redThreshold % 60)

// Preset durations
const presets = [
  { label: '1', seconds: 60 },
  { label: '3', seconds: 180 },
  { label: '5', seconds: 300 },
  { label: '10', seconds: 600 },
  { label: '15', seconds: 900 },
  { label: '20', seconds: 1200 },
  { label: '30', seconds: 1800 },
  { label: '45', seconds: 2700 },
]

const isPresetActive = (seconds: number) => {
  return store.settings.duration === seconds
}

function applyPreset(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  durationMinutes.value = minutes
  durationSeconds.value = seconds % 60
  // Set reasonable defaults for thresholds
  yellowMinutes.value = Math.max(1, Math.floor(minutes * 0.2))
  yellowSeconds.value = 0
  redMinutes.value = Math.max(0, Math.floor(minutes * 0.1))
  redSeconds.value = 30
  saveSettings()
}

function saveSettings() {
  const duration = durationMinutes.value * 60 + durationSeconds.value
  const yellowThreshold = yellowMinutes.value * 60 + yellowSeconds.value
  const redThreshold = redMinutes.value * 60 + redSeconds.value

  store.updateSettings({
    duration,
    yellowThreshold,
    redThreshold,
  })
  store.setDuration(duration)
}

function handleModeChange(mode: TimerMode) {
  store.setMode(mode)
}

function incrementMinutes(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') durationMinutes.value = Math.min(999, durationMinutes.value + 1)
  else if (type === 'yellow') yellowMinutes.value = Math.min(999, yellowMinutes.value + 1)
  else redMinutes.value = Math.min(999, redMinutes.value + 1)
  saveSettings()
}

function decrementMinutes(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') durationMinutes.value = Math.max(0, durationMinutes.value - 1)
  else if (type === 'yellow') yellowMinutes.value = Math.max(0, yellowMinutes.value - 1)
  else redMinutes.value = Math.max(0, redMinutes.value - 1)
  saveSettings()
}

function incrementSeconds(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') {
    if (durationSeconds.value >= 59) {
      durationSeconds.value = 0
      durationMinutes.value++
    } else {
      durationSeconds.value++
    }
  } else if (type === 'yellow') {
    if (yellowSeconds.value >= 59) {
      yellowSeconds.value = 0
      yellowMinutes.value++
    } else {
      yellowSeconds.value++
    }
  } else {
    if (redSeconds.value >= 59) {
      redSeconds.value = 0
      redMinutes.value++
    } else {
      redSeconds.value++
    }
  }
  saveSettings()
}

function decrementSeconds(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') {
    if (durationSeconds.value <= 0 && durationMinutes.value > 0) {
      durationSeconds.value = 59
      durationMinutes.value--
    } else {
      durationSeconds.value = Math.max(0, durationSeconds.value - 1)
    }
  } else if (type === 'yellow') {
    if (yellowSeconds.value <= 0 && yellowMinutes.value > 0) {
      yellowSeconds.value = 59
      yellowMinutes.value--
    } else {
      yellowSeconds.value = Math.max(0, yellowSeconds.value - 1)
    }
  } else {
    if (redSeconds.value <= 0 && redMinutes.value > 0) {
      redSeconds.value = 59
      redMinutes.value--
    } else {
      redSeconds.value = Math.max(0, redSeconds.value - 1)
    }
  }
  saveSettings()
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    @click.self="emit('close')"
  >
    <div class="bg-[#12121a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-white/5">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 class="text-lg font-semibold text-white">Settings</h2>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="overflow-y-auto max-h-[calc(90vh-64px)] px-6 py-5 space-y-6">
        <!-- Timer Mode -->
        <div>
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Mode</label>
          <div class="flex bg-[#1a1a24] rounded-xl p-1">
            <button
              v-for="mode in (['countdown', 'countup', 'clock'] as TimerMode[])"
              :key="mode"
              class="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
              :class="store.settings.mode === mode
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'"
              @click="handleModeChange(mode)"
            >
              {{ mode === 'countup' ? 'Count Up' : mode === 'countdown' ? 'Countdown' : 'Clock' }}
            </button>
          </div>
        </div>

        <!-- Duration Presets -->
        <div v-if="store.settings.mode === 'countdown'">
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Set (minutes)</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in presets"
              :key="preset.seconds"
              class="w-12 h-12 rounded-xl text-sm font-semibold transition-all"
              :class="isPresetActive(preset.seconds)
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-[#1a1a24] text-gray-300 hover:bg-[#22222e] hover:text-white'"
              @click="applyPreset(preset.seconds)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Custom Duration -->
        <div v-if="store.settings.mode === 'countdown'">
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Duration</label>
          <div class="bg-[#1a1a24] rounded-xl p-4">
            <div class="flex items-center justify-center gap-4">
              <!-- Minutes -->
              <div class="flex flex-col items-center">
                <button
                  class="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  @click="incrementMinutes('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div class="text-4xl font-mono font-bold text-white my-1 w-16 text-center">
                  {{ durationMinutes.toString().padStart(2, '0') }}
                </div>
                <button
                  class="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  @click="decrementMinutes('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span class="text-xs text-gray-500 mt-1">min</span>
              </div>

              <span class="text-3xl font-bold text-gray-600">:</span>

              <!-- Seconds -->
              <div class="flex flex-col items-center">
                <button
                  class="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  @click="incrementSeconds('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div class="text-4xl font-mono font-bold text-white my-1 w-16 text-center">
                  {{ durationSeconds.toString().padStart(2, '0') }}
                </div>
                <button
                  class="w-10 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  @click="decrementSeconds('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span class="text-xs text-gray-500 mt-1">sec</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Warning Thresholds -->
        <div v-if="store.settings.mode === 'countdown'">
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Warning Thresholds</label>
          <div class="space-y-3">
            <!-- Yellow Warning -->
            <div class="bg-[#1a1a24] rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span class="text-sm text-gray-300">Yellow warning</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-[#12121a] rounded-lg">
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="decrementMinutes('yellow')"
                  >−</button>
                  <span class="w-8 text-center font-mono text-white">{{ yellowMinutes }}</span>
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="incrementMinutes('yellow')"
                  >+</button>
                </div>
                <span class="text-xs text-gray-500">:</span>
                <div class="flex items-center bg-[#12121a] rounded-lg">
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="decrementSeconds('yellow')"
                  >−</button>
                  <span class="w-8 text-center font-mono text-white">{{ yellowSeconds.toString().padStart(2, '0') }}</span>
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="incrementSeconds('yellow')"
                  >+</button>
                </div>
              </div>
            </div>

            <!-- Red Warning -->
            <div class="bg-[#1a1a24] rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-sm text-gray-300">Red warning</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-[#12121a] rounded-lg">
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="decrementMinutes('red')"
                  >−</button>
                  <span class="w-8 text-center font-mono text-white">{{ redMinutes }}</span>
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="incrementMinutes('red')"
                  >+</button>
                </div>
                <span class="text-xs text-gray-500">:</span>
                <div class="flex items-center bg-[#12121a] rounded-lg">
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="decrementSeconds('red')"
                  >−</button>
                  <span class="w-8 text-center font-mono text-white">{{ redSeconds.toString().padStart(2, '0') }}</span>
                  <button
                    class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                    @click="incrementSeconds('red')"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div>
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Options</label>
          <div class="space-y-2">
            <!-- Sound Toggle -->
            <div
              class="bg-[#1a1a24] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#1e1e28] transition-colors"
              @click="store.updateSettings({ soundEnabled: !store.settings.soundEnabled })"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <span class="text-sm text-gray-300">Play sound when timer ends</span>
              </div>
              <div
                class="w-11 h-6 rounded-full transition-colors relative"
                :class="store.settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-700'"
              >
                <div
                  class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  :class="store.settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'"
                ></div>
              </div>
            </div>

            <!-- Overtime Toggle -->
            <div
              v-if="store.settings.mode === 'countdown'"
              class="bg-[#1a1a24] rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#1e1e28] transition-colors"
              @click="store.updateSettings({ overtimeEnabled: !store.settings.overtimeEnabled })"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span class="text-sm text-gray-300">Continue after zero (overtime)</span>
              </div>
              <div
                class="w-11 h-6 rounded-full transition-colors relative"
                :class="store.settings.overtimeEnabled ? 'bg-blue-600' : 'bg-gray-700'"
              >
                <div
                  class="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  :class="store.settings.overtimeEnabled ? 'translate-x-6' : 'translate-x-1'"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="pt-4 border-t border-white/5">
          <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Shortcuts</label>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex items-center gap-2 text-gray-500">
              <kbd class="px-2 py-1 bg-[#1a1a24] rounded text-xs font-mono text-gray-400">Space</kbd>
              <span>Play/Pause</span>
            </div>
            <div class="flex items-center gap-2 text-gray-500">
              <kbd class="px-2 py-1 bg-[#1a1a24] rounded text-xs font-mono text-gray-400">R</kbd>
              <span>Reset</span>
            </div>
            <div class="flex items-center gap-2 text-gray-500">
              <kbd class="px-2 py-1 bg-[#1a1a24] rounded text-xs font-mono text-gray-400">F</kbd>
              <span>Fullscreen</span>
            </div>
            <div class="flex items-center gap-2 text-gray-500">
              <kbd class="px-2 py-1 bg-[#1a1a24] rounded text-xs font-mono text-gray-400">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
