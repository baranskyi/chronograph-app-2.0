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
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
  { label: '30 min', seconds: 1800 },
  { label: '45 min', seconds: 2700 },
]

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

// Close on escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    @click.self="emit('close')"
    @keydown="handleKeydown"
  >
    <div class="bg-[var(--color-bg-secondary)] rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold">Settings</h2>
        <button
          class="text-gray-400 hover:text-white transition-colors"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Timer Mode -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-400 mb-2">Timer Mode</label>
        <div class="flex gap-2">
          <button
            v-for="mode in (['countdown', 'countup', 'clock'] as TimerMode[])"
            :key="mode"
            class="btn flex-1 text-sm capitalize"
            :class="store.settings.mode === mode ? 'btn-primary' : 'btn-secondary'"
            @click="handleModeChange(mode)"
          >
            {{ mode === 'countup' ? 'Count Up' : mode === 'countdown' ? 'Countdown' : 'Clock' }}
          </button>
        </div>
      </div>

      <!-- Duration Presets -->
      <div class="mb-6" v-if="store.settings.mode === 'countdown'">
        <label class="block text-sm font-medium text-gray-400 mb-2">Quick Presets</label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="preset in presets"
            :key="preset.seconds"
            class="btn btn-secondary text-sm py-2"
            @click="applyPreset(preset.seconds)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Custom Duration -->
      <div class="mb-6" v-if="store.settings.mode === 'countdown'">
        <label class="block text-sm font-medium text-gray-400 mb-2">Duration</label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            v-model.number="durationMinutes"
            min="0"
            max="999"
            class="w-20 bg-[var(--color-bg)] border border-gray-600 rounded px-3 py-2 text-center"
            @change="saveSettings"
          />
          <span class="text-gray-400">min</span>
          <input
            type="number"
            v-model.number="durationSeconds"
            min="0"
            max="59"
            class="w-20 bg-[var(--color-bg)] border border-gray-600 rounded px-3 py-2 text-center"
            @change="saveSettings"
          />
          <span class="text-gray-400">sec</span>
        </div>
      </div>

      <!-- Warning Thresholds -->
      <div class="mb-6" v-if="store.settings.mode === 'countdown'">
        <label class="block text-sm font-medium text-gray-400 mb-2">
          <span class="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
          Yellow Warning At
        </label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            v-model.number="yellowMinutes"
            min="0"
            max="999"
            class="w-20 bg-[var(--color-bg)] border border-gray-600 rounded px-3 py-2 text-center"
            @change="saveSettings"
          />
          <span class="text-gray-400">min</span>
          <input
            type="number"
            v-model.number="yellowSeconds"
            min="0"
            max="59"
            class="w-20 bg-[var(--color-bg)] border border-gray-600 rounded px-3 py-2 text-center"
            @change="saveSettings"
          />
          <span class="text-gray-400">sec</span>
        </div>
      </div>

      <div class="mb-6" v-if="store.settings.mode === 'countdown'">
        <label class="block text-sm font-medium text-gray-400 mb-2">
          <span class="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          Red Warning At
        </label>
        <div class="flex items-center gap-2">
          <input
            type="number"
            v-model.number="redMinutes"
            min="0"
            max="999"
            class="w-20 bg-[var(--color-bg)] border border-gray-600 rounded px-3 py-2 text-center"
            @change="saveSettings"
          />
          <span class="text-gray-400">min</span>
          <input
            type="number"
            v-model.number="redSeconds"
            min="0"
            max="59"
            class="w-20 bg-[var(--color-bg)] border border-gray-600 rounded px-3 py-2 text-center"
            @change="saveSettings"
          />
          <span class="text-gray-400">sec</span>
        </div>
      </div>

      <!-- Sound & Overtime toggles -->
      <div class="space-y-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            :checked="store.settings.soundEnabled"
            @change="store.updateSettings({ soundEnabled: !store.settings.soundEnabled })"
            class="w-5 h-5 rounded bg-[var(--color-bg)] border-gray-600"
          />
          <span>Play sound when timer ends</span>
        </label>

        <label class="flex items-center gap-3 cursor-pointer" v-if="store.settings.mode === 'countdown'">
          <input
            type="checkbox"
            :checked="store.settings.overtimeEnabled"
            @change="store.updateSettings({ overtimeEnabled: !store.settings.overtimeEnabled })"
            class="w-5 h-5 rounded bg-[var(--color-bg)] border-gray-600"
          />
          <span>Continue counting after zero (overtime)</span>
        </label>
      </div>

      <!-- Keyboard Shortcuts Info -->
      <div class="mt-6 pt-6 border-t border-gray-700">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Keyboard Shortcuts</h3>
        <div class="text-sm text-gray-500 space-y-1">
          <div><kbd class="bg-gray-700 px-2 py-1 rounded">Space</kbd> Play / Pause</div>
          <div><kbd class="bg-gray-700 px-2 py-1 rounded">R</kbd> Reset timer</div>
          <div><kbd class="bg-gray-700 px-2 py-1 rounded">F</kbd> Toggle fullscreen</div>
          <div><kbd class="bg-gray-700 px-2 py-1 rounded">Esc</kbd> Close settings / Exit fullscreen</div>
        </div>
      </div>
    </div>
  </div>
</template>
