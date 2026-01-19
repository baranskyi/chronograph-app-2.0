export type TimerMode = 'countdown' | 'countup' | 'clock'
export type TimerStatus = 'stopped' | 'running' | 'paused'
export type TimerColorState = 'green' | 'yellow' | 'red'

export interface TimerSettings {
  /** Initial duration in seconds */
  duration: number
  /** Yellow warning threshold in seconds */
  yellowThreshold: number
  /** Red warning threshold in seconds */
  redThreshold: number
  /** Timer mode */
  mode: TimerMode
  /** Play sound when timer ends */
  soundEnabled: boolean
  /** Continue counting after zero (overtime) */
  overtimeEnabled: boolean
}

export interface TimerState {
  /** Remaining time in seconds (can be negative in overtime) */
  remainingSeconds: number
  /** Elapsed time in seconds */
  elapsedSeconds: number
  /** Current timer status */
  status: TimerStatus
  /** Current color state based on thresholds */
  colorState: TimerColorState
  /** Is timer in overtime (past zero) */
  isOvertime: boolean
}

// Multi-timer support
export interface Timer {
  id: string
  name: string
  settings: TimerSettings
  remainingSeconds: number
  elapsedSeconds: number
  status: TimerStatus
  isOnAir: boolean
}

export const DEFAULT_SETTINGS: TimerSettings = {
  duration: 5 * 60, // 5 minutes
  yellowThreshold: 60, // 1 minute
  redThreshold: 30, // 30 seconds
  mode: 'countdown',
  soundEnabled: true,
  overtimeEnabled: true,
}

// Helper to create a new timer with default settings
export function createDefaultTimer(id: string, name: string): Timer {
  return {
    id,
    name,
    settings: { ...DEFAULT_SETTINGS },
    remainingSeconds: DEFAULT_SETTINGS.duration,
    elapsedSeconds: 0,
    status: 'stopped',
    isOnAir: false
  }
}

// Helper to get color state from timer
export function getTimerColorState(timer: Timer): TimerColorState {
  const { remainingSeconds, settings } = timer
  if (remainingSeconds <= settings.redThreshold) return 'red'
  if (remainingSeconds <= settings.yellowThreshold) return 'yellow'
  return 'green'
}

// Helper to format time from seconds
export function formatTime(seconds: number, showHours = false): string {
  const totalSeconds = Math.abs(seconds)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const prefix = seconds < 0 ? '-' : ''

  if (h > 0 || showHours) {
    return `${prefix}${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${prefix}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
