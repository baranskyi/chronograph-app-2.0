<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFullscreen } from '@vueuse/core'
import { useRoomStore } from '../stores/roomStore'
import TimerDisplay from '../components/TimerDisplay.vue'
import ConnectionStatus from '../components/ConnectionStatus.vue'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()

const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

const loading = ref(true)
const error = ref<string | null>(null)

const roomId = (route.params.roomId as string).toUpperCase()

onMounted(async () => {
  try {
    await roomStore.joinAsViewer(roomId)
    loading.value = false
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    error.value = errorMessage
    loading.value = false
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  roomStore.disconnect()
})

function handleKeydown(e: KeyboardEvent) {
  switch (e.key.toLowerCase()) {
    case 'f':
      toggleFullscreen()
      break
    case 'escape':
      if (isFullscreen.value) {
        exitFullscreen()
      }
      break
  }
}
</script>

<template>
  <div class="h-full flex flex-col" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="text-gray-400 text-xl">Connecting to room...</div>
      <div class="text-gray-500 text-sm">{{ roomId }}</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="text-red-500 text-xl">{{ error }}</div>
      <div class="text-gray-500 text-sm">Room: {{ roomId }}</div>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        @click="router.push('/')"
      >
        Go Home
      </button>
    </div>

    <!-- Timer display (read-only) -->
    <template v-else>
      <!-- Connection status -->
      <ConnectionStatus v-if="!isFullscreen" />

      <!-- Room ID badge -->
      <div
        v-if="!isFullscreen"
        class="fixed top-4 right-4 text-xs text-gray-400 bg-gray-800/80 px-3 py-1.5 rounded-full z-10"
      >
        Viewing: {{ roomId }}
      </div>

      <!-- Timer Display -->
      <TimerDisplay />

      <!-- Minimal controls for viewer -->
      <div v-if="!isFullscreen" class="px-4 py-6 flex justify-center">
        <button
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors flex items-center gap-2"
          @click="toggleFullscreen"
          title="Fullscreen (F)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Fullscreen
        </button>
      </div>

      <!-- Fullscreen hint -->
      <div
        v-if="isFullscreen"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-sm opacity-0 hover:opacity-100 transition-opacity"
      >
        Press ESC to exit fullscreen
      </div>
    </template>
  </div>
</template>
