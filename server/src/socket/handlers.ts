import type { Server, Socket } from 'socket.io'
import { roomManager } from '../services/roomManager.js'
import { verifyToken } from '../services/supabase.js'
import type { Timer, TimerState, MessagePriority } from '../types/room.js'

// Extend Socket type to include user data
interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string
  }
}

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

export function setupHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.data.userId
  console.log(`Client connected: ${socket.id} (user: ${userId || 'anonymous'})`)

  // Controller creates a new room
  socket.on('room:create', async (callback: CreateRoomCallback) => {
    try {
      // Pass userId to create room with ownership
      const room = await roomManager.createRoom(userId)
      roomManager.setController(room.roomId, socket.id)
      socket.join(room.roomId)

      // Auto-create first timer
      const timer = await roomManager.createTimer(room.roomId, 'Timer 1')
      const timers = timer ? [timer] : []

      callback({ roomId: room.roomId, timers: serializeTimers(timers) })
    } catch (error) {
      console.error('Error creating room:', error)
      callback({ error: 'Failed to create room' })
    }
  })

  // Controller rejoins existing room (reconnect)
  socket.on('room:join-controller', async (
    { roomId }: { roomId: string },
    callback: JoinRoomCallback
  ) => {
    try {
      const room = await roomManager.getRoom(roomId)
      if (!room) {
        callback({ error: 'Room not found' })
        return
      }

      // Check ownership: only owner can control the room
      // Allow access if:
      // - room has no owner (legacy rooms)
      // - user owns the room
      // - user is not authenticated (will be validated via other means)
      if (room.userId && userId && room.userId !== userId) {
        console.log(`Access denied: user ${userId} tried to join room owned by ${room.userId}`)
        callback({ error: 'Not authorized to control this room' })
        return
      }

      // Log ownership check for debugging
      console.log(`Ownership check: room.userId=${room.userId}, socket.userId=${userId || 'none'}`)

      roomManager.setController(room.roomId, socket.id)
      socket.join(room.roomId)
      console.log(`Controller rejoined room: ${roomId} (user: ${userId || 'anonymous'})`)

      const timers = await roomManager.getTimers(roomId)
      callback({ success: true, timers: serializeTimers(timers), activeTimerId: room.activeTimerId })
    } catch (error) {
      console.error('Error rejoining room:', error)
      callback({ error: 'Failed to rejoin room' })
    }
  })

  // Viewer joins a room
  socket.on('room:join-viewer', async (
    { roomId, timerId }: { roomId: string; timerId?: string },
    callback: JoinRoomCallback
  ) => {
    try {
      const room = await roomManager.getRoom(roomId)
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
      const runtime = roomManager.isController(room.roomId, '') ? null : room.controllerSocketId
      if (room.controllerSocketId) {
        io.to(room.controllerSocketId).emit('room:viewer-count', { count: viewerCount })
      }

      console.log(`Viewer joined room: ${roomId}${timerId ? ` (timer: ${timerId})` : ''} (viewers: ${viewerCount})`)

      const timers = await roomManager.getTimers(roomId)
      callback({ success: true, timers: serializeTimers(timers), activeTimerId: room.activeTimerId })
    } catch (error) {
      console.error('Error joining room as viewer:', error)
      callback({ error: 'Failed to join room' })
    }
  })

  // Create a new timer
  socket.on('timer:create', async (
    { roomId, name, duration }: { roomId: string; name?: string; duration?: number },
    callback: TimerCallback
  ) => {
    console.log(`timer:create request: roomId=${roomId}, socket.id=${socket.id}`)

    if (!roomManager.isController(roomId, socket.id)) {
      console.log(`timer:create: Not authorized - socket ${socket.id} is not controller for room ${roomId}`)
      callback({ error: 'Not authorized' })
      return
    }

    try {
      console.log(`timer:create: Creating timer for room ${roomId}`)
      const timer = await roomManager.createTimer(roomId, name || '', duration)
      if (!timer) {
        console.log(`timer:create: roomManager.createTimer returned null for room ${roomId}`)
        callback({ error: 'Failed to create timer' })
        return
      }

      // Broadcast to all clients in the room
      io.to(roomId.toUpperCase()).emit('timer:created', { ...timer })
      callback({ success: true, timer: { ...timer } })
    } catch (error) {
      console.error('Error creating timer:', error)
      callback({ error: 'Failed to create timer' })
    }
  })

  // Delete a timer
  socket.on('timer:delete', async (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    try {
      const success = await roomManager.deleteTimer(roomId, timerId)
      if (!success) {
        callback({ success: false, error: 'Timer not found' })
        return
      }

      const room = await roomManager.getRoom(roomId)
      io.to(roomId.toUpperCase()).emit('timer:deleted', { timerId, newActiveTimerId: room?.activeTimerId })
      callback({ success: true })
    } catch (error) {
      console.error('Error deleting timer:', error)
      callback({ success: false, error: 'Failed to delete timer' })
    }
  })

  // Rename a timer
  socket.on('timer:rename', async (
    { roomId, timerId, name }: { roomId: string; timerId: string; name: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    try {
      const success = await roomManager.renameTimer(roomId, timerId, name)
      if (!success) {
        callback({ success: false, error: 'Timer not found' })
        return
      }

      io.to(roomId.toUpperCase()).emit('timer:renamed', { timerId, name })
      callback({ success: true })
    } catch (error) {
      console.error('Error renaming timer:', error)
      callback({ success: false, error: 'Failed to rename timer' })
    }
  })

  // Set timer as "On Air"
  socket.on('timer:set-on-air', async (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    try {
      const success = await roomManager.setActiveTimer(roomId, timerId)
      if (!success) {
        callback({ success: false, error: 'Timer not found' })
        return
      }

      io.to(roomId.toUpperCase()).emit('timer:on-air-changed', { timerId })
      callback({ success: true })
    } catch (error) {
      console.error('Error setting timer on air:', error)
      callback({ success: false, error: 'Failed to set timer on air' })
    }
  })

  // Start a timer (server-side)
  socket.on('timer:start', async (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    try {
      const success = await roomManager.startTimer(roomId, timerId)
      if (!success) {
        callback({ success: false, error: 'Failed to start timer' })
        return
      }

      const timer = await roomManager.getTimer(roomId, timerId)
      if (timer) {
        // Broadcast to all clients in the room
        io.to(roomId.toUpperCase()).emit('timer:sync', { timerId, timer: { ...timer } })
      }
      callback({ success: true })
    } catch (error) {
      console.error('Error starting timer:', error)
      callback({ success: false, error: 'Failed to start timer' })
    }
  })

  // Pause a timer (server-side)
  socket.on('timer:pause', async (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    try {
      const success = await roomManager.pauseTimer(roomId, timerId)
      if (!success) {
        callback({ success: false, error: 'Failed to pause timer' })
        return
      }

      const timer = await roomManager.getTimer(roomId, timerId)
      if (timer) {
        // Broadcast to all clients in the room
        io.to(roomId.toUpperCase()).emit('timer:sync', { timerId, timer: { ...timer } })
      }
      callback({ success: true })
    } catch (error) {
      console.error('Error pausing timer:', error)
      callback({ success: false, error: 'Failed to pause timer' })
    }
  })

  // Reset a timer (server-side)
  socket.on('timer:reset', async (
    { roomId, timerId }: { roomId: string; timerId: string },
    callback: SimpleCallback
  ) => {
    if (!roomManager.isController(roomId, socket.id)) {
      callback({ success: false, error: 'Not authorized' })
      return
    }

    try {
      const success = await roomManager.resetTimer(roomId, timerId)
      if (!success) {
        callback({ success: false, error: 'Failed to reset timer' })
        return
      }

      const timer = await roomManager.getTimer(roomId, timerId)
      if (timer) {
        // Broadcast to all clients in the room
        io.to(roomId.toUpperCase()).emit('timer:sync', { timerId, timer: { ...timer } })
      }
      callback({ success: true })
    } catch (error) {
      console.error('Error resetting timer:', error)
      callback({ success: false, error: 'Failed to reset timer' })
    }
  })

  // Controller sends timer state updates (settings changes, etc.)
  socket.on('timer:state', async ({ roomId, timerId, state }: { roomId: string; timerId: string; state: Partial<TimerState> }) => {
    if (!roomManager.isController(roomId, socket.id)) {
      return // Only controller can update state
    }

    try {
      const success = await roomManager.updateTimerState(roomId, timerId, state)
      if (!success) return

      const timer = await roomManager.getTimer(roomId, timerId)
      if (!timer) return

      // Broadcast to all viewers in the room
      socket.to(roomId.toUpperCase()).emit('timer:sync', { timerId, timer: { ...timer } })
    } catch (error) {
      console.error('Error updating timer state:', error)
    }
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
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`)

    // Check if this was a viewer and update count
    const roomId = removeViewer(socket.id)
    if (roomId) {
      try {
        const room = await roomManager.getRoom(roomId)
        if (room?.controllerSocketId) {
          const viewerCount = getViewerCount(roomId)
          io.to(room.controllerSocketId).emit('room:viewer-count', { count: viewerCount })
          console.log(`Viewer left room: ${roomId} (viewers: ${viewerCount})`)
        }
      } catch (error) {
        console.error('Error handling disconnect:', error)
      }
    }
    // Room cleanup happens via TTL, no immediate action needed
  })
}

export function initializeSocket(io: Server): void {
  // Authentication middleware - verify JWT token
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token

    if (token) {
      const userId = await verifyToken(token)
      if (userId) {
        socket.data.userId = userId
        console.log(`Authenticated socket: ${socket.id} for user: ${userId}`)
      } else {
        console.log(`Invalid token for socket: ${socket.id}`)
      }
    } else {
      console.log(`Anonymous socket: ${socket.id}`)
    }

    // Allow connection even without auth (for viewers)
    next()
  })

  io.on('connection', (socket) => {
    setupHandlers(io, socket as AuthenticatedSocket)
  })

  console.log('Socket.io initialized with authentication')
}
