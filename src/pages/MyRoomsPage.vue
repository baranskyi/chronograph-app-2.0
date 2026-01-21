<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Plus, Clock, Trash2, LogOut, MoreVertical, Edit3 } from 'lucide-vue-next'

interface Timer {
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
  active_timer_id: string | null
  timers: Timer[]
}

const router = useRouter()
const authStore = useAuthStore()

const rooms = ref<Room[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)
const editingRoomId = ref<string | null>(null)
const editingName = ref('')
const openMenuId = ref<string | null>(null)

// Timer ticking interval
let tickInterval: ReturnType<typeof setInterval> | null = null

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
})

onUnmounted(() => {
  stopTicking()
  document.removeEventListener('click', closeMenu)
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

    rooms.value = (data || []).map((room: any) => {
      const timers = Array.isArray(room.timers) ? room.timers : []
      // Sort by position
      timers.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))

      return {
        id: room.id,
        room_code: room.room_code,
        name: room.name,
        created_at: room.created_at,
        last_used_at: room.last_used_at,
        active_timer_id: room.active_timer_id,
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

function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  const sign = seconds < 0 ? '-' : ''
  return `${sign}${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimerDisplay(timer: Timer): string {
  return `${formatTime(timer.remaining_seconds)} / ${formatTime(timer.duration)}`
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
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white">
    <!-- Header -->
    <header class="border-b border-[#2a2a2a] bg-[#0f0f0f]">
      <div class="max-w-6xl mx-auto" style="padding: 16px 24px;">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">Chronograph</h1>
          <div class="flex items-center gap-4">
            <span class="text-gray-400 text-sm hidden sm:block">{{ authStore.userEmail }}</span>
            <button
              class="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
              style="padding: 8px 12px;"
              @click="handleSignOut"
            >
              <LogOut class="w-4 h-4" />
              <span class="text-sm hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="max-w-6xl mx-auto" style="padding: 32px 24px;">
      <!-- Title Row -->
      <div class="flex items-center justify-between" style="margin-bottom: 32px;">
        <div>
          <h2 class="text-2xl font-semibold" style="margin-bottom: 4px;">My Rooms</h2>
          <p class="text-gray-500 text-sm">Manage your timer rooms</p>
        </div>
        <button
          :disabled="creating"
          class="flex items-center gap-2 bg-[#145BF6] hover:bg-[#1048CC] disabled:opacity-50 rounded-lg transition-colors font-medium"
          style="padding: 10px 20px;"
          @click="createRoom"
        >
          <Plus class="w-5 h-5" />
          <span>{{ creating ? 'Creating...' : 'New Room' }}</span>
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg" style="padding: 16px; margin-bottom: 24px;">
        <p class="text-red-400">{{ error }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center" style="padding: 80px 0;">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-gray-600 border-t-[#145BF6] rounded-full animate-spin"></div>
          <span class="text-gray-400">Loading rooms...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="rooms.length === 0" class="flex flex-col items-center justify-center" style="padding: 80px 0;">
        <div class="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#2a2a2a]" style="margin-bottom: 20px;">
          <Clock class="w-10 h-10 text-gray-600" />
        </div>
        <h3 class="text-xl font-medium text-gray-300" style="margin-bottom: 8px;">No rooms yet</h3>
        <p class="text-gray-500 text-center max-w-md" style="margin-bottom: 24px;">
          Create your first room to start managing timers.
        </p>
        <button
          :disabled="creating"
          class="flex items-center gap-2 bg-[#145BF6] hover:bg-[#1048CC] rounded-lg transition-colors font-medium"
          style="padding: 10px 20px;"
          @click="createRoom"
        >
          <Plus class="w-5 h-5" />
          <span>Create Room</span>
        </button>
      </div>

      <!-- ROOMS LIST -->
      <div v-else class="flex flex-col" style="gap: 16px;">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="bg-[#151518] rounded-xl transition-all"
          :class="hasRunningTimer(room) ? 'room-card-active' : 'room-card-inactive'"
        >
          <div class="flex items-start" style="padding: 20px 24px; gap: 24px;">
            <!-- LEFT: Room Info -->
            <div style="width: 160px; flex-shrink: 0;">
              <input
                v-if="editingRoomId === room.id"
                v-model="editingName"
                type="text"
                class="w-full bg-[#0a0a0f] border border-[#3a3a3a] rounded text-lg font-semibold focus:outline-none focus:border-[#145BF6]"
                style="padding: 4px 8px;"
                @click.stop
                @keydown.enter="saveRoomName(room.id)"
                @keydown.escape="cancelEditing"
                @blur="saveRoomName(room.id)"
                autofocus
              />
              <h3 v-else class="font-semibold text-lg text-white truncate">{{ room.name }}</h3>
              <div class="text-xs font-mono text-gray-500" style="margin-top: 4px;">{{ room.room_code }}</div>
            </div>

            <!-- CENTER: Timer Bars -->
            <div class="flex flex-col" style="gap: 4px; max-width: 400px;">
              <div
                v-for="timer in room.timers"
                :key="timer.id"
                class="relative flex items-center rounded overflow-hidden"
                :class="isTimerSelected(room, timer) ? 'bg-blue-600' : 'bg-[#1a1a1a]'"
                style="height: 24px;"
              >
                <!-- Progress overlay for running timers -->
                <div
                  v-if="timer.status === 'running'"
                  class="absolute inset-0 transition-all duration-200 pointer-events-none"
                  :class="isTimerSelected(room, timer) ? 'bg-blue-500' : 'bg-blue-600/50'"
                  :style="{ width: getTimerProgress(timer) + '%' }"
                ></div>

                <!-- Timer Name -->
                <div class="relative z-10 text-xs font-medium flex-1 truncate" style="padding-left: 8px;">
                  {{ timer.name }}
                </div>

                <!-- Time: current / total -->
                <div class="relative z-10 text-xs font-mono text-gray-300" style="padding-right: 8px;">
                  {{ formatTimerDisplay(timer) }}
                </div>
              </div>

              <!-- No timers message -->
              <div v-if="room.timers.length === 0" class="text-gray-500 text-xs italic">
                No timers
              </div>
            </div>

            <!-- RIGHT: Actions -->
            <div class="flex items-center" style="gap: 12px; flex-shrink: 0;">
              <!-- Enter Room -->
              <button
                class="bg-[#145BF6] hover:bg-[#1048CC] rounded-lg transition-colors font-medium text-sm"
                style="padding: 10px 20px;"
                @click="openRoom(room.room_code)"
              >
                Enter Room
              </button>

              <!-- Menu -->
              <div class="relative">
                <button
                  class="text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  style="padding: 8px;"
                  @click.stop="toggleMenu(room.id, $event)"
                >
                  <MoreVertical class="w-5 h-5" />
                </button>

                <div
                  v-if="openMenuId === room.id"
                  class="absolute right-0 bg-[#1a1a1f] border border-[#2a2a2a] rounded-lg shadow-xl z-10"
                  style="top: 40px; width: 144px; padding: 4px 0;"
                >
                  <button
                    class="w-full text-left text-sm text-gray-300 hover:bg-[#2a2a2a] flex items-center gap-2"
                    style="padding: 8px 12px;"
                    @click="startEditing(room, $event)"
                  >
                    <Edit3 class="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    class="w-full text-left text-sm text-red-400 hover:bg-[#2a2a2a] flex items-center gap-2"
                    style="padding: 8px 12px;"
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

<style scoped>
.room-card-active {
  border: 2px solid #22c55e;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1);
}

.room-card-inactive {
  border: 1px solid #2a2a2a;
}

.room-card-inactive:hover {
  border-color: #3a3a3a;
}
</style>
