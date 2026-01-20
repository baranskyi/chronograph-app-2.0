import type { RoomState, Timer, TimerState, TimerSettings } from '../types/room.js'
import { DEFAULT_TIMER_SETTINGS } from '../types/room.js'
import { supabase, isSupabaseEnabled } from './supabase.js'

// In-memory cache for runtime state (socket connections, etc.)
interface RuntimeRoomState {
  controllerSocketId: string | null
  lastActivity: number
}

class RoomManager {
  // Runtime state only (socket connections, etc.) - not persisted
  private runtimeState = new Map<string, RuntimeRoomState>()

  // In-memory fallback when Supabase is not configured
  private memoryRooms = new Map<string, RoomState>()
  private timerCounter = new Map<string, number>()
  private readonly TTL = 24 * 60 * 60 * 1000 // 24 hours

  generateRoomId(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let id = ''
    for (let i = 0; i < 8; i++) {
      if (i === 4) id += '-'
      id += chars[Math.floor(Math.random() * chars.length)]
    }
    return id
  }

  // ============ ROOM OPERATIONS ============

  async createRoom(): Promise<RoomState> {
    const roomId = this.generateRoomId()

    if (isSupabaseEnabled() && supabase) {
      // Create room in Supabase
      const { data: room, error } = await supabase
        .from('rooms')
        .insert({
          room_code: roomId,
          name: 'My Room',
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create room in Supabase:', error)
        throw new Error('Failed to create room')
      }

      // Initialize runtime state
      this.runtimeState.set(roomId, {
        controllerSocketId: null,
        lastActivity: Date.now()
      })

      console.log(`Room created in Supabase: ${roomId}`)

      return {
        roomId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        controllerSocketId: null,
        timers: new Map(),
        activeTimerId: null
      }
    }

    // Fallback: in-memory storage
    return this.createRoomInMemory(roomId)
  }

  private createRoomInMemory(roomId: string): RoomState {
    const room: RoomState = {
      roomId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      controllerSocketId: null,
      timers: new Map<string, Timer>(),
      activeTimerId: null
    }
    this.memoryRooms.set(roomId, room)
    this.timerCounter.set(roomId, 0)
    this.cleanup()
    console.log(`Room created in memory: ${roomId}`)
    return room
  }

  async getRoom(roomId: string): Promise<RoomState | undefined> {
    const normalizedId = roomId.toUpperCase()

    if (isSupabaseEnabled() && supabase) {
      // Fetch room from Supabase
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', normalizedId)
        .eq('is_active', true)
        .single()

      if (error || !room) {
        return undefined
      }

      // Fetch timers for this room
      const { data: timers } = await supabase
        .from('timers')
        .select('*')
        .eq('room_id', room.id)
        .order('position', { ascending: true })

      const timerMap = new Map<string, Timer>()
      let activeTimerId: string | null = null

      if (timers) {
        for (const t of timers) {
          // Calculate real-time values for running timers
          const timer = this.calculateTimerState({
            id: t.id,
            name: t.name,
            settings: {
              ...DEFAULT_TIMER_SETTINGS,
              ...t.settings,
              duration: t.duration
            },
            remainingSeconds: t.remaining_seconds,
            elapsedSeconds: t.elapsed_seconds,
            status: t.status as Timer['status'],
            isOnAir: t.is_on_air,
            startedAt: t.started_at ? new Date(t.started_at).getTime() : null,
            started_at: t.started_at
          })
          timerMap.set(t.id, timer)
          if (t.is_on_air) {
            activeTimerId = t.id
          }
        }
      }

      // Get or create runtime state
      let runtime = this.runtimeState.get(normalizedId)
      if (!runtime) {
        runtime = { controllerSocketId: null, lastActivity: Date.now() }
        this.runtimeState.set(normalizedId, runtime)
      }

      return {
        roomId: normalizedId,
        createdAt: new Date(room.created_at).getTime(),
        lastActivity: runtime.lastActivity,
        controllerSocketId: runtime.controllerSocketId,
        timers: timerMap,
        activeTimerId,
        dbRoomId: room.id // Store DB UUID for updates
      } as RoomState & { dbRoomId: string }
    }

    // Fallback: in-memory
    return this.memoryRooms.get(normalizedId)
  }

  // ============ TIMER OPERATIONS ============

  async createTimer(roomId: string, name: string, duration?: number): Promise<Timer | null> {
    const normalizedId = roomId.toUpperCase()

    if (isSupabaseEnabled() && supabase) {
      // Get room's DB UUID
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', normalizedId)
        .single()

      if (!room) return null

      // Count existing timers
      const { count } = await supabase
        .from('timers')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)

      const timerCount = count || 0
      const isFirstTimer = timerCount === 0

      const settings: TimerSettings = {
        ...DEFAULT_TIMER_SETTINGS,
        duration: duration ?? DEFAULT_TIMER_SETTINGS.duration
      }

      const { data: timer, error } = await supabase
        .from('timers')
        .insert({
          room_id: room.id,
          name: name || `Timer ${timerCount + 1}`,
          duration: settings.duration,
          remaining_seconds: settings.duration,
          elapsed_seconds: 0,
          status: 'stopped',
          is_on_air: isFirstTimer,
          position: timerCount,
          settings: settings,
          started_at: null
        })
        .select()
        .single()

      if (error || !timer) {
        console.error('Failed to create timer:', error)
        return null
      }

      // Update room's active_timer_id if this is first timer
      if (isFirstTimer) {
        await supabase
          .from('rooms')
          .update({ active_timer_id: timer.id, last_used_at: new Date().toISOString() })
          .eq('id', room.id)
      }

      console.log(`Timer created in Supabase: ${timer.id} (${timer.name})`)

      return {
        id: timer.id,
        name: timer.name,
        settings,
        remainingSeconds: timer.remaining_seconds,
        elapsedSeconds: timer.elapsed_seconds,
        status: timer.status as Timer['status'],
        isOnAir: timer.is_on_air,
        startedAt: null
      }
    }

    // Fallback: in-memory
    return this.createTimerInMemory(roomId, name, duration)
  }

  private createTimerInMemory(roomId: string, name: string, duration?: number): Timer | null {
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return null

    const count = (this.timerCounter.get(roomId.toUpperCase()) || 0) + 1
    this.timerCounter.set(roomId.toUpperCase(), count)
    const timerId = `t${count}`

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
      isOnAir: room.timers.size === 0,
      startedAt: null
    }

    room.timers.set(timerId, timer)
    if (timer.isOnAir) {
      room.activeTimerId = timerId
    }
    room.lastActivity = Date.now()

    console.log(`Timer created in memory: ${timerId} (${timer.name})`)
    return timer
  }

  // ============ SERVER-SIDE TIMER CONTROL ============

  // Start a timer (server-side)
  async startTimer(roomId: string, timerId: string): Promise<boolean> {
    const now = Date.now()

    if (isSupabaseEnabled() && supabase) {
      const { error } = await supabase
        .from('timers')
        .update({
          status: 'running',
          started_at: new Date(now).toISOString()
        })
        .eq('id', timerId)

      if (error) {
        console.error('Failed to start timer:', error)
        return false
      }
      console.log(`Timer started in Supabase: ${timerId}`)
      return true
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false
    const timer = room.timers.get(timerId)
    if (!timer) return false

    timer.status = 'running'
    timer.startedAt = now
    room.lastActivity = now
    console.log(`Timer started in memory: ${timerId}`)
    return true
  }

  // Pause a timer (server-side)
  async pauseTimer(roomId: string, timerId: string): Promise<boolean> {
    const now = Date.now()

    if (isSupabaseEnabled() && supabase) {
      // First get current timer state
      const { data: timer } = await supabase
        .from('timers')
        .select('*')
        .eq('id', timerId)
        .single()

      if (!timer) return false

      // Calculate elapsed time since started
      let newElapsed = timer.elapsed_seconds
      if (timer.started_at) {
        const startedAt = new Date(timer.started_at).getTime()
        const additionalElapsed = Math.floor((now - startedAt) / 1000)
        newElapsed += additionalElapsed
      }

      const { error } = await supabase
        .from('timers')
        .update({
          status: 'paused',
          started_at: null,
          elapsed_seconds: newElapsed,
          remaining_seconds: Math.max(0, timer.duration - newElapsed)
        })
        .eq('id', timerId)

      if (error) {
        console.error('Failed to pause timer:', error)
        return false
      }
      console.log(`Timer paused in Supabase: ${timerId}, elapsed: ${newElapsed}s`)
      return true
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false
    const timer = room.timers.get(timerId)
    if (!timer) return false

    // Calculate elapsed time since started
    if (timer.startedAt) {
      const additionalElapsed = Math.floor((now - timer.startedAt) / 1000)
      timer.elapsedSeconds += additionalElapsed
      timer.remainingSeconds = Math.max(0, timer.settings.duration - timer.elapsedSeconds)
    }

    timer.status = 'paused'
    timer.startedAt = null
    room.lastActivity = now
    console.log(`Timer paused in memory: ${timerId}`)
    return true
  }

  // Reset a timer (server-side)
  async resetTimer(roomId: string, timerId: string): Promise<boolean> {
    if (isSupabaseEnabled() && supabase) {
      // Get timer duration
      const { data: timer } = await supabase
        .from('timers')
        .select('duration')
        .eq('id', timerId)
        .single()

      if (!timer) return false

      const { error } = await supabase
        .from('timers')
        .update({
          status: 'stopped',
          started_at: null,
          elapsed_seconds: 0,
          remaining_seconds: timer.duration
        })
        .eq('id', timerId)

      if (error) {
        console.error('Failed to reset timer:', error)
        return false
      }
      console.log(`Timer reset in Supabase: ${timerId}`)
      return true
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false
    const timer = room.timers.get(timerId)
    if (!timer) return false

    timer.status = 'stopped'
    timer.startedAt = null
    timer.elapsedSeconds = 0
    timer.remainingSeconds = timer.settings.duration
    room.lastActivity = Date.now()
    console.log(`Timer reset in memory: ${timerId}`)
    return true
  }

  // Convert timer from DB format to client format
  // Does NOT recalculate elapsed/remaining - client handles real-time calculation
  // This prevents double-counting when client also calculates from startedAt
  calculateTimerState(timer: Timer & { started_at?: string | null }): Timer {
    // Just convert started_at string to startedAt timestamp
    // Return raw elapsed_seconds and remaining_seconds from database
    // Client will calculate real-time values using startedAt + elapsedSeconds
    return {
      ...timer,
      startedAt: timer.startedAt ?? (timer.started_at ? new Date(timer.started_at).getTime() : null)
    }
  }

  // Get all running timers for a room (for tick loop)
  async getRunningTimers(roomId: string): Promise<Timer[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomId.toUpperCase())
        .single()

      if (!room) return []

      const { data: timers } = await supabase
        .from('timers')
        .select('*')
        .eq('room_id', room.id)
        .eq('status', 'running')

      if (!timers) return []

      return timers.map(t => this.calculateTimerState({
        id: t.id,
        name: t.name,
        settings: {
          ...DEFAULT_TIMER_SETTINGS,
          ...t.settings,
          duration: t.duration
        },
        remainingSeconds: t.remaining_seconds,
        elapsedSeconds: t.elapsed_seconds,
        status: t.status as Timer['status'],
        isOnAir: t.is_on_air,
        startedAt: t.started_at ? new Date(t.started_at).getTime() : null,
        started_at: t.started_at
      }))
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return []
    return Array.from(room.timers.values())
      .filter(t => t.status === 'running')
      .map(t => this.calculateTimerState(t))
  }

  // Get all active rooms (for tick loop)
  getActiveRoomIds(): string[] {
    return Array.from(this.runtimeState.keys())
  }

  async deleteTimer(roomId: string, timerId: string): Promise<boolean> {
    if (isSupabaseEnabled() && supabase) {
      const { data: timer } = await supabase
        .from('timers')
        .select('is_on_air, room_id')
        .eq('id', timerId)
        .single()

      if (!timer) return false

      const wasOnAir = timer.is_on_air

      const { error } = await supabase
        .from('timers')
        .delete()
        .eq('id', timerId)

      if (error) {
        console.error('Failed to delete timer:', error)
        return false
      }

      // If deleted timer was On Air, assign to first remaining timer
      if (wasOnAir) {
        const { data: remainingTimers } = await supabase
          .from('timers')
          .select('id')
          .eq('room_id', timer.room_id)
          .order('position', { ascending: true })
          .limit(1)

        if (remainingTimers && remainingTimers.length > 0) {
          await supabase
            .from('timers')
            .update({ is_on_air: true })
            .eq('id', remainingTimers[0].id)

          await supabase
            .from('rooms')
            .update({ active_timer_id: remainingTimers[0].id })
            .eq('id', timer.room_id)
        } else {
          await supabase
            .from('rooms')
            .update({ active_timer_id: null })
            .eq('id', timer.room_id)
        }
      }

      console.log(`Timer deleted from Supabase: ${timerId}`)
      return true
    }

    // Fallback: in-memory
    return this.deleteTimerInMemory(roomId, timerId)
  }

  private deleteTimerInMemory(roomId: string, timerId: string): boolean {
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false

    const timer = room.timers.get(timerId)
    if (!timer) return false

    const wasOnAir = timer.isOnAir
    room.timers.delete(timerId)

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
    console.log(`Timer deleted from memory: ${timerId}`)
    return true
  }

  async renameTimer(roomId: string, timerId: string, name: string): Promise<boolean> {
    if (isSupabaseEnabled() && supabase) {
      const { error } = await supabase
        .from('timers')
        .update({ name })
        .eq('id', timerId)

      if (error) {
        console.error('Failed to rename timer:', error)
        return false
      }
      return true
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false
    const timer = room.timers.get(timerId)
    if (!timer) return false
    timer.name = name
    room.lastActivity = Date.now()
    return true
  }

  async updateTimerState(roomId: string, timerId: string, state: Partial<TimerState>): Promise<boolean> {
    if (isSupabaseEnabled() && supabase) {
      const updates: Record<string, unknown> = {}

      if (state.settings) {
        updates.settings = state.settings
        if (state.settings.duration !== undefined) {
          updates.duration = state.settings.duration
        }
      }
      if (state.remainingSeconds !== undefined) updates.remaining_seconds = state.remainingSeconds
      if (state.elapsedSeconds !== undefined) updates.elapsed_seconds = state.elapsedSeconds
      if (state.status !== undefined) updates.status = state.status

      if (Object.keys(updates).length === 0) return true

      const { error } = await supabase
        .from('timers')
        .update(updates)
        .eq('id', timerId)

      if (error) {
        console.error('Failed to update timer state:', error)
        return false
      }
      return true
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false
    const timer = room.timers.get(timerId)
    if (!timer) return false

    if (state.settings) timer.settings = { ...timer.settings, ...state.settings }
    if (state.remainingSeconds !== undefined) timer.remainingSeconds = state.remainingSeconds
    if (state.elapsedSeconds !== undefined) timer.elapsedSeconds = state.elapsedSeconds
    if (state.status !== undefined) timer.status = state.status

    room.lastActivity = Date.now()
    return true
  }

  async setActiveTimer(roomId: string, timerId: string): Promise<boolean> {
    if (isSupabaseEnabled() && supabase) {
      // Get room's DB UUID
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomId.toUpperCase())
        .single()

      if (!room) return false

      // Clear all On Air flags for this room
      await supabase
        .from('timers')
        .update({ is_on_air: false })
        .eq('room_id', room.id)

      // Set new On Air timer
      const { error } = await supabase
        .from('timers')
        .update({ is_on_air: true })
        .eq('id', timerId)

      if (error) {
        console.error('Failed to set active timer:', error)
        return false
      }

      // Update room's active_timer_id
      await supabase
        .from('rooms')
        .update({ active_timer_id: timerId, last_used_at: new Date().toISOString() })
        .eq('id', room.id)

      console.log(`Timer set On Air in Supabase: ${timerId}`)
      return true
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return false
    const timer = room.timers.get(timerId)
    if (!timer) return false

    for (const t of room.timers.values()) {
      t.isOnAir = false
    }
    timer.isOnAir = true
    room.activeTimerId = timerId
    room.lastActivity = Date.now()

    console.log(`Timer set On Air in memory: ${timerId}`)
    return true
  }

  async getTimer(roomId: string, timerId: string): Promise<Timer | undefined> {
    if (isSupabaseEnabled() && supabase) {
      const { data: timer } = await supabase
        .from('timers')
        .select('*')
        .eq('id', timerId)
        .single()

      if (!timer) return undefined

      // Calculate real-time values for running timers
      return this.calculateTimerState({
        id: timer.id,
        name: timer.name,
        settings: {
          ...DEFAULT_TIMER_SETTINGS,
          ...timer.settings,
          duration: timer.duration
        },
        remainingSeconds: timer.remaining_seconds,
        elapsedSeconds: timer.elapsed_seconds,
        status: timer.status as Timer['status'],
        isOnAir: timer.is_on_air,
        startedAt: timer.started_at ? new Date(timer.started_at).getTime() : null,
        started_at: timer.started_at
      })
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return undefined
    const timer = room.timers.get(timerId)
    return timer ? this.calculateTimerState(timer) : undefined
  }

  async getTimers(roomId: string): Promise<Timer[]> {
    if (isSupabaseEnabled() && supabase) {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomId.toUpperCase())
        .single()

      if (!room) return []

      const { data: timers } = await supabase
        .from('timers')
        .select('*')
        .eq('room_id', room.id)
        .order('position', { ascending: true })

      if (!timers) return []

      // Calculate real-time values for all timers
      return timers.map(t => this.calculateTimerState({
        id: t.id,
        name: t.name,
        settings: {
          ...DEFAULT_TIMER_SETTINGS,
          ...t.settings,
          duration: t.duration
        },
        remainingSeconds: t.remaining_seconds,
        elapsedSeconds: t.elapsed_seconds,
        status: t.status as Timer['status'],
        isOnAir: t.is_on_air,
        startedAt: t.started_at ? new Date(t.started_at).getTime() : null,
        started_at: t.started_at
      }))
    }

    // Fallback: in-memory
    const room = this.memoryRooms.get(roomId.toUpperCase())
    if (!room) return []
    return Array.from(room.timers.values()).map(t => this.calculateTimerState(t))
  }

  async getActiveTimer(roomId: string): Promise<Timer | undefined> {
    const room = await this.getRoom(roomId)
    if (!room || !room.activeTimerId) return undefined
    return this.getTimer(roomId, room.activeTimerId)
  }

  // ============ RUNTIME STATE (not persisted) ============

  setController(roomId: string, socketId: string): boolean {
    const normalizedId = roomId.toUpperCase()
    let runtime = this.runtimeState.get(normalizedId)
    if (!runtime) {
      runtime = { controllerSocketId: null, lastActivity: Date.now() }
      this.runtimeState.set(normalizedId, runtime)
    }
    runtime.controllerSocketId = socketId
    runtime.lastActivity = Date.now()

    // Also update in-memory fallback if exists
    const memRoom = this.memoryRooms.get(normalizedId)
    if (memRoom) {
      memRoom.controllerSocketId = socketId
      memRoom.lastActivity = Date.now()
    }

    return true
  }

  isController(roomId: string, socketId: string): boolean {
    const runtime = this.runtimeState.get(roomId.toUpperCase())
    if (runtime?.controllerSocketId === socketId) return true

    // Also check in-memory fallback
    const memRoom = this.memoryRooms.get(roomId.toUpperCase())
    return memRoom?.controllerSocketId === socketId
  }

  async deleteRoom(roomId: string): Promise<void> {
    const normalizedId = roomId.toUpperCase()

    if (isSupabaseEnabled() && supabase) {
      await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('room_code', normalizedId)
    }

    this.runtimeState.delete(normalizedId)
    this.memoryRooms.delete(normalizedId)
    this.timerCounter.delete(normalizedId)
    console.log(`Room deleted: ${roomId}`)
  }

  getRoomCount(): number {
    return this.memoryRooms.size + this.runtimeState.size
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    for (const [id, room] of this.memoryRooms) {
      if (now - room.lastActivity > this.TTL) {
        this.memoryRooms.delete(id)
        this.timerCounter.delete(id)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} expired rooms from memory`)
    }
  }
}

export const roomManager = new RoomManager()
