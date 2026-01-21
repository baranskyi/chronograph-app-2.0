<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimerStore } from '../stores/timerStore'
import type { TimerMode } from '../types/timer'
import { X } from 'lucide-vue-next'

const store = useTimerStore()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// Local state for form inputs
const durationMinutes = ref(Math.floor(store.settings.duration / 60))
const durationSeconds = ref(store.settings.duration % 60)
const yellowMinutes = ref(Math.floor(store.settings.yellowThreshold / 60))
const yellowSeconds = ref(store.settings.yellowThreshold % 60)
const redMinutes = ref(Math.floor(store.settings.redThreshold / 60))
const redSeconds = ref(store.settings.redThreshold % 60)
const currentMode = ref<TimerMode>(store.settings.mode)

// Sync local state when dialog opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    durationMinutes.value = Math.floor(store.settings.duration / 60)
    durationSeconds.value = store.settings.duration % 60
    yellowMinutes.value = Math.floor(store.settings.yellowThreshold / 60)
    yellowSeconds.value = store.settings.yellowThreshold % 60
    redMinutes.value = Math.floor(store.settings.redThreshold / 60)
    redSeconds.value = store.settings.redThreshold % 60
    currentMode.value = store.settings.mode
  }
})

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
  yellowMinutes.value = Math.max(1, Math.floor(minutes * 0.2))
  yellowSeconds.value = 0
  redMinutes.value = Math.max(0, Math.floor(minutes * 0.1))
  redSeconds.value = 30
  saveSettings()
}

function saveSettings() {
  const timerId = store.selectedTimerId
  if (!timerId) return

  const duration = durationMinutes.value * 60 + durationSeconds.value
  const yellowThreshold = yellowMinutes.value * 60 + yellowSeconds.value
  const redThreshold = redMinutes.value * 60 + redSeconds.value

  store.updateSettings(timerId, {
    duration,
    yellowThreshold,
    redThreshold,
  })
  store.setDuration(timerId, duration)
}

function handleModeChange(mode: TimerMode) {
  const timerId = store.selectedTimerId
  if (!timerId) return
  currentMode.value = mode
  store.setMode(timerId, mode)
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

function handleSoundToggle() {
  if (store.selectedTimerId) {
    store.updateSettings(store.selectedTimerId, { soundEnabled: !store.settings.soundEnabled })
  }
}

function handleOvertimeToggle() {
  if (store.selectedTimerId) {
    store.updateSettings(store.selectedTimerId, { overtimeEnabled: !store.settings.overtimeEnabled })
  }
}

function closeDialog() {
  emit('update:open', false)
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeDialog()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="settings-modal">
      <div
        v-if="props.open"
        class="settings-backdrop"
        @click="handleBackdropClick"
        @keydown.escape="closeDialog"
      >
        <div class="settings-panel">
          <!-- Header -->
          <div class="settings-header">
            <h2 class="settings-title">Settings</h2>
            <button class="close-button" @click="closeDialog">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="settings-content">
            <!-- Timer Mode -->
            <div class="settings-section">
              <label class="section-label">Mode</label>
              <div class="mode-tabs">
                <button
                  class="mode-tab"
                  :class="{ active: currentMode === 'countdown' }"
                  @click="handleModeChange('countdown')"
                >
                  Countdown
                </button>
                <button
                  class="mode-tab"
                  :class="{ active: currentMode === 'countup' }"
                  @click="handleModeChange('countup')"
                >
                  Count Up
                </button>
                <button
                  class="mode-tab"
                  :class="{ active: currentMode === 'clock' }"
                  @click="handleModeChange('clock')"
                >
                  Clock
                </button>
              </div>
            </div>

            <!-- Duration Presets -->
            <div v-if="currentMode === 'countdown'" class="settings-section">
              <label class="section-label">Quick Set (minutes)</label>
              <div class="presets-grid">
                <button
                  v-for="preset in presets"
                  :key="preset.seconds"
                  class="preset-button"
                  :class="{ active: isPresetActive(preset.seconds) }"
                  @click="applyPreset(preset.seconds)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <!-- Custom Duration -->
            <div v-if="currentMode === 'countdown'" class="settings-section">
              <label class="section-label">Duration</label>
              <div class="duration-picker">
                <div class="time-column">
                  <button class="spin-button" @click="incrementMinutes('duration')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  </button>
                  <div class="time-value">{{ durationMinutes.toString().padStart(2, '0') }}</div>
                  <button class="spin-button" @click="decrementMinutes('duration')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <span class="time-label">min</span>
                </div>
                <span class="time-separator">:</span>
                <div class="time-column">
                  <button class="spin-button" @click="incrementSeconds('duration')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                  </button>
                  <div class="time-value">{{ durationSeconds.toString().padStart(2, '0') }}</div>
                  <button class="spin-button" @click="decrementSeconds('duration')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <span class="time-label">sec</span>
                </div>
              </div>
            </div>

            <!-- Warning Thresholds -->
            <div v-if="currentMode === 'countdown'" class="settings-section">
              <label class="section-label">Warning Thresholds</label>
              <div class="thresholds-list">
                <!-- Yellow Warning -->
                <div class="threshold-row">
                  <div class="threshold-label">
                    <div class="threshold-dot yellow"></div>
                    <span>Yellow warning</span>
                  </div>
                  <div class="threshold-controls">
                    <div class="mini-spinner">
                      <button @click="decrementMinutes('yellow')">−</button>
                      <span>{{ yellowMinutes }}</span>
                      <button @click="incrementMinutes('yellow')">+</button>
                    </div>
                    <span class="mini-separator">:</span>
                    <div class="mini-spinner">
                      <button @click="decrementSeconds('yellow')">−</button>
                      <span>{{ yellowSeconds.toString().padStart(2, '0') }}</span>
                      <button @click="incrementSeconds('yellow')">+</button>
                    </div>
                  </div>
                </div>

                <!-- Red Warning -->
                <div class="threshold-row">
                  <div class="threshold-label">
                    <div class="threshold-dot red"></div>
                    <span>Red warning</span>
                  </div>
                  <div class="threshold-controls">
                    <div class="mini-spinner">
                      <button @click="decrementMinutes('red')">−</button>
                      <span>{{ redMinutes }}</span>
                      <button @click="incrementMinutes('red')">+</button>
                    </div>
                    <span class="mini-separator">:</span>
                    <div class="mini-spinner">
                      <button @click="decrementSeconds('red')">−</button>
                      <span>{{ redSeconds.toString().padStart(2, '0') }}</span>
                      <button @click="incrementSeconds('red')">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Options -->
            <div class="settings-section">
              <label class="section-label">Options</label>
              <div class="options-list">
                <!-- Sound Toggle -->
                <div class="option-row">
                  <div class="option-info">
                    <div class="option-icon purple">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                      </svg>
                    </div>
                    <span>Play sound when timer ends</span>
                  </div>
                  <div
                    class="toggle-switch"
                    :class="{ active: store.settings.soundEnabled }"
                    @click="handleSoundToggle"
                  >
                    <div class="toggle-track">
                      <div class="toggle-thumb"></div>
                    </div>
                  </div>
                </div>

                <!-- Overtime Toggle -->
                <div v-if="currentMode === 'countdown'" class="option-row">
                  <div class="option-info">
                    <div class="option-icon orange">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    </div>
                    <span>Continue after zero (overtime)</span>
                  </div>
                  <div
                    class="toggle-switch"
                    :class="{ active: store.settings.overtimeEnabled }"
                    @click="handleOvertimeToggle"
                  >
                    <div class="toggle-track">
                      <div class="toggle-thumb"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="settings-section shortcuts-section">
              <label class="section-label">Shortcuts</label>
              <div class="shortcuts-grid">
                <div class="shortcut-item">
                  <kbd>Space</kbd>
                  <span>Play/Pause</span>
                </div>
                <div class="shortcut-item">
                  <kbd>R</kbd>
                  <span>Reset</span>
                </div>
                <div class="shortcut-item">
                  <kbd>F</kbd>
                  <span>Fullscreen</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.settings-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

/* Panel */
.settings-panel {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 48px);
  background: linear-gradient(
    180deg,
    rgba(30, 32, 38, 0.92) 0%,
    rgba(20, 22, 28, 0.95) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.5),
    0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

/* Header */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.settings-title {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
}

.close-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

/* Content */
.settings-content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(100vh - 150px);
}

/* Section */
.settings-section {
  margin-bottom: 28px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 14px;
}

/* Mode Tabs */
.mode-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-tab {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.mode-tab:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.mode-tab.active {
  color: white;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.8) 0%,
    rgba(220, 38, 38, 0.9) 100%
  );
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Presets Grid */
.presets-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.preset-button {
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

.preset-button.active {
  color: white;
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.7) 0%,
    rgba(220, 38, 38, 0.8) 100%
  );
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}

/* Duration Picker */
.duration-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.time-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.spin-button {
  width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;
}

.spin-button:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.spin-button:active {
  transform: scale(0.95);
}

.time-value {
  font-size: 48px;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  color: white;
  line-height: 1;
  min-width: 80px;
  text-align: center;
}

.time-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
}

.time-separator {
  font-size: 36px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 24px;
}

/* Thresholds */
.thresholds-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.threshold-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.threshold-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.threshold-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.threshold-dot.yellow {
  background: #eab308;
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.5);
}

.threshold-dot.red {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.threshold-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-spinner {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.mini-spinner button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mini-spinner button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mini-spinner span {
  min-width: 32px;
  text-align: center;
  font-size: 14px;
  font-family: ui-monospace, monospace;
  color: white;
}

.mini-separator {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

/* Options */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.option-info {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.option-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.option-icon.purple {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.option-icon.orange {
  background: rgba(249, 115, 22, 0.2);
  color: #f97316;
}

/* Toggle Switch */
.toggle-switch {
  width: 52px;
  height: 28px;
  cursor: pointer;
}

.toggle-track {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-switch.active .toggle-track {
  background: linear-gradient(
    180deg,
    rgba(239, 68, 68, 0.8) 0%,
    rgba(220, 38, 38, 0.9) 100%
  );
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 12px rgba(239, 68, 68, 0.3);
}

.toggle-switch.active .toggle-thumb {
  left: 26px;
}

/* Shortcuts */
.shortcuts-section {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.shortcut-item kbd {
  padding: 6px 10px;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

/* Modal Animation */
.settings-modal-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.settings-modal-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-modal-enter-from,
.settings-modal-leave-to {
  opacity: 0;
}

.settings-modal-enter-from .settings-panel,
.settings-modal-leave-to .settings-panel {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* Scrollbar */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: transparent;
}

.settings-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
