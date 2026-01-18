import type { Server, Socket } from 'socket.io'
import { roomManager } from '../services/roomManager.js'
import type { TimerState, MessagePriority } from '../types/room.js'

interface CreateRoomCallback {
  (response: { roomId: string } | { error: string }): void
}

interface JoinRoomCallback {
  (response: { success: true; timerState: TimerState | null } | { error: string }): void
}

export function setupHandlers(io: Server, socket: Socket): void {
  console.log(`Client connected: ${socket.id}`)

  // Controller creates a new room
  socket.on('room:create', (callback: CreateRoomCallback) => {
    try {
      const room = roomManager.createRoom()
      room.controllerSocketId = socket.id
      socket.join(room.roomId)
      callback({ roomId: room.roomId })
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
    callback({ success: true, timerState: room.timerState })
  })

  // Viewer joins a room
  socket.on('room:join-viewer', (
    { roomId }: { roomId: string },
    callback: JoinRoomCallback
  ) => {
    const room = roomManager.getRoom(roomId)
    if (!room) {
      callback({ error: 'Room not found' })
      return
    }
    socket.join(room.roomId)
    console.log(`Viewer joined room: ${roomId}`)
    callback({ success: true, timerState: room.timerState })
  })

  // Controller sends timer state updates
  socket.on('timer:state', ({ roomId, state }: { roomId: string; state: TimerState }) => {
    if (!roomManager.isController(roomId, socket.id)) {
      return // Only controller can update state
    }

    roomManager.updateTimerState(roomId, state)
    // Broadcast to all viewers in the room (except sender)
    socket.to(roomId.toUpperCase()).emit('timer:sync', state)
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
