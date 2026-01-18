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

export interface RoomState {
  roomId: string
  createdAt: number
  lastActivity: number
  timerState: TimerState | null
  controllerSocketId: string | null
}

export type MessagePriority = 'normal' | 'urgent'

export interface SpeakerMessage {
  text: string
  duration: number  // ms, default 5000
  priority: MessagePriority
}
