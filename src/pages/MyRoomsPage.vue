<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Plus, Clock, Trash2, LogOut, MoreVertical, Edit3 } from 'lucide-vue-next'

declare const __APP_VERSION__: string
const APP_VERSION = __APP_VERSION__

interface Timer {
  id: string
  name: string
  status: string
  remaining_seconds: number
  duration: number
  is_on_air: boolean
  question_count?: number  // Q&A messages count per timer
}

interface Room {
  id: string
  room_code: string
  name: string
  created_at: string
  last_used_at: string
  active_timer_id: string | null
  timers: Timer[]
  question_count: number  // Total Q&A messages for this room
}

// Filter types
type RoomFilter = 'all' | 'active' | 'inactive' | 'with-messages'

const router = useRouter()
const authStore = useAuthStore()

const rooms = ref<Room[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)
const editingRoomId = ref<string | null>(null)
const editingName = ref('')
const openMenuId = ref<string | null>(null)

// Filter state
const activeFilter = ref<RoomFilter>('all')

// Left panel glow effect
const leftPanelRef = ref<HTMLElement | null>(null)
const leftGlowX = ref(0)
const leftGlowY = ref(0)
const isLeftHovering = ref(false)

function handleLeftPanelMouseMove(e: MouseEvent) {
  if (!leftPanelRef.value) return
  const rect = leftPanelRef.value.getBoundingClientRect()
  leftGlowX.value = e.clientX - rect.left
  leftGlowY.value = e.clientY - rect.top
}

// Filter counts
const filterCounts = computed(() => ({
  all: rooms.value.length,
  active: rooms.value.filter(r => hasRunningTimer(r)).length,
  inactive: rooms.value.filter(r => !hasRunningTimer(r)).length,
  withMessages: rooms.value.filter(r => r.question_count > 0).length
}))

// Filtered rooms based on active filter
const filteredRooms = computed(() => {
  switch (activeFilter.value) {
    case 'active':
      return rooms.value.filter(r => hasRunningTimer(r))
    case 'inactive':
      return rooms.value.filter(r => !hasRunningTimer(r))
    case 'with-messages':
      return rooms.value.filter(r => r.question_count > 0)
    default:
      return rooms.value
  }
})

// Glow effect state for room cards
const hoveredRoomId = ref<string | null>(null)
const roomGlowPos = ref<{ [key: string]: { x: number; y: number } }>({})

function handleRoomMouseMove(roomId: string, e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  roomGlowPos.value[roomId] = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function handleRoomMouseEnter(roomId: string) {
  hoveredRoomId.value = roomId
}

function handleRoomMouseLeave() {
  hoveredRoomId.value = null
}

// Canvas animation refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null

// Ocean animation toggle - persist to localStorage
const OCEAN_STORAGE_KEY = 'chronograph-ocean-enabled'
const oceanEnabled = ref(localStorage.getItem(OCEAN_STORAGE_KEY) !== 'false')

// Timer ticking interval
let tickInterval: ReturnType<typeof setInterval> | null = null

// Wave animation constants - 30-degree tilt, same as Login/Register
const WAVE_FREQUENCY = 0.6
const WAVE_AMPLITUDE = 0.4
const DOT_COLOR = { r: 239, g: 68, b: 68 } // Red accent
const GRID_COLS = 180
const GRID_ROWS = 120

interface Distortion {
  x: number
  y: number
  intensity: number
  decay: number
  time: number
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    canvas.style.display = 'none'
    return
  }

  let width = window.innerWidth
  let height = window.innerHeight

  const resizeCanvas = () => {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const distortions: Distortion[] = []
  let lastDistortionTime = 0

  function animate(time: number) {
    ctx!.clearRect(0, 0, width, height)

    // Distortion spawning - 3x more frequent, 2x more likely in center
    if (time - lastDistortionTime > 3333 + Math.random() * 5000) {
      // 2x probability for center: 66% chance center, 33% chance edges
      let x, y
      if (Math.random() < 0.66) {
        // Center bias - spawn in middle 50% of screen
        x = GRID_COLS * 0.25 + Math.random() * GRID_COLS * 0.5
        y = GRID_ROWS * 0.25 + Math.random() * GRID_ROWS * 0.5
      } else {
        // Random across entire grid
        x = Math.random() * GRID_COLS
        y = Math.random() * GRID_ROWS
      }
      distortions.push({
        x,
        y,
        intensity: 0.8 + Math.random() * 0.4,
        decay: 0.994,
        time: time
      })
      lastDistortionTime = time
    }

    // Update and filter distortions
    for (let i = distortions.length - 1; i >= 0; i--) {
      const d = distortions[i]
      if (d) {
        d.intensity *= d.decay
        if (d.intensity < 0.01) {
          distortions.splice(i, 1)
        }
      }
    }

    // 30-DEGREE TILT - top further away, bottom closer (same as Login/Register)
    const TILT_ANGLE = 30 * Math.PI / 180
    const perspectiveMin = 0.4
    const perspectiveMax = 1.3
    const extendX = 0.5
    const extendYTop = 0.8
    const extendYBottom = 0.3
    const centerX = width / 2
    const centerY = height / 2

    // Draw dots with 30-degree perspective tilt
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const nx = col / (GRID_COLS - 1)
        const ny = row / (GRID_ROWS - 1)

        const perspectiveScale = perspectiveMin + ny * (perspectiveMax - perspectiveMin)

        const baseX = (nx - 0.5) * width * (1 + extendX * 2)
        const baseY = -height * extendYTop + ny * height * (1 + extendYTop + extendYBottom)

        const perspX = centerX + baseX * perspectiveScale
        const perspY = centerY + (baseY - centerY) * perspectiveScale * Math.cos(TILT_ANGLE)

        const wavePhase = (col / GRID_COLS) * Math.PI * 4 + (row / GRID_ROWS) * Math.PI * 2
        let waveOffset = Math.sin(wavePhase + time * 0.001 * WAVE_FREQUENCY) * WAVE_AMPLITUDE

        let distortionOffset = 0
        let distortionGlow = 0
        for (const d of distortions) {
          const dx = col - d.x
          const dy = row - d.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 40
          if (dist < maxDist) {
            const factor = (1 - dist / maxDist) * d.intensity
            distortionOffset += Math.sin(dist * 0.3 - time * 0.002) * factor * 8
            distortionGlow += factor
          }
        }

        const screenX = perspX
        const screenY = perspY + waveOffset * 20 * perspectiveScale + distortionOffset

        if (screenX < -30 || screenX > width + 30 || screenY < -30 || screenY > height + 30) continue

        const depthFade = 0.15 + ny * 0.5
        const waveBonus = (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.2
        const finalOpacity = Math.min(0.9, depthFade + waveBonus + distortionGlow * 0.4)

        const baseSize = (0.6 + ny * 1.4) * perspectiveScale * 0.7
        const waveSize = 1 + (waveOffset + WAVE_AMPLITUDE) / (2 * WAVE_AMPLITUDE) * 0.25
        const distortionSize = 1 + distortionGlow * 1.5
        const dotSize = baseSize * waveSize * distortionSize

        const r = DOT_COLOR.r
        const g = DOT_COLOR.g + distortionGlow * 80
        const b = DOT_COLOR.b + distortionGlow * 120

        ctx!.beginPath()
        ctx!.arc(screenX, screenY, Math.max(0.4, dotSize), 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`
        ctx!.fill()

        if (distortionGlow > 0.1) {
          ctx!.beginPath()
          ctx!.arc(screenX, screenY, dotSize * 2.5, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(${r}, ${g + 40}, ${b + 80}, ${distortionGlow * 0.12})`
          ctx!.fill()
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

function startTicking() {
  if (tickInterval) return
  tickInterval = setInterval(() => {
    rooms.value.forEach(room => {
      room.timers.forEach(timer => {
        if (timer.status === 'running' && timer.remaining_seconds > 0) {
          timer.remaining_seconds--
        }
      })
    })
  }, 1000)
}

function stopTicking() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

onMounted(async () => {
  await loadRooms()
  startTicking()
  document.addEventListener('click', closeMenu)
  // Only init canvas if ocean is enabled
  if (oceanEnabled.value) {
    initCanvas()
  }
})

onUnmounted(() => {
  stopTicking()
  document.removeEventListener('click', closeMenu)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

function closeMenu() {
  openMenuId.value = null
}

function toggleOcean() {
  oceanEnabled.value = !oceanEnabled.value
  // Save preference to localStorage
  localStorage.setItem(OCEAN_STORAGE_KEY, String(oceanEnabled.value))
  if (oceanEnabled.value) {
    initCanvas()
  } else {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    // Clear canvas to black
    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#080808'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }
}

async function loadRooms() {
  loading.value = true
  error.value = null

  try {
    if (!authStore.userId) {
      error.value = 'Not authenticated'
      return
    }

    const { data, error: fetchError } = await supabase
      .from('rooms')
      .select(`
        id,
        room_code,
        name,
        created_at,
        last_used_at,
        active_timer_id,
        timers!timers_room_id_fkey(id, name, status, remaining_seconds, duration, is_on_air, position)
      `)
      .eq('user_id', authStore.userId)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false, nullsFirst: false })

    if (fetchError) throw fetchError

    // Get room IDs for question count query
    const roomIds = (data || []).map((r: any) => r.id)

    // Fetch question counts per room (pending questions only)
    let questionCounts: { [key: string]: number } = {}
    if (roomIds.length > 0) {
      const { data: questionsData } = await supabase
        .from('questions')
        .select('room_id')
        .in('room_id', roomIds)
        .eq('status', 'pending')

      if (questionsData) {
        for (const q of questionsData) {
          questionCounts[q.room_id] = (questionCounts[q.room_id] || 0) + 1
        }
      }
    }

    rooms.value = (data || []).map((room: any) => {
      const timers = Array.isArray(room.timers) ? room.timers : []
      timers.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

      return {
        id: room.id,
        room_code: room.room_code,
        name: room.name,
        created_at: room.created_at,
        last_used_at: room.last_used_at,
        active_timer_id: room.active_timer_id,
        question_count: questionCounts[room.id] || 0,
        timers: timers.map((t: any) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          remaining_seconds: t.remaining_seconds,
          duration: t.duration || t.remaining_seconds,
          is_on_air: t.is_on_air || false
        }))
      }
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load rooms'
    console.error('Error loading rooms:', err)
  } finally {
    loading.value = false
  }
}

async function createRoom() {
  creating.value = true
  error.value = null

  try {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let roomCode = ''
    for (let i = 0; i < 8; i++) {
      if (i === 4) roomCode += '-'
      roomCode += chars[Math.floor(Math.random() * chars.length)]
    }

    const { data, error: createError } = await supabase
      .from('rooms')
      .insert({
        user_id: authStore.userId!,
        room_code: roomCode,
        name: `Room ${rooms.value.length + 1}`
      })
      .select()
      .single()

    if (createError) throw createError

    await supabase
      .from('timers')
      .insert({
        room_id: data.id,
        name: 'Timer 1',
        duration: 300,
        remaining_seconds: 300,
        position: 0,
        is_on_air: true
      })

    const { data: timerData } = await supabase
      .from('timers')
      .select('id')
      .eq('room_id', data.id)
      .single()

    if (timerData) {
      await supabase
        .from('rooms')
        .update({ active_timer_id: timerData.id })
        .eq('id', data.id)
    }

    router.push(`/room/${data.room_code}`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create room'
    console.error('Error creating room:', err)
  } finally {
    creating.value = false
  }
}

async function deleteRoom(roomId: string, event: Event) {
  event.stopPropagation()
  openMenuId.value = null

  if (!confirm('Are you sure you want to delete this room?')) return

  try {
    const { error: deleteError } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', roomId)

    if (deleteError) throw deleteError
    rooms.value = rooms.value.filter(r => r.id !== roomId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete room'
  }
}

function startEditing(room: Room, event: Event) {
  event.stopPropagation()
  openMenuId.value = null
  editingRoomId.value = room.id
  editingName.value = room.name
}

async function saveRoomName(roomId: string) {
  if (!editingName.value.trim()) {
    editingRoomId.value = null
    return
  }

  try {
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ name: editingName.value.trim() })
      .eq('id', roomId)

    if (updateError) throw updateError

    const room = rooms.value.find(r => r.id === roomId)
    if (room) room.name = editingName.value.trim()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to rename room'
  } finally {
    editingRoomId.value = null
  }
}

function cancelEditing() {
  editingRoomId.value = null
}

// toggleMenu moved to bottom with positioning logic

function openRoom(roomCode: string) {
  router.push(`/room/${roomCode}`)
}

// Navigate to room with specific timer selected
function openRoomWithTimer(roomCode: string, timerId: string) {
  router.push(`/room/${roomCode}?timer=${timerId}`)
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/')
}

function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  const sign = seconds < 0 ? '-' : ''
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`
}

function getTimerColorClass(timer: Timer): string {
  if (timer.status !== 'running') return 'text-gray-400'
  const percentage = timer.remaining_seconds / timer.duration
  if (percentage > 0.5) return 'text-emerald-400'
  if (percentage > 0.2) return 'text-amber-400'
  return 'text-red-400'
}

function getTimerProgress(timer: Timer): number {
  if (!timer.duration || timer.duration === 0) return 0
  const elapsed = timer.duration - timer.remaining_seconds
  return Math.min(100, Math.max(0, (elapsed / timer.duration) * 100))
}

function isTimerSelected(room: Room, timer: Timer): boolean {
  return room.active_timer_id === timer.id
}

function hasRunningTimer(room: Room): boolean {
  return room.timers.some(t => t.status === 'running')
}

function getTimerCount(room: Room): number {
  return room.timers.length
}

// Store menu button positions for dropdown positioning
const menuButtonRects = ref<Map<string, DOMRect>>(new Map())

function toggleMenu(roomId: string, event: Event) {
  event.stopPropagation()

  // Store the button position before toggling
  const button = event.currentTarget as HTMLElement
  if (button) {
    menuButtonRects.value.set(roomId, button.getBoundingClientRect())
  }

  openMenuId.value = openMenuId.value === roomId ? null : roomId
}

// Get dropdown position style
function getDropdownStyle(roomId: string) {
  const rect = menuButtonRects.value.get(roomId)
  if (!rect) {
    return { top: '200px', right: '24px' }
  }
  return {
    top: `${rect.bottom + 8}px`,
    left: `${rect.right - 160}px`
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#080808] text-white relative overflow-hidden">
    <!-- Animated Background Canvas -->
    <canvas
      ref="canvasRef"
      class="fixed inset-0 w-full h-full pointer-events-none"
      style="z-index: 0;"
    ></canvas>

    <!-- Depth overlay for better readability -->
    <div class="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" style="z-index: 1;"></div>

    <!-- Content -->
    <div class="relative flex flex-col min-h-screen" style="z-index: 2;">
      <!-- Header - Glassmorphism -->
      <header class="flex-shrink-0 glass-header">
        <div class="max-w-6xl mx-auto" style="padding: 16px 24px;">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold flex items-center gap-3">
              <span class="logo-pulse"></span>
              <span class="tracking-tight">Chronograph <span class="text-red-500">Pro</span></span>
            </h1>
            <div class="flex items-center gap-4">
              <span class="text-gray-400 text-sm hidden sm:block">{{ authStore.userEmail }}</span>
              <button
                class="flex items-center gap-2 text-gray-400 hover:text-white glass-button-subtle rounded-lg transition-all duration-200 cursor-pointer"
                style="padding: 8px 14px;"
                @click="handleSignOut"
              >
                <LogOut class="w-4 h-4" />
                <span class="text-sm hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main - Two Column Layout -->
      <main class="flex-1 flex overflow-hidden">
        <!-- LEFT: Filter Panel - Glassmorphism -->
        <div
          ref="leftPanelRef"
          class="w-[280px] glass-panel flex flex-col py-4 relative overflow-hidden flex-shrink-0"
          style="padding-left: 20px; padding-right: 20px;"
          @mousemove="handleLeftPanelMouseMove"
          @mouseenter="isLeftHovering = true"
          @mouseleave="isLeftHovering = false"
        >
          <!-- Glow effect -->
          <div
            class="glow-effect"
            :class="{ active: isLeftHovering }"
            :style="{
              '--glow-x': leftGlowX + 'px',
              '--glow-y': leftGlowY + 'px'
            }"
          ></div>

          <!-- Panel Title -->
          <div class="flex items-center gap-3 relative z-10" style="margin-top: 24px; margin-bottom: 32px;">
            <h2 class="text-2xl font-bold text-gray-100">Filters</h2>
            <!-- Ocean toggle button -->
            <button
              class="ocean-toggle-btn"
              :title="oceanEnabled ? 'Hide ocean animation' : 'Show ocean animation'"
              @click="toggleOcean"
            >
              <svg v-if="oceanEnabled" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Filter Buttons -->
          <div class="flex flex-col gap-2 relative z-10">
            <button
              class="filter-btn"
              :class="{ 'filter-btn-active': activeFilter === 'all' }"
              @click="activeFilter = 'all'"
            >
              <span class="filter-btn-label">All Rooms</span>
              <span class="filter-btn-count">{{ filterCounts.all }}</span>
            </button>

            <button
              class="filter-btn"
              :class="{ 'filter-btn-active': activeFilter === 'active' }"
              @click="activeFilter = 'active'"
            >
              <span class="filter-btn-label flex items-center gap-2">
                <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Active
              </span>
              <span class="filter-btn-count">{{ filterCounts.active }}</span>
            </button>

            <button
              class="filter-btn"
              :class="{ 'filter-btn-active': activeFilter === 'inactive' }"
              @click="activeFilter = 'inactive'"
            >
              <span class="filter-btn-label">Inactive</span>
              <span class="filter-btn-count">{{ filterCounts.inactive }}</span>
            </button>

            <button
              class="filter-btn"
              :class="{ 'filter-btn-active': activeFilter === 'with-messages' }"
              @click="activeFilter = 'with-messages'"
            >
              <span class="filter-btn-label flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                With Messages
              </span>
              <span class="filter-btn-count" :class="{ 'filter-btn-count-highlight': filterCounts.withMessages > 0 }">{{ filterCounts.withMessages }}</span>
            </button>
          </div>

          <!-- Create Room Button -->
          <div class="mt-auto relative z-10" style="padding-top: 24px;">
            <button
              :disabled="creating"
              class="w-full flex items-center justify-center gap-2 glass-button-muted rounded-xl transition-all duration-200 font-semibold cursor-pointer"
              style="padding: 14px 20px;"
              @click="createRoom"
            >
              <Plus class="w-5 h-5" />
              <span>{{ creating ? 'Creating...' : 'New Room' }}</span>
            </button>
          </div>
        </div>

        <!-- RIGHT: Rooms Content -->
        <div class="flex-1 overflow-y-auto" style="padding: 40px 24px;">
          <div class="max-w-5xl">
            <!-- Title Row -->
            <div class="flex items-center justify-between" style="margin-bottom: 40px;">
              <div>
                <h2 class="text-3xl font-bold tracking-tight" style="margin-bottom: 8px;">My Rooms</h2>
                <p class="text-gray-500">{{ filteredRooms.length }} room{{ filteredRooms.length !== 1 ? 's' : '' }} {{ activeFilter !== 'all' ? '(filtered)' : '' }}</p>
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="glass-error rounded-xl" style="padding: 16px; margin-bottom: 24px;">
              <p class="text-red-400">{{ error }}</p>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center" style="padding: 120px 0;">
              <div class="flex flex-col items-center gap-4">
                <div class="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                <span class="text-gray-400">Loading rooms...</span>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="rooms.length === 0" class="flex flex-col items-center justify-center" style="padding: 100px 0;">
              <div class="glass-card w-24 h-24 rounded-2xl flex items-center justify-center" style="margin-bottom: 24px;">
                <Clock class="w-12 h-12 text-red-500/60" />
              </div>
              <h3 class="text-2xl font-semibold text-white" style="margin-bottom: 8px;">No rooms yet</h3>
              <p class="text-gray-500 text-center max-w-md" style="margin-bottom: 32px;">
                Create your first room to start managing timers for your events.
              </p>
              <button
                :disabled="creating"
                class="flex items-center gap-2 glass-button-muted rounded-xl transition-all duration-200 font-semibold cursor-pointer"
                style="padding: 14px 28px;"
                @click="createRoom"
              >
                <Plus class="w-5 h-5" />
                <span>Create Room</span>
              </button>
            </div>

            <!-- Filtered Empty State -->
            <div v-else-if="filteredRooms.length === 0" class="flex flex-col items-center justify-center" style="padding: 80px 0;">
              <div class="text-gray-500 text-lg" style="margin-bottom: 16px;">No rooms match this filter</div>
              <button
                class="text-red-400 hover:text-red-300 transition-colors"
                @click="activeFilter = 'all'"
              >
                Show all rooms
              </button>
            </div>

            <!-- ROOMS LIST -->
            <div v-else class="grid gap-5">
            <div
              v-for="room in filteredRooms"
              :key="room.id"
              class="glass-card-room group"
              :class="{ 'glass-card-room-active': hasRunningTimer(room) }"
              @mousemove="handleRoomMouseMove(room.id, $event)"
              @mouseenter="handleRoomMouseEnter(room.id)"
              @mouseleave="handleRoomMouseLeave"
            >
              <!-- Glow effect -->
              <div
                class="room-glow-effect"
                :class="{ active: hoveredRoomId === room.id }"
                :style="{
                  '--glow-x': (roomGlowPos[room.id]?.x || 0) + 'px',
                  '--glow-y': (roomGlowPos[room.id]?.y || 0) + 'px'
                }"
              ></div>
              <div class="flex items-start relative z-10" style="padding: 24px; gap: 24px;">
                <!-- LEFT: Room Info -->
                <div style="width: 180px; flex-shrink: 0;">
                  <!-- LIVE indicator and Message badge row -->
                  <div class="flex items-center gap-2 mb-3">
                    <span v-if="hasRunningTimer(room)" class="live-badge">
                      <span class="live-dot"></span>
                      LIVE
                    </span>
                    <!-- Message count badge -->
                    <span v-if="room.question_count > 0" class="message-badge">
                      {{ room.question_count }}
                    </span>
                  </div>
                  <input
                    v-if="editingRoomId === room.id"
                    v-model="editingName"
                    type="text"
                    class="w-full bg-white/5 border border-white/20 rounded-lg text-lg font-semibold focus:outline-none focus:border-red-500/50 backdrop-blur-sm"
                    style="padding: 6px 10px;"
                    @click.stop
                    @keydown.enter="saveRoomName(room.id)"
                    @keydown.escape="cancelEditing"
                    @blur="saveRoomName(room.id)"
                    autofocus
                  />
                  <h3 v-else class="font-semibold text-xl text-white truncate">{{ room.name }}</h3>
                  <div class="flex items-center gap-2" style="margin-top: 8px;">
                    <span class="text-xs font-mono text-gray-500 bg-white/5 rounded px-2 py-1">{{ room.room_code }}</span>
                  </div>
                  <div class="text-xs text-gray-600" style="margin-top: 8px;">
                    {{ getTimerCount(room) }} timer{{ getTimerCount(room) !== 1 ? 's' : '' }}
                  </div>
                </div>

                <!-- CENTER: Timer Bars - CLICKABLE -->
                <div class="flex-1 flex justify-center">
                  <div class="flex flex-col w-full" style="gap: 6px; max-width: 450px;">
                    <div
                      v-for="timer in room.timers"
                      :key="timer.id"
                      class="glass-timer-bar relative flex items-center rounded-lg overflow-hidden cursor-pointer"
                      :class="{
                        'glass-timer-selected': isTimerSelected(room, timer),
                        'glass-timer-running': timer.status === 'running'
                      }"
                      style="height: 36px;"
                      @click.stop="openRoomWithTimer(room.room_code, timer.id)"
                    >
                      <!-- Progress overlay -->
                      <div
                        class="absolute inset-0 transition-all duration-500 pointer-events-none"
                        :class="timer.status === 'running' ? 'timer-progress-running' : 'timer-progress-idle'"
                        :style="{ width: getTimerProgress(timer) + '%' }"
                      ></div>

                      <!-- Simple stopwatch icon -->
                      <div class="relative z-10 flex items-center justify-center w-8">
                        <svg
                          class="w-3.5 h-3.5"
                          :class="timer.status === 'running' ? 'text-red-400' : 'text-gray-500'"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <circle cx="12" cy="13" r="8" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="13" x2="15" y2="13" />
                          <line x1="12" y1="1" x2="12" y2="4" />
                          <line x1="9" y1="2" x2="15" y2="2" />
                        </svg>
                      </div>

                      <!-- Timer Name -->
                      <div class="relative z-10 text-sm font-medium flex-1 truncate">
                        {{ timer.name }}
                      </div>

                      <!-- Time display -->
                      <div
                        class="relative z-10 text-sm font-mono font-semibold tabular-nums"
                        :class="getTimerColorClass(timer)"
                        style="padding-right: 12px;"
                      >
                        {{ formatTime(timer.remaining_seconds) }}
                      </div>
                    </div>

                    <!-- No timers message -->
                    <div v-if="room.timers.length === 0" class="text-gray-600 text-sm italic text-center" style="padding: 12px;">
                      No timers configured
                    </div>
                  </div>
                </div>

                <!-- RIGHT: Actions -->
                <div class="flex items-center" style="gap: 12px; flex-shrink: 0;">
                  <!-- Enter Room -->
                  <button
                    class="glass-button-muted rounded-xl transition-all duration-200 font-medium text-sm cursor-pointer"
                    style="padding: 12px 24px;"
                    @click.stop="openRoom(room.room_code)"
                  >
                    Enter Room
                  </button>

                  <!-- Menu -->
                  <div class="relative">
                    <button
                      class="text-gray-500 hover:text-white glass-button-subtle rounded-lg transition-all duration-200 cursor-pointer"
                      style="padding: 10px;"
                      @click.stop="toggleMenu(room.id, $event)"
                    >
                      <MoreVertical class="w-5 h-5" />
                    </button>

                    <!-- Dropdown Menu - FIXED z-index, glassmorphism -->
                    <Teleport to="body">
                      <Transition name="menu">
                        <div
                          v-if="openMenuId === room.id"
                          class="glass-dropdown fixed"
                          :style="getDropdownStyle(room.id)"
                        >
                          <button
                            class="w-full text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                            style="padding: 10px 14px;"
                            @click="startEditing(room, $event)"
                          >
                            <Edit3 class="w-4 h-4" />
                            Rename
                          </button>
                          <button
                            class="w-full text-left text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 rounded-lg transition-colors cursor-pointer"
                            style="padding: 10px 14px;"
                            @click="deleteRoom(room.id, $event)"
                          >
                            <Trash2 class="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </Transition>
                    </Teleport>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer - Glassmorphism -->
      <footer class="flex-shrink-0 glass-footer flex items-center justify-center" style="padding: 16px;">
        <span class="text-xs text-gray-500">
          chronograph.pro · v{{ APP_VERSION }}
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Glassmorphism base styles */
.glass-header {
  background: rgba(8, 8, 8, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-footer {
  background: rgba(8, 8, 8, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

/* Glow effect for panels */
.glow-effect {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  background: radial-gradient(
    600px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(239, 68, 68, 0.1),
    transparent 40%
  );
}

.glow-effect.active {
  opacity: 1;
}

/* Filter buttons */
.filter-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.filter-btn-active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: white;
}

.filter-btn-active:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.filter-btn-label {
  display: flex;
  align-items: center;
}

.filter-btn-count {
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 600;
}

.filter-btn-count-highlight {
  background: rgba(239, 68, 68, 0.8);
  color: white;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
  }
}

/* Message badge for room cards */
.message-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.6), 0 0 24px rgba(239, 68, 68, 0.3);
  animation: message-glow 2s ease-in-out infinite;
}

@keyframes message-glow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.6), 0 0 24px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), 0 0 32px rgba(239, 68, 68, 0.5);
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-card-room {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.glass-card-room:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.glass-card-room-active {
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.1), 0 0 60px rgba(239, 68, 68, 0.05);
}

.glass-card-room-active:hover {
  border-color: rgba(239, 68, 68, 0.4);
}

/* Room card glow effect */
.room-glow-effect {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  background: radial-gradient(
    500px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(239, 68, 68, 0.15),
    transparent 40%
  );
  z-index: 1;
}

.room-glow-effect.active {
  opacity: 1;
}

/* Timer bars with glass effect - CLICKABLE */
.glass-timer-bar {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;
}

.glass-timer-bar:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.glass-timer-selected {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.glass-timer-selected:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.glass-timer-running {
  border-color: rgba(239, 68, 68, 0.2);
}

.timer-progress-running {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.08));
}

.timer-progress-idle {
  background: rgba(255, 255, 255, 0.03);
}

/* Glass buttons - balanced brightness */
.glass-button-muted {
  background: rgba(210, 70, 70, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.glass-button-muted:hover {
  background: rgba(230, 80, 80, 0.7);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.glass-button-muted:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.glass-button-subtle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-button-subtle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Glass dropdown menu - true glassmorphism, high z-index */
.glass-dropdown {
  background: rgba(40, 30, 45, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(239, 68, 68, 0.06);
  padding: 6px;
  width: 160px;
  z-index: 99999 !important;
}

/* Glass error */
.glass-error {
  background: rgba(239, 68, 68, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* LIVE badge with muted glow */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(180, 60, 60, 0.7);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  animation: live-glow 2s ease-in-out infinite;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  animation: live-dot-pulse 1s ease-in-out infinite;
}

@keyframes live-glow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
  }
}

@keyframes live-dot-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Logo pulse - red circle */
.logo-pulse {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4);
  animation: logo-pulse 3s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.95);
    box-shadow: 0 0 12px rgba(239, 68, 68, 1), 0 0 30px rgba(239, 68, 68, 0.6);
  }
}

/* Menu transition */
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Ocean toggle button */
.ocean-toggle-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ocean-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}
</style>
