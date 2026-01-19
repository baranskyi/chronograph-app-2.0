import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Timer, TimerSettings, TimerStatus, TimerMode, TimerColorState } from '../types/timer'
import { DEFAULT_SETTINGS, getTimerColorState, formatTime } from '../types/timer'

export const useTimerStore = defineStore('timer', () => {
  // Multi-timer state
  const timers = reactive(new Map<string, Timer>())
  const selectedTimerId = ref<string | null>(null)
  const activeTimerId = ref<string | null>(null) // "On Air" timer

  // Interval IDs for running timers
  const intervalIds = new Map<string, number>()

  // Computed: All timers as array (sorted by creation order)
  const timerList = computed(() => Array.from(timers.values()))

  // Computed: Selected timer (for UI editing)
  const selectedTimer = computed(() =>
    selectedTimerId.value ? timers.get(selectedTimerId.value) : null
  )

  // Computed: Active "On Air" timer
  const activeTimer = computed(() =>
    activeTimerId.value ? timers.get(activeTimerId.value) : null
  )

  // Computed: Get color state for a timer
  function getColorState(timerId: string): TimerColorState {
    const timer = timers.get(timerId)
    if (!timer) return 'green'
    if (timer.settings.mode === 'clock') return 'green'
    return getTimerColorState(timer)
  }

  // Computed: Get formatted time for a timer
  function getFormattedTime(timerId: string): string {
    const timer = timers.get(timerId)
    if (!timer) return '00:00'

    if (timer.settings.mode === 'clock') {
      return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    if (timer.settings.mode === 'countup') {
      return formatTime(timer.elapsedSeconds)
    }

    return formatTime(timer.remainingSeconds)
  }

  // Check if timer is in overtime
  function isOvertime(timerId: string): boolean {
    const timer = timers.get(timerId)
    if (!timer) return false
    return timer.remainingSeconds < 0 && timer.settings.mode === 'countdown'
  }

  // Actions: Timer CRUD
  function addTimer(timer: Timer) {
    timers.set(timer.id, { ...timer })
    if (timer.isOnAir) {
      activeTimerId.value = timer.id
    }
    // Select first timer if none selected
    if (!selectedTimerId.value) {
      selectedTimerId.value = timer.id
    }
  }

  function addTimers(timerArray: Timer[]) {
    timerArray.forEach(t => {
      timers.set(t.id, { ...t })
      if (t.isOnAir) {
        activeTimerId.value = t.id
      }
    })
    // Select first timer if none selected
    if (!selectedTimerId.value && timerArray.length > 0) {
      const firstTimer = timerArray[0]
      if (firstTimer) {
        selectedTimerId.value = firstTimer.id
      }
    }
  }

  function removeTimer(timerId: string) {
    stopTimer(timerId)
    timers.delete(timerId)

    // Update selections if needed
    if (selectedTimerId.value === timerId) {
      const remaining = Array.from(timers.keys())
      const first = remaining[0]
      selectedTimerId.value = first ?? null
    }
    if (activeTimerId.value === timerId) {
      const remaining = Array.from(timers.keys())
      const first = remaining[0]
      activeTimerId.value = first ?? null
    }
  }

  function updateTimer(timerId: string, updates: Partial<Timer>) {
    const timer = timers.get(timerId)
    if (!timer) return

    Object.assign(timer, updates)
  }

  function selectTimer(timerId: string) {
    if (timers.has(timerId)) {
      selectedTimerId.value = timerId
    }
  }

  function setOnAir(timerId: string) {
    // Clear all isOnAir flags
    for (const t of timers.values()) {
      t.isOnAir = false
    }
    // Set new On Air timer
    const timer = timers.get(timerId)
    if (timer) {
      timer.isOnAir = true
      activeTimerId.value = timerId
    }
  }

  // Actions: Timer controls
  function startTimer(timerId: string) {
    const timer = timers.get(timerId)
    if (!timer || timer.status === 'running') return

    timer.status = 'running'

    const id = window.setInterval(() => {
      tickTimer(timerId)
    }, 1000)
    intervalIds.set(timerId, id)
  }

  function pauseTimer(timerId: string) {
    const timer = timers.get(timerId)
    if (!timer || timer.status !== 'running') return

    timer.status = 'paused'

    const intervalId = intervalIds.get(timerId)
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervalIds.delete(timerId)
    }
  }

  function stopTimer(timerId: string) {
    const timer = timers.get(timerId)
    if (!timer) return

    timer.status = 'stopped'

    const intervalId = intervalIds.get(timerId)
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervalIds.delete(timerId)
    }
  }

  function resetTimer(timerId: string) {
    stopTimer(timerId)
    const timer = timers.get(timerId)
    if (!timer) return

    timer.remainingSeconds = timer.settings.duration
    timer.elapsedSeconds = 0
  }

  function tickTimer(timerId: string) {
    const timer = timers.get(timerId)
    if (!timer) return

    timer.elapsedSeconds++

    if (timer.settings.mode === 'countdown') {
      timer.remainingSeconds--

      // Check if timer reached zero
      if (timer.remainingSeconds === 0) {
        if (!timer.settings.overtimeEnabled) {
          stopTimer(timerId)
        }
      }
    }
  }

  function adjustTime(timerId: string, seconds: number) {
    const timer = timers.get(timerId)
    if (!timer) return

    timer.remainingSeconds += seconds
    if (timer.remainingSeconds < 0 && !timer.settings.overtimeEnabled) {
      timer.remainingSeconds = 0
    }
  }

  function setDuration(timerId: string, seconds: number) {
    const timer = timers.get(timerId)
    if (!timer) return

    timer.settings.duration = seconds
    if (timer.status === 'stopped') {
      timer.remainingSeconds = seconds
    }
  }

  function setMode(timerId: string, mode: TimerMode) {
    const timer = timers.get(timerId)
    if (!timer) return

    timer.settings.mode = mode
    resetTimer(timerId)
  }

  function updateSettings(timerId: string, settings: Partial<TimerSettings>) {
    const timer = timers.get(timerId)
    if (!timer) return

    timer.settings = { ...timer.settings, ...settings }
  }

  // State sync for socket communication
  function getTimerStateForSync(timerId: string) {
    const timer = timers.get(timerId)
    if (!timer) return null

    return {
      settings: { ...timer.settings },
      remainingSeconds: timer.remainingSeconds,
      elapsedSeconds: timer.elapsedSeconds,
      status: timer.status
    }
  }

  function applyRemoteTimerState(timerId: string, state: {
    settings?: TimerSettings
    remainingSeconds?: number
    elapsedSeconds?: number
    status?: TimerStatus
  }) {
    const timer = timers.get(timerId)
    if (!timer) return

    if (state.settings) timer.settings = { ...state.settings }
    if (state.remainingSeconds !== undefined) timer.remainingSeconds = state.remainingSeconds
    if (state.elapsedSeconds !== undefined) timer.elapsedSeconds = state.elapsedSeconds
    if (state.status !== undefined) timer.status = state.status
  }

  // Clear all timers
  function clearAllTimers() {
    for (const id of intervalIds.keys()) {
      clearInterval(intervalIds.get(id))
    }
    intervalIds.clear()
    timers.clear()
    selectedTimerId.value = null
    activeTimerId.value = null
  }

  // Legacy compatibility: single timer methods for existing components
  const settings = computed(() => selectedTimer.value?.settings ?? DEFAULT_SETTINGS)
  const remainingSeconds = computed(() => selectedTimer.value?.remainingSeconds ?? 0)
  const elapsedSeconds = computed(() => selectedTimer.value?.elapsedSeconds ?? 0)
  const status = computed(() => selectedTimer.value?.status ?? 'stopped')
  const isRunning = computed(() => selectedTimer.value?.status === 'running')
  const isPaused = computed(() => selectedTimer.value?.status === 'paused')
  const isStopped = computed(() => selectedTimer.value?.status === 'stopped')
  const isOvertimeComputed = computed(() => selectedTimerId.value ? isOvertime(selectedTimerId.value) : false)
  const colorState = computed(() => selectedTimerId.value ? getColorState(selectedTimerId.value) : 'green')
  const displaySeconds = computed(() => {
    if (!selectedTimer.value) return 0
    if (selectedTimer.value.settings.mode === 'countup') return selectedTimer.value.elapsedSeconds
    return selectedTimer.value.remainingSeconds
  })
  const formattedTime = computed(() => selectedTimerId.value ? getFormattedTime(selectedTimerId.value) : '00:00')

  // Legacy single timer actions (operate on selected timer)
  function start() {
    if (selectedTimerId.value) startTimer(selectedTimerId.value)
  }
  function pause() {
    if (selectedTimerId.value) pauseTimer(selectedTimerId.value)
  }
  function stop() {
    if (selectedTimerId.value) stopTimer(selectedTimerId.value)
  }
  function reset() {
    if (selectedTimerId.value) resetTimer(selectedTimerId.value)
  }

  // Timer order tracking
  const timerOrder = ref<string[]>([])

  // Computed: All timers as array (sorted by order)
  const orderedTimerList = computed(() => {
    if (timerOrder.value.length === 0) {
      return Array.from(timers.values())
    }
    return timerOrder.value
      .map(id => timers.get(id))
      .filter((t): t is Timer => t !== undefined)
  })

  // Update order when timers change
  function syncTimerOrder() {
    const currentIds = Array.from(timers.keys())
    // Add new timers to order
    for (const id of currentIds) {
      if (!timerOrder.value.includes(id)) {
        timerOrder.value.push(id)
      }
    }
    // Remove deleted timers from order
    timerOrder.value = timerOrder.value.filter(id => timers.has(id))
  }

  // Reorder timers by moving sourceId to targetId's position
  function reorderTimers(sourceId: string, targetId: string) {
    syncTimerOrder()
    const sourceIndex = timerOrder.value.indexOf(sourceId)
    const targetIndex = timerOrder.value.indexOf(targetId)

    if (sourceIndex === -1 || targetIndex === -1) return

    // Remove source from array
    const newOrder = [...timerOrder.value]
    newOrder.splice(sourceIndex, 1)
    // Insert at target position
    newOrder.splice(targetIndex, 0, sourceId)

    timerOrder.value = newOrder
  }

  return {
    // Multi-timer state
    timers,
    selectedTimerId,
    activeTimerId,
    timerList,
    orderedTimerList,
    timerOrder,
    syncTimerOrder,
    selectedTimer,
    activeTimer,

    // Multi-timer methods
    addTimer,
    addTimers,
    removeTimer,
    reorderTimers,
    updateTimer,
    selectTimer,
    setOnAir,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    adjustTime,
    setDuration,
    setMode,
    updateSettings,
    getColorState,
    getFormattedTime,
    checkIsOvertime: isOvertime,
    getTimerStateForSync,
    applyRemoteTimerState,
    clearAllTimers,

    // Legacy compatibility (selected timer)
    settings,
    remainingSeconds,
    elapsedSeconds,
    status,
    isRunning,
    isPaused,
    isStopped,
    isOvertime: isOvertimeComputed,
    colorState,
    displaySeconds,
    formattedTime,
    start,
    pause,
    stop,
    reset,
  }
})
