import type { RoomState, Timer, TimerState, TimerSettings } from '../types/room.js'
import { DEFAULT_TIMER_SETTINGS } from '../types/room.js'

class RoomManager {
  private rooms = new Map<string, RoomState>()
  private readonly TTL = 24 * 60 * 60 * 1000 // 24 hours
  private timerCounter = new Map<string, number>() // Track timer IDs per room

  generateRoomId(): string {
    // Format: XXXX-XXXX (8 chars, uppercase alphanumeric)
    // Exclude confusing characters: O/0, I/1, L
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let id = ''
    for (let i = 0; i < 8; i++) {
      if (i === 4) id += '-'
      id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
  }

  generateTimerId(roomId: string): string {
    const normalizedId = roomId.toUpperCase()
    const count = (this.timerCounter.get(normalizedId) || 0) + 1
    this.timerCounter.set(normalizedId, count)
    return `t${count}`
  }

  createRoom(): RoomState {
    const roomId = this.generateRoomId()
    const room: RoomState = {
      roomId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      controllerSocketId: null,
      timers: new Map<string, Timer>(),
      activeTimerId: null
    }
    this.rooms.set(roomId, room)
    this.timerCounter.set(roomId, 0)
    this.cleanup()
    console.log(`Room created: ${roomId}`)
    return room
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId.toUpperCase())
  }

  // Timer CRUD operations
  createTimer(roomId: string, name: string, duration?: number): Timer | null {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return null

    const timerId = this.generateTimerId(roomId)
    const settings: TimerSettings = {
      ...DEFAULT_TIMER_SETTINGS,
      duration: duration ?? DEFAULT_TIMER_SETTINGS.duration
    }

    const timer: Timer = {
      id: timerId,
      name: name || `Timer ${room.timers.size + 1}`,
      settings,
      remainingSeconds: settings.duration,
      elapsedSeconds: 0,
      status: 'stopped',
      isOnAir: room.timers.size === 0 // First timer is automatically On Air
    }

    room.timers.set(timerId, timer)
    if (timer.isOnAir) {
      room.activeTimerId = timerId
    }
    room.lastActivity = Date.now()

    console.log(`Timer created in room ${roomId}: ${timerId} (${timer.name})`)
    return timer
  }

  deleteTimer(roomId: string, timerId: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return false

    const timer = room.timers.get(timerId)
    if (!timer) return false

    const wasOnAir = timer.isOnAir
    room.timers.delete(timerId)

    // If deleted timer was On Air, assign to first remaining timer
    if (wasOnAir && room.timers.size > 0) {
      const firstTimer = room.timers.values().next().value
      if (firstTimer) {
        firstTimer.isOnAir = true
        room.activeTimerId = firstTimer.id
      }
    } else if (room.timers.size === 0) {
      room.activeTimerId = null
    }

    room.lastActivity = Date.now()
    console.log(`Timer deleted from room ${roomId}: ${timerId}`)
    return true
  }

  renameTimer(roomId: string, timerId: string, name: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return false

    const timer = room.timers.get(timerId)
    if (!timer) return false

    timer.name = name
    room.lastActivity = Date.now()
    return true
  }

  updateTimerState(roomId: string, timerId: string, state: Partial<TimerState>): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return false

    const timer = room.timers.get(timerId)
    if (!timer) return false

    // Update timer state
    if (state.settings) timer.settings = { ...timer.settings, ...state.settings }
    if (state.remainingSeconds !== undefined) timer.remainingSeconds = state.remainingSeconds
    if (state.elapsedSeconds !== undefined) timer.elapsedSeconds = state.elapsedSeconds
    if (state.status !== undefined) timer.status = state.status

    room.lastActivity = Date.now()
    return true
  }

  setActiveTimer(roomId: string, timerId: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return false

    const timer = room.timers.get(timerId)
    if (!timer) return false

    // Clear all On Air flags
    for (const t of room.timers.values()) {
      t.isOnAir = false
    }

    // Set new On Air timer
    timer.isOnAir = true
    room.activeTimerId = timerId
    room.lastActivity = Date.now()

    console.log(`Timer set On Air in room ${roomId}: ${timerId}`)
    return true
  }

  getTimer(roomId: string, timerId: string): Timer | undefined {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return undefined
    return room.timers.get(timerId)
  }

  getTimers(roomId: string): Timer[] {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return []
    return Array.from(room.timers.values())
  }

  getActiveTimer(roomId: string): Timer | undefined {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room || !room.activeTimerId) return undefined
    return room.timers.get(room.activeTimerId)
  }

  setController(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return false
    room.controllerSocketId = socketId
    room.lastActivity = Date.now()
    return true
  }

  isController(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    return room?.controllerSocketId === socketId
  }

  deleteRoom(roomId: string): void {
    const normalizedId = roomId.toUpperCase()
    this.rooms.delete(normalizedId)
    this.timerCounter.delete(normalizedId)
    console.log(`Room deleted: ${roomId}`)
  }

  getRoomCount(): number {
    return this.rooms.size
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    for (const [id, room] of this.rooms) {
      if (now - room.lastActivity > this.TTL) {
        this.rooms.delete(id)
        this.timerCounter.delete(id)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired rooms`)
    }
  }
}

export const roomManager = new RoomManager()
