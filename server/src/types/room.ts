export type TimerMode = 'countdown' | 'countup' | 'clock'
export type TimerStatus = 'stopped' | 'running' | 'paused'

export interface TimerSettings {
  duration: number
  yellowThreshold: number
  redThreshold: number
  mode: TimerMode
  soundEnabled: boolean
  overtimeEnabled: boolean
}

export interface TimerState {
  settings: TimerSettings
  remainingSeconds: number
  elapsedSeconds: number
  status: TimerStatus
}

// Multi-timer support
export interface Timer {
  id: string              // e.g. "t1", "t2"
  name: string            // e.g. "Timer 1", "Hall A"
  settings: TimerSettings
  remainingSeconds: number
  elapsedSeconds: number
  status: TimerStatus
  isOnAir: boolean        // Only one timer can be "On Air"
}

export interface RoomState {
  roomId: string
  createdAt: number
  lastActivity: number
  controllerSocketId: string | null
  // Multi-timer support
  timers: Map<string, Timer>
  activeTimerId: string | null  // Which timer is currently "On Air"
}

export type MessagePriority = 'normal' | 'urgent'

export interface SpeakerMessage {
  text: string
  duration: number  // ms, default 5000
  priority: MessagePriority
}

// Default timer settings
export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  duration: 5 * 60, // 5 minutes
  yellowThreshold: 60,
  redThreshold: 30,
  mode: 'countdown',
  soundEnabled: true,
  overtimeEnabled: true
}
