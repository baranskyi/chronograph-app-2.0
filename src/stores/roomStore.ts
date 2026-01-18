import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useTimerStore } from './timerStore'
import type { TimerSettings, TimerStatus } from '../types/timer'

interface TimerState {
  settings: TimerSettings
  remainingSeconds: number
  elapsedSeconds: number
  status: TimerStatus
}

export type MessagePriority = 'normal' | 'urgent'

export interface SpeakerMessage {
  text: string
  duration: number
  priority: MessagePriority
}

export const useRoomStore = defineStore('room', () => {
  const socket = ref<Socket | null>(null)
  const roomId = ref<string | null>(null)
  const isConnected = ref(false)
  const isController = ref(false)
  const error = ref<string | null>(null)
  const isConnecting = ref(false)

  // Speaker messages
  const currentMessage = ref<SpeakerMessage | null>(null)
  let messageTimeout: ReturnType<typeof setTimeout> | null = null

  const shareUrl = computed(() => {
    if (!roomId.value) return null
    return `${window.location.origin}/viewer/${roomId.value}`
  })

  function connect() {
    if (socket.value?.connected) return

    isConnecting.value = true
    error.value = null

    // In production, connect to same origin. In dev, Vite proxy handles it.
    const serverUrl = import.meta.env.VITE_SERVER_URL || ''

    socket.value = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      timeout: 10000
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
        socket.value!.emit('room:create', (response: { roomId?: string; error?: string }) => {
          if (response.error) {
            error.value = response.error
            reject(new Error(response.error))
          } else if (response.roomId) {
            roomId.value = response.roomId
            isController.value = true
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

  async function joinAsViewer(id: string): Promise<void> {
    connect()

    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error('Socket not initialized'))
        return
      }

      const attemptJoin = () => {
        socket.value!.emit('room:join-viewer', { roomId: id }, (response: { success?: boolean; timerState?: TimerState | null; error?: string }) => {
          if (response.error) {
            error.value = response.error
            reject(new Error(response.error))
          } else if (response.success) {
            roomId.value = id.toUpperCase()
            isController.value = false

            // Apply initial state if available
            if (response.timerState) {
              const timerStore = useTimerStore()
              timerStore.applyRemoteState(response.timerState)
            }

            // Listen for ongoing updates
            socket.value!.on('timer:sync', (state: TimerState) => {
              const timerStore = useTimerStore()
              timerStore.applyRemoteState(state)
            })

            // Listen for speaker messages
            socket.value!.on('message:show', (msg: SpeakerMessage) => {
              currentMessage.value = msg
              if (messageTimeout) clearTimeout(messageTimeout)
              messageTimeout = setTimeout(() => {
                currentMessage.value = null
              }, msg.duration)
            })

            console.log('Joined room as viewer:', id)
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

  function broadcastState() {
    if (!isController.value || !roomId.value || !socket.value?.connected) {
      return
    }

    const timerStore = useTimerStore()
    socket.value.emit('timer:state', {
      roomId: roomId.value,
      state: timerStore.getStateForSync()
    })
  }

  function sendMessage(text: string, duration = 5000, priority: MessagePriority = 'normal') {
    if (!isController.value || !roomId.value || !socket.value?.connected) {
      return
    }

    socket.value.emit('message:send', {
      roomId: roomId.value,
      text,
      duration,
      priority
    })
  }

  function clearMessage() {
    if (messageTimeout) clearTimeout(messageTimeout)
    currentMessage.value = null
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
  }

  return {
    // State
    roomId,
    isConnected,
    isController,
    error,
    isConnecting,
    currentMessage,

    // Computed
    shareUrl,

    // Actions
    connect,
    createRoom,
    joinAsViewer,
    broadcastState,
    sendMessage,
    clearMessage,
    disconnect
  }
})
