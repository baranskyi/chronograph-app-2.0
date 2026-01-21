<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Plus, Clock, Trash2, LogOut } from 'lucide-vue-next'

interface Room {
  id: string
  room_code: string
  name: string
  created_at: string
  last_used_at: string
  timer_count?: number
}

const router = useRouter()
const authStore = useAuthStore()

const rooms = ref<Room[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  await loadRooms()
})

async function loadRooms() {
  loading.value = true
  error.value = null

  try {
    // Get only rooms owned by current user
    console.log('loadRooms: userId =', authStore.userId)

    if (!authStore.userId) {
      error.value = 'Not authenticated'
      console.log('loadRooms: Not authenticated, userId is null/undefined')
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
        timers!timers_room_id_fkey(count)
      `)
      .eq('user_id', authStore.userId)
      .eq('is_active', true)
      .order('last_used_at', { ascending: false, nullsFirst: false })

    console.log('loadRooms: query result =', { data, error: fetchError })

    if (fetchError) throw fetchError

    rooms.value = (data || []).map((room: any) => ({
      id: room.id,
      room_code: room.room_code,
      name: room.name,
      created_at: room.created_at,
      last_used_at: room.last_used_at,
      timer_count: Array.isArray(room.timers) ? room.timers.length : room.timers?.count || 0
    }))

    console.log('loadRooms: mapped rooms =', rooms.value.length, 'rooms')
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
    // Generate room code
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
        position: 0
      })

    // Navigate to the new room
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

function openRoom(roomCode: string) {
  router.push(`/room/${roomCode}`)
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/')
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white">
    <!-- Header -->
    <header class="border-b border-[#2a2a2a] bg-[#0f0f0f]">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Chronograph</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-400 text-sm">{{ authStore.userEmail }}</span>
          <button
            class="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
            @click="handleSignOut"
          >
            <LogOut class="w-4 h-4" />
            <span class="text-sm">Sign out</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- Page Title -->
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-semibold">My Rooms</h2>
        <button
          :disabled="creating"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg transition-colors"
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
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="text-gray-400">Loading rooms...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="rooms.length === 0" class="flex flex-col items-center justify-center py-16">
        <div class="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
          <Clock class="w-8 h-8 text-gray-500" />
        </div>
        <h3 class="text-lg font-medium text-gray-300 mb-2">No rooms yet</h3>
        <p class="text-gray-500 mb-6">Create your first room to get started</p>
        <button
          :disabled="creating"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          @click="createRoom"
        >
          <Plus class="w-5 h-5" />
          <span>Create Room</span>
        </button>
      </div>

      <!-- Rooms Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 cursor-pointer hover:border-[#3a3a3a] transition-colors group"
          @click="openRoom(room.room_code)"
        >
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-medium text-lg">{{ room.name }}</h3>
            <button
              class="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              @click="deleteRoom(room.id, $event)"
              title="Delete room"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <div class="text-sm font-mono text-gray-400 mb-4">{{ room.room_code }}</div>

          <div class="flex items-center gap-4 text-sm text-gray-500">
            <div class="flex items-center gap-1">
              <Clock class="w-4 h-4" />
              <span>{{ room.timer_count || 0 }} timers</span>
            </div>
            <div class="flex items-center gap-1">
              <span>Last used {{ formatDate(room.last_used_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
