<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Plus, Clock, Trash2, LogOut, MoreVertical, Edit3 } from 'lucide-vue-next'

interface ActiveTimer {
  id: string
  name: string
  status: string
  remaining_seconds: number
  duration: number
  is_on_air: boolean
}

interface Room {
  id: string
  room_code: string
  name: string
  created_at: string
  last_used_at: string
  timer_count: number
  active_timer: ActiveTimer | null
  timezone: string
}

const router = useRouter()
const authStore = useAuthStore()

const rooms = ref<Room[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)

// Editing state
const editingRoomId = ref<string | null>(null)
const editingName = ref('')

// Menu state
const openMenuId = ref<string | null>(null)

// Get user's timezone
const userTimezone = computed(() => Intl.DateTimeFormat().resolvedOptions().timeZone)

onMounted(async () => {
  await loadRooms()
  // Close menu on outside click
  document.addEventListener('click', closeMenu)
})

function closeMenu() {
  openMenuId.value = null
}

async function loadRooms() {
  loading.value = true
  error.value = null

  try {
    if (!authStore.userId) {
      error.value = 'Not authenticated'
      return
    }

    // Get rooms with active timer info
    const { data, error: fetchError } = await supabase
      .from('rooms')
      .select(`
        id,
        room_code,
        name,
        created_at,
        last_used_at,
        active_timer_id,
        timers!timers_room_id_fkey(id, name, status, remaining_seconds, duration, is_on_air)
      `)
      .eq('user_id', authStore.userId)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false, nullsFirst: false })

    if (fetchError) throw fetchError

    rooms.value = (data || []).map((room: any) => {
      const timers = Array.isArray(room.timers) ? room.timers : []
      const activeTimer = room.active_timer_id
        ? timers.find((t: any) => t.id === room.active_timer_id)
        : timers[0] || null

      return {
        id: room.id,
        room_code: room.room_code,
        name: room.name,
        created_at: room.created_at,
        last_used_at: room.last_used_at,
        timer_count: timers.length,
        active_timer: activeTimer ? {
          id: activeTimer.id,
          name: activeTimer.name,
          status: activeTimer.status,
          remaining_seconds: activeTimer.remaining_seconds,
          duration: activeTimer.duration || activeTimer.remaining_seconds,
          is_on_air: activeTimer.is_on_air || false
        } : null,
        timezone: userTimezone.value
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

    // Create default timer for the room
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

    // Update room's active_timer_id
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

  if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return

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
    if (room) {
      room.name = editingName.value.trim()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to rename room'
  } finally {
    editingRoomId.value = null
  }
}

function cancelEditing() {
  editingRoomId.value = null
}

function toggleMenu(roomId: string, event: Event) {
  event.stopPropagation()
  openMenuId.value = openMenuId.value === roomId ? null : roomId
}

function openRoom(roomCode: string) {
  router.push(`/room/${roomCode}`)
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getProgressPercent(timer: ActiveTimer): number {
  if (!timer.duration || timer.duration === 0) return 100
  return (timer.remaining_seconds / timer.duration) * 100
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running': return 'text-green-400'
    case 'paused': return 'text-yellow-400'
    default: return 'text-gray-400'
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white">
    <!-- Header -->
    <header class="border-b border-[#2a2a2a] bg-[#0f0f0f]">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Chronograph</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-400 text-sm hidden sm:block">{{ authStore.userEmail }}</span>
          <button
            class="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            @click="handleSignOut"
          >
            <LogOut class="w-4 h-4" />
            <span class="text-sm hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- Page Title -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-semibold mb-1">My Rooms</h2>
          <p class="text-gray-500 text-sm">Manage your timer rooms</p>
        </div>
        <button
          :disabled="creating"
          class="flex items-center gap-2 px-5 py-2.5 bg-[#145BF6] hover:bg-[#1048CC] disabled:bg-[#145BF6]/50 rounded-lg transition-colors font-medium"
          @click="createRoom"
        >
          <Plus class="w-5 h-5" />
          <span>{{ creating ? 'Creating...' : 'New Room' }}</span>
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p class="text-red-400">{{ error }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-gray-600 border-t-[#145BF6] rounded-full animate-spin"></div>
          <span class="text-gray-400">Loading rooms...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="rooms.length === 0" class="flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-5 border border-[#2a2a2a]">
          <Clock class="w-10 h-10 text-gray-600" />
        </div>
        <h3 class="text-xl font-medium text-gray-300 mb-2">No rooms yet</h3>
        <p class="text-gray-500 mb-6 text-center max-w-md">
          Create your first room to start managing timers for your events, presentations, or meetings.
        </p>
        <button
          :disabled="creating"
          class="flex items-center gap-2 px-5 py-2.5 bg-[#145BF6] hover:bg-[#1048CC] rounded-lg transition-colors font-medium"
          @click="createRoom"
        >
          <Plus class="w-5 h-5" />
          <span>Create Room</span>
        </button>
      </div>

      <!-- Rooms List (Full Width) -->
      <div v-else class="flex flex-col gap-4">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="relative bg-[#151518] rounded-xl overflow-hidden transition-all"
          :class="[
            room.active_timer?.is_on_air
              ? 'border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
              : 'border border-[#2a2a2a] hover:border-[#3a3a3a]'
          ]"
        >
          <!-- Main Card Content -->
          <div class="p-5 flex items-center gap-6">
            <!-- Left: Room Info -->
            <div class="flex-shrink-0 w-48">
              <!-- Room Name (editable) -->
              <input
                v-if="editingRoomId === room.id"
                v-model="editingName"
                type="text"
                class="w-full bg-[#0a0a0f] border border-[#3a3a3a] rounded px-2 py-1 text-lg font-semibold focus:outline-none focus:border-[#145BF6]"
                @click.stop
                @keydown.enter="saveRoomName(room.id)"
                @keydown.escape="cancelEditing"
                @blur="saveRoomName(room.id)"
                autofocus
              />
              <h3 v-else class="font-semibold text-lg text-white truncate">{{ room.name }}</h3>
              <div class="text-xs font-mono text-gray-500 mt-1">{{ room.room_code }}</div>
            </div>

            <!-- Center: Timer Display -->
            <div class="flex-1 flex flex-col items-center">
              <div
                v-if="room.active_timer"
                class="text-5xl font-mono font-bold tracking-wider"
                :class="[
                  room.active_timer.is_on_air ? 'text-green-400' : 'text-gray-400'
                ]"
                :style="room.active_timer.is_on_air ? 'text-shadow: 0 0 30px rgba(74, 222, 128, 0.6), 0 0 60px rgba(74, 222, 128, 0.3)' : ''"
              >
                {{ formatTime(room.active_timer.remaining_seconds) }}
              </div>
              <div v-else class="text-4xl font-mono text-gray-600">
                --:--
              </div>

              <!-- Progress Bar -->
              <div v-if="room.active_timer" class="w-full max-w-md mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="[
                    room.active_timer.is_on_air ? 'bg-green-500' : 'bg-gray-500'
                  ]"
                  :style="{ width: getProgressPercent(room.active_timer) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex-shrink-0 flex items-center gap-3">
              <!-- ON AIR Badge -->
              <div
                v-if="room.active_timer?.is_on_air"
                class="px-3 py-1.5 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-xs font-semibold uppercase tracking-wide"
              >
                ON AIR
              </div>

              <!-- Enter Room Button -->
              <button
                class="px-5 py-2.5 bg-[#145BF6] hover:bg-[#1048CC] rounded-lg transition-colors font-medium text-sm"
                @click="openRoom(room.room_code)"
              >
                Enter Room
              </button>

              <!-- Menu Button -->
              <div class="relative">
                <button
                  class="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  @click.stop="toggleMenu(room.id, $event)"
                >
                  <MoreVertical class="w-5 h-5" />
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-if="openMenuId === room.id"
                  class="absolute right-0 top-10 w-36 bg-[#1a1a1f] border border-[#2a2a2a] rounded-lg shadow-xl z-10 py-1"
                >
                  <button
                    class="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2"
                    @click="startEditing(room, $event)"
                  >
                    <Edit3 class="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    class="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-[#2a2a2a] flex items-center gap-2"
                    @click="deleteRoom(room.id, $event)"
                  >
                    <Trash2 class="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
