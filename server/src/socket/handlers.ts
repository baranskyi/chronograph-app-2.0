import type { Server, Socket } from 'socket.io'
import { roomManager } from '../services/roomManager.js'
import type { Timer, TimerState, MessagePriority } from '../types/room.js'

// Track viewers per room: Map<roomId, Set<socketId>>
const roomViewers = new Map<string, Set<string>>()

// Track which room each viewer socket is in: Map<socketId, roomId>
const viewerRooms = new Map<string, string>()

function getViewerCount(roomId: string): number {
  return roomViewers.get(roomId.toUpperCase())?.size || 0
}

function addViewer(roomId: string, socketId: string): void {
  const normalizedId = roomId.toUpperCase()
  if (!roomViewers.has(normalizedId)) {
    roomViewers.set(normalizedId, new Set())
  }
  roomViewers.get(normalizedId)!.add(socketId)
  viewerRooms.set(socketId, normalizedId)
}

function removeViewer(socketId: string): string | null {
  const roomId = viewerRooms.get(socketId)
  if (roomId) {
    roomViewers.get(roomId)?.delete(socketId)
    viewerRooms.delete(socketId)
    return roomId
  }
  return null
}

interface CreateRoomCallback {
  (response: { roomId: string; timers: Timer[] } | { error: string }): void
}

interface JoinRoomCallback {
  (response: { success: true; timers: Timer[]; activeTimerId: string | null } | { error: string }): void
}

interface TimerCallback {
  (response: { success: true; timer: Timer } | { error: string }): void
}

interface SimpleCallback {
  (response: { success: boolean; error?: string }): void
}

// Convert Timer[] to plain objects for socket transmission
function serializeTimers(timers: Timer[]): Timer[] {
  return timers.map(t => ({ ...t }))
}

export function setupHandlers(io: Server, socket: Socket): void {
  console.log(`Client connected: ${socket.id}`)

  // Controller creates a new room
  socket.on('room:create', (callback: CreateRoomCallback) => {
    try {
      const room = roomManager.createRoom()
      room.controllerSocketId = socket.id
      socket.join(room.roomId)

      // Auto-create first timer
      const timer = roomManager.createTimer(room.roomId, 'Timer 1')
      const timers = timer ? [timer] : []

      callback({ roomId: room.roomId, timers: serializeTimers(timers) })
    } catch (error) {
      console.error('Error creating room:', error)
      callback({ error: 'Failed to create room' })
    }
  })

  // Controller rejoins existing room (reconnect)
  socket.on('room:join-controller', (
    { roomId }: { roomId: string },
    callback: JoinRoomCallback
  ) => {
    const room = roomManager.getRoom(roomId)
    if (!room) {
      callback({ error: 'Room not found' })
      return
    }
    room.controllerSocketId = socket.id
    room.lastActivity = Date.now()
    socket.join(room.roomId)
    console.log(`Controller rejoined room: ${roomId}`)

    const timers = roomManager.getTimers(roomId)
    callback({ success: true, timers: serializeTimers(timers), activeTimerId: room.activeTimerId })
  })

  // Viewer joins a room
  socket.on('room:join-viewer', (
    { roomId, timerId }: { roomId: string; timerId?: string },
    callback: JoinRoomCallback
  ) => {
    const room = roomManager.getRoom(roomId)
    if (!room) {
      callback({ error: 'Room not found' })
      return
    }
    socket.join(room.roomId)

    // If specific timer requested, join that timer's sub-room
    if (timerId) {
      socket.join(`${room.roomId}:${timerId}`)
    }

    // Track viewer and notify controller
    addViewer(room.roomId, socket.id)
    const viewerCount = getViewerCount(room.roomId)

    // Notify controller about viewer count change
    if (room.controllerSocketId) {
      io.to(room.controllerSocketId).emit('room:viewer-count', { count: viewerCount })
    }

    console.log(`Viewer joined room: ${roomId}${timerId ? ` (timer: ${timerId})` : ''} (viewers: ${viewerCount})`)

    const timers = roomManager.getTimers(roomId)
    callback({ success: true, timers: serializeTimers(timers), activeTimerId: room.activeTimerId })
  })

  // Create a new timer
  socket.on('timer:create', (
    { roomId, name, duration }: { roomId: string; name?: string; duration?: number },
    callback: TimerCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ error: 'Not authorized' })
      return
    }

    const timer = roomManager.createTimer(roomId, name || '', duration)
    if (!timer) {
      callback({ error: 'Failed to create timer' })
      return
    }

    // Broadcast to all clients in the room
    io.to(roomId.toUpperCase()).emit('timer:created', { ...timer })
    callback({ success: true, timer: { ...timer } })
  })

  // Delete a timer
  socket.on('timer:delete', (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    const success = roomManager.deleteTimer(roomId, timerId)
    if (!success) {
      callback({ success: false, error: 'Timer not found' })
      return
    }

    const room = roomManager.getRoom(roomId)
    io.to(roomId.toUpperCase()).emit('timer:deleted', { timerId, newActiveTimerId: room?.activeTimerId })
    callback({ success: true })
  })

  // Rename a timer
  socket.on('timer:rename', (
    { roomId, timerId, name }: { roomId: string; timerId: string; name: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    const success = roomManager.renameTimer(roomId, timerId, name)
    if (!success) {
      callback({ success: false, error: 'Timer not found' })
      return
    }

    io.to(roomId.toUpperCase()).emit('timer:renamed', { timerId, name })
    callback({ success: true })
  })

  // Set timer as "On Air"
  socket.on('timer:set-on-air', (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    const success = roomManager.setActiveTimer(roomId, timerId)
    if (!success) {
      callback({ success: false, error: 'Timer not found' })
      return
    }

    io.to(roomId.toUpperCase()).emit('timer:on-air-changed', { timerId })
    callback({ success: true })
  })

  // Controller sends timer state updates
  socket.on('timer:state', ({ roomId, timerId, state }: { roomId: string; timerId: string; state: Partial<TimerState> }) => {
    if (!roomManager.isController(roomId, socket.id)) {
      return // Only controller can update state
    }

    const success = roomManager.updateTimerState(roomId, timerId, state)
    if (!success) return

    const timer = roomManager.getTimer(roomId, timerId)
    if (!timer) return

    // Broadcast to all viewers in the room
    socket.to(roomId.toUpperCase()).emit('timer:sync', { timerId, timer: { ...timer } })
  })

  // Controller sends message to viewers (speaker)
  socket.on('message:send', ({
    roomId,
    text,
    duration = 5000,
    priority = 'normal'
  }: {
    roomId: string
    text: string
    duration?: number
    priority?: MessagePriority
  }) => {
    if (!roomManager.isController(roomId, socket.id)) {
      return // Only controller can send messages
    }

    console.log(`Message sent to room ${roomId}: "${text}"`)
    // Broadcast to all viewers in the room (except sender)
    socket.to(roomId.toUpperCase()).emit('message:show', { text, duration, priority })
  })

  // Controller toggles blackout mode
  socket.on('blackout:set', ({
    roomId,
    enabled
  }: {
    roomId: string
    enabled: boolean
  }) => {
    if (!roomManager.isController(roomId, socket.id)) {
      return // Only controller can toggle blackout
    }

    console.log(`Blackout ${enabled ? 'enabled' : 'disabled'} in room ${roomId}`)
    // Broadcast to all viewers in the room (except sender)
    socket.to(roomId.toUpperCase()).emit('blackout:sync', enabled)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    // Room cleanup happens via TTL, no immediate action needed
  })
}

export function initializeSocket(io: Server): void {
  io.on('connection', (socket) => {
    setupHandlers(io, socket)
  })

  console.log('Socket.io initialized')
}
