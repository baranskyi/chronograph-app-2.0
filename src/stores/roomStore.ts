import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useTimerStore } from './timerStore'
import { useAuthStore } from './authStore'
import type { Timer } from '../types/timer'

export type MessagePriority = 'normal' | 'urgent'

export interface SpeakerMessage {
  text: string
  duration: number
  priority: MessagePriority
}

export const useRoomStore = defineStore('room', () => {
  const socket = ref<Socket | null>(null)
  const roomId = ref<string | null>(null)
  const roomName = ref<string | null>(null)
  const isConnected = ref(false)
  const isController = ref(false)
  const error = ref<string | null>(null)
  const isConnecting = ref(false)

  // Speaker messages
  const currentMessage = ref<SpeakerMessage | null>(null)
  let messageTimeout: ReturnType<typeof setTimeout> | null = null

  // Blackout mode
  const isBlackout = ref(false)

  // Viewer mode: which timer to follow
  const viewerTimerId = ref<string | null>(null) // null = follow active timer

  // Live connections count
  const viewerCount = ref(0)

  const shareUrl = computed(() => {
    if (!roomId.value) return null
    return `${window.location.origin}/viewer/${roomId.value}`
  })

  // Get share URL for specific timer
  function getTimerShareUrl(timerId: string): string | null {
    if (!roomId.value) return null
    return `${window.location.origin}/viewer/${roomId.value}/${timerId}`
  }

  function connect() {
    if (socket.value?.connected) return

    isConnecting.value = true
    error.value = null

    // In production, connect to same origin. In dev, Vite proxy handles it.
    const serverUrl = import.meta.env.VITE_SERVER_URL || ''

    // Get auth token for authenticated socket connection
    const authStore = useAuthStore()
    const token = authStore.accessToken

    socket.value = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      timeout: 10000,
      auth: {
        token: token || undefined
      }
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      isConnecting.value = false
      error.value = null
      console.log('Socket connected')
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('Socket disconnected:', reason)
    })

    socket.value.on('connect_error', (err) => {
      isConnecting.value = false
      error.value = `Connection failed: ${err.message}`
      console.error('Socket connection error:', err)
    })
  }

  async function createRoom(): Promise<string> {
    connect()

    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Socket not initialized'))
        return
      }

      // Wait for connection if not connected
      const attemptCreate = () => {
        socket.value!.emit('room:create', (response: { roomId?: string; timers?: Timer[]; error?: string }) => {
          if (response.error) {
            error.value = response.error
            reject(new Error(response.error))
          } else if (response.roomId) {
            roomId.value = response.roomId
            isController.value = true

            // Note: We no longer save to localStorage - rooms are accessed via URL

            // Add initial timers to store
            if (response.timers) {
              const timerStore = useTimerStore()
              timerStore.addTimers(response.timers)
            }

            // Setup controller listeners
            setupControllerListeners()

            console.log('Room created:', response.roomId)
            resolve(response.roomId)
          }
        })
      }

      if (socket.value.connected) {
        attemptCreate()
      } else {
        socket.value.once('connect', attemptCreate)
      }
    })
  }

  async function joinRoomAsController(id: string): Promise<boolean> {
    connect()

    return new Promise((resolve) => {
      if (!socket.value) {
        resolve(false)
        return
      }

      const attemptJoin = () => {
        socket.value!.emit('room:join-controller', { roomId: id }, (response: { success?: boolean; timers?: Timer[]; activeTimerId?: string | null; roomName?: string; error?: string }) => {
          if (response.error) {
            console.log('Failed to rejoin room:', response.error)
            resolve(false)
          } else if (response.success) {
            roomId.value = id.toUpperCase()
            roomName.value = response.roomName || id.toUpperCase()
            isController.value = true

            // Restore timers from server
            if (response.timers) {
              const timerStore = useTimerStore()
              timerStore.addTimers(response.timers)

              // Set active timer
              if (response.activeTimerId) {
                timerStore.setOnAir(response.activeTimerId)
              }
            }

            // Setup controller listeners
            setupControllerListeners()

            console.log('Rejoined room as controller:', id)
            resolve(true)
          } else {
            resolve(false)
          }
        })
      }

      if (socket.value.connected) {
        attemptJoin()
      } else {
        socket.value.once('connect', attemptJoin)
      }
    })
  }

  // DEPRECATED: Rooms should be accessed via URL (/room/:roomCode)
  // This function is kept for backwards compatibility but should not be used
  async function initializeRoom(): Promise<string> {
    // No longer use localStorage - rooms are accessed via URL
    console.warn('initializeRoom() is deprecated. Use joinRoomAsController() with roomCode from URL instead.')
    throw new Error('Room code required - navigate via /room/:roomCode')
  }

  function setupControllerListeners() {
    if (!socket.value) return
    const timerStore = useTimerStore()

    // Listen for timer created (in case of reconnect sync)
    socket.value.on('timer:created', (timer: Timer) => {
      timerStore.addTimer(timer)
    })

    // Listen for timer deleted
    socket.value.on('timer:deleted', ({ timerId, newActiveTimerId }: { timerId: string; newActiveTimerId: string | null }) => {
      timerStore.removeTimer(timerId)
      if (newActiveTimerId) {
        timerStore.setOnAir(newActiveTimerId)
      }
    })

    // Listen for timer renamed
    socket.value.on('timer:renamed', ({ timerId, name }: { timerId: string; name: string }) => {
      timerStore.updateTimer(timerId, { name })
    })

    // Listen for On Air changes
    socket.value.on('timer:on-air-changed', ({ timerId }: { timerId: string }) => {
      timerStore.setOnAir(timerId)
    })

    // Listen for timer sync (full state update from server)
    socket.value.on('timer:sync', ({ timerId, timer }: { timerId: string; timer: Timer }) => {
      timerStore.updateTimer(timerId, timer)
    })

    // Listen for viewer count changes
    socket.value.on('room:viewer-count', ({ count }: { count: number }) => {
      viewerCount.value = count
      console.log('Viewer count updated:', count)
    })
  }

  async function joinAsViewer(id: string, timerId?: string): Promise<void> {
    connect()

    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Socket not initialized'))
        return
      }

      const attemptJoin = () => {
        socket.value!.emit('room:join-viewer', { roomId: id, timerId }, (response: { success?: boolean; timers?: Timer[]; activeTimerId?: string | null; roomName?: string; error?: string }) => {
          if (response.error) {
            error.value = response.error
            reject(new Error(response.error))
          } else if (response.success) {
            roomId.value = id.toUpperCase()
            roomName.value = response.roomName || id.toUpperCase()
            isController.value = false
            viewerTimerId.value = timerId ?? null

            // Apply initial timers
            if (response.timers) {
              const timerStore = useTimerStore()
              timerStore.addTimers(response.timers)

              // Set active timer
              if (response.activeTimerId) {
                timerStore.setOnAir(response.activeTimerId)
              }
            }

            // Setup viewer listeners
            setupViewerListeners()

            console.log('Joined room as viewer:', id, timerId ? `(timer: ${timerId})` : '')
            resolve()
          }
        })
      }

      if (socket.value.connected) {
        attemptJoin()
      } else {
        socket.value.once('connect', attemptJoin)
      }
    })
  }

  function setupViewerListeners() {
    if (!socket.value) return
    const timerStore = useTimerStore()

    // Listen for timer sync (state updates from server)
    socket.value.on('timer:sync', ({ timerId, timer }: { timerId: string; timer: Timer }) => {
      timerStore.updateTimer(timerId, timer)
    })

    // Listen for timer created
    socket.value.on('timer:created', (timer: Timer) => {
      timerStore.addTimer(timer)
    })

    // Listen for timer deleted
    socket.value.on('timer:deleted', ({ timerId, newActiveTimerId }: { timerId: string; newActiveTimerId: string | null }) => {
      timerStore.removeTimer(timerId)
      if (newActiveTimerId) {
        timerStore.setOnAir(newActiveTimerId)
      }
    })

    // Listen for timer renamed
    socket.value.on('timer:renamed', ({ timerId, name }: { timerId: string; name: string }) => {
      timerStore.updateTimer(timerId, { name })
    })

    // Listen for On Air changes
    socket.value.on('timer:on-air-changed', ({ timerId }: { timerId: string }) => {
      timerStore.setOnAir(timerId)
    })

    // Listen for speaker messages
    socket.value.on('message:show', (msg: SpeakerMessage) => {
      currentMessage.value = msg
      if (messageTimeout) clearTimeout(messageTimeout)
      messageTimeout = setTimeout(() => {
        currentMessage.value = null
      }, msg.duration)
    })

    // Listen for blackout mode
    socket.value.on('blackout:sync', (enabled: boolean) => {
      isBlackout.value = enabled
    })
  }

  // Timer CRUD operations (controller only)
  function createTimer(name?: string, duration?: number): Promise<Timer | null> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(null)
        return
      }

      socket.value.emit('timer:create', { roomId: roomId.value, name, duration }, (response: { success?: boolean; timer?: Timer; error?: string }) => {
        if (response.success && response.timer) {
          const timerStore = useTimerStore()
          timerStore.addTimer(response.timer)
          resolve(response.timer)
        } else {
          console.error('Failed to create timer:', response.error)
          resolve(null)
        }
      })
    })
  }

  function deleteTimer(timerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(false)
        return
      }

      socket.value.emit('timer:delete', { roomId: roomId.value, timerId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          const timerStore = useTimerStore()
          timerStore.removeTimer(timerId)
        }
        resolve(response.success)
      })
    })
  }

  function renameTimer(timerId: string, name: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(false)
        return
      }

      socket.value.emit('timer:rename', { roomId: roomId.value, timerId, name }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          const timerStore = useTimerStore()
          timerStore.updateTimer(timerId, { name })
        }
        resolve(response.success)
      })
    })
  }

  function setTimerOnAir(timerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(false)
        return
      }

      socket.value.emit('timer:set-on-air', { roomId: roomId.value, timerId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          const timerStore = useTimerStore()
          timerStore.setOnAir(timerId)
        }
        resolve(response.success)
      })
    })
  }

  // Server-side timer control
  function startTimerOnServer(timerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(false)
        return
      }

      socket.value.emit('timer:start', { roomId: roomId.value, timerId }, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error('Failed to start timer:', response.error)
        }
        resolve(response.success)
      })
    })
  }

  function pauseTimerOnServer(timerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(false)
        return
      }

      socket.value.emit('timer:pause', { roomId: roomId.value, timerId }, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error('Failed to pause timer:', response.error)
        }
        resolve(response.success)
      })
    })
  }

  function resetTimerOnServer(timerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!isController.value || !roomId.value || !socket.value?.connected) {
        resolve(false)
        return
      }

      socket.value.emit('timer:reset', { roomId: roomId.value, timerId }, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error('Failed to reset timer:', response.error)
        }
        resolve(response.success)
      })
    })
  }

  function broadcastTimerState(timerId: string) {
    if (!isController.value || !roomId.value || !socket.value?.connected) {
      return
    }

    const timerStore = useTimerStore()
    const state = timerStore.getTimerStateForSync(timerId)
    if (!state) return

    socket.value.emit('timer:state', {
      roomId: roomId.value,
      timerId,
      state
    })
  }

  // Legacy: broadcast selected timer state
  function broadcastState() {
    const timerStore = useTimerStore()
    if (timerStore.selectedTimerId) {
      broadcastTimerState(timerStore.selectedTimerId)
    }
  }

  function sendMessage(text: string, duration = 5000, priority: MessagePriority = 'normal', targetTimerId?: string | null) {
    if (!isController.value || !roomId.value || !socket.value?.connected) {
      return
    }

    socket.value.emit('message:send', {
      roomId: roomId.value,
      text,
      duration,
      priority,
      targetTimerId: targetTimerId || null
    })
  }

  function clearMessage() {
    if (messageTimeout) clearTimeout(messageTimeout)
    currentMessage.value = null
  }

  function setBlackout(enabled: boolean) {
    if (!isController.value || !roomId.value || !socket.value?.connected) {
      return
    }

    isBlackout.value = enabled
    socket.value.emit('blackout:set', {
      roomId: roomId.value,
      enabled
    })
  }

  function toggleBlackout() {
    setBlackout(!isBlackout.value)
  }

  function disconnect() {
    if (socket.value) {
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
    }
    roomId.value = null
    isConnected.value = false
    isController.value = false
    isConnecting.value = false
    error.value = null
    viewerTimerId.value = null
    viewerCount.value = 0

    // Clear timer store
    const timerStore = useTimerStore()
    timerStore.clearAllTimers()
  }

  return {
    // State
    roomId,
    roomName,
    isConnected,
    isController,
    error,
    isConnecting,
    currentMessage,
    isBlackout,
    viewerTimerId,
    viewerCount,

    // Computed
    shareUrl,
    getTimerShareUrl,

    // Actions
    connect,
    createRoom,
    initializeRoom,
    joinRoomAsController,
    joinAsViewer,
    broadcastState,
    broadcastTimerState,
    sendMessage,
    clearMessage,
    setBlackout,
    toggleBlackout,
    disconnect,

    // Timer CRUD
    createTimer,
    deleteTimer,
    renameTimer,
    setTimerOnAir,

    // Server-side timer control
    startTimerOnServer,
    pauseTimerOnServer,
    resetTimerOnServer
  }
})
