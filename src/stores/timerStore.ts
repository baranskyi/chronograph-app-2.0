import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import type { TimerSettings, TimerStatus, TimerMode, TimerColorState } from '../types/timer'
import { DEFAULT_SETTINGS } from '../types/timer'

export const useTimerStore = defineStore('timer', () => {
  // Persisted settings
  const settings = useStorage<TimerSettings>('chronograph-settings', { ...DEFAULT_SETTINGS })

  // Timer state (not persisted)
  const remainingSeconds = ref(settings.value.duration)
  const elapsedSeconds = ref(0)
  const status = ref<TimerStatus>('stopped')
  const intervalId = ref<number | null>(null)

  // Computed properties
  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isStopped = computed(() => status.value === 'stopped')
  const isOvertime = computed(() => remainingSeconds.value < 0)

  const colorState = computed<TimerColorState>(() => {
    const seconds = remainingSeconds.value
    if (seconds <= settings.value.redThreshold) return 'red'
    if (seconds <= settings.value.yellowThreshold) return 'yellow'
    return 'green'
  })

  const displaySeconds = computed(() => {
    if (settings.value.mode === 'clock') {
      return new Date().getSeconds() + new Date().getMinutes() * 60 + new Date().getHours() * 3600
    }
    if (settings.value.mode === 'countup') {
      return elapsedSeconds.value
    }
    return remainingSeconds.value
  })

  const formattedTime = computed(() => {
    if (settings.value.mode === 'clock') {
      return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const totalSeconds = Math.abs(displaySeconds.value)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const prefix = isOvertime.value && settings.value.mode === 'countdown' ? '-' : ''

    if (hours > 0) {
      return `${prefix}${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${prefix}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // Actions
  function start() {
    if (status.value === 'running') return

    status.value = 'running'
    intervalId.value = window.setInterval(() => {
      tick()
    }, 1000)
  }

  function pause() {
    if (status.value !== 'running') return

    status.value = 'paused'
    if (intervalId.value !== null) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  function stop() {
    status.value = 'stopped'
    if (intervalId.value !== null) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
  }

  function reset() {
    stop()
    remainingSeconds.value = settings.value.duration
    elapsedSeconds.value = 0
  }

  function tick() {
    elapsedSeconds.value++

    if (settings.value.mode === 'countdown') {
      remainingSeconds.value--

      // Check if timer reached zero
      if (remainingSeconds.value === 0) {
        if (!settings.value.overtimeEnabled) {
          stop()
        }
        // Sound will be triggered by watcher in component
      }
    }
  }

  function setDuration(seconds: number) {
    settings.value.duration = seconds
    if (status.value === 'stopped') {
      remainingSeconds.value = seconds
    }
  }

  function setMode(mode: TimerMode) {
    settings.value.mode = mode
    reset()
  }

  function adjustTime(seconds: number) {
    remainingSeconds.value += seconds
    if (remainingSeconds.value < 0 && !settings.value.overtimeEnabled) {
      remainingSeconds.value = 0
    }
  }

  function updateSettings(newSettings: Partial<TimerSettings>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  // Get serializable state for sync (controller sends this)
  function getStateForSync() {
    return {
      settings: { ...settings.value },
      remainingSeconds: remainingSeconds.value,
      elapsedSeconds: elapsedSeconds.value,
      status: status.value
    }
  }

  // Apply state from remote (viewer receives this)
  function applyRemoteState(state: {
    settings: TimerSettings
    remainingSeconds: number
    elapsedSeconds: number
    status: TimerStatus
  }) {
    settings.value = { ...state.settings }
    remainingSeconds.value = state.remainingSeconds
    elapsedSeconds.value = state.elapsedSeconds
    status.value = state.status
  }

  // Watch for duration changes and reset if stopped
  watch(() => settings.value.duration, (newDuration) => {
    if (status.value === 'stopped') {
      remainingSeconds.value = newDuration
    }
  })

  return {
    // State
    settings,
    remainingSeconds,
    elapsedSeconds,
    status,

    // Computed
    isRunning,
    isPaused,
    isStopped,
    isOvertime,
    colorState,
    displaySeconds,
    formattedTime,

    // Actions
    start,
    pause,
    stop,
    reset,
    setDuration,
    setMode,
    adjustTime,
    updateSettings,

    // Sync methods
    getStateForSync,
    applyRemoteState,
  }
})
