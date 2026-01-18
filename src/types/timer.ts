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

export const DEFAULT_SETTINGS: TimerSettings = {
  duration: 5 * 60, // 5 minutes
  yellowThreshold: 60, // 1 minute
  redThreshold: 30, // 30 seconds
  mode: 'countdown',
  soundEnabled: true,
  overtimeEnabled: true,
}
