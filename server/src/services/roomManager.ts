import type { RoomState, TimerState } from '../types/room.js'

class RoomManager {
  private rooms = new Map<string, RoomState>()
  private readonly TTL = 24 * 60 * 60 * 1000 // 24 hours

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

  createRoom(): RoomState {
    const roomId = this.generateRoomId()
    const room: RoomState = {
      roomId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timerState: null,
      controllerSocketId: null
    }
    this.rooms.set(roomId, room)
    this.cleanup()
    console.log(`Room created: ${roomId}`)
    return room
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId.toUpperCase())
  }

  updateTimerState(roomId: string, state: TimerState): boolean {
    const room = this.rooms.get(roomId.toUpperCase())
    if (!room) return false
    room.timerState = state
    room.lastActivity = Date.now()
    return true
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
    this.rooms.delete(roomId.toUpperCase())
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
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired rooms`)
    }
  }
}

export const roomManager = new RoomManager()
