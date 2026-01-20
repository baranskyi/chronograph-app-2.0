<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFullscreen } from '@vueuse/core'
import { useTimerStore } from '../stores/timerStore'
import { useAuthStore } from '../stores/authStore'
import { createDefaultTimer } from '../types/timer'
import TimerDisplay from '../components/TimerDisplay.vue'
import TimerControls from '../components/TimerControls.vue'
import SettingsPanel from '../components/SettingsPanel.vue'

const router = useRouter()
const store = useTimerStore()
const authStore = useAuthStore()
const showSettings = ref(false)
const { isFullscreen, toggle: toggleFullscreen, exit: exitFullscreen } = useFullscreen(document.documentElement)

// Initialize a local timer for standalone mode if none exists
if (store.timerList.length === 0) {
  const localTimer = createDefaultTimer('local', 'Timer')
  store.addTimer(localTimer)
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return
  }

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault()
      if (store.isRunning) {
        store.pause()
      } else {
        store.start()
      }
      break
    case 'r':
      store.reset()
      break
    case 'f':
      toggleFullscreen()
      break
    case 'escape':
      if (showSettings.value) {
        showSettings.value = false
      } else if (isFullscreen.value) {
        exitFullscreen()
      }
      break
    case 's':
      if (!isFullscreen.value) {
        showSettings.value = !showSettings.value
      }
      break
  }
}

function startRemoteSession() {
  if (authStore.isAuthenticated) {
    router.push('/my-rooms')
  } else {
    router.push('/login')
  }
}

function goToLogin() {
  router.push('/login')
}

function goToMyRooms() {
  router.push('/my-rooms')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="h-full flex flex-col"
    :class="{ 'fullscreen-mode': isFullscreen }"
  >
    <!-- Timer Display -->
    <TimerDisplay />

    <!-- Controls (hidden in fullscreen) -->
    <TimerControls
      v-if="!isFullscreen"
      @open-settings="showSettings = true"
    >
      <template #extra>
        <!-- Auth buttons -->
        <template v-if="authStore.isAuthenticated">
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            @click="goToMyRooms"
          >
            My Rooms
          </button>
        </template>
        <template v-else>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
            @click="goToLogin"
          >
            Sign In
          </button>
        </template>
        <button
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          @click="startRemoteSession"
          title="Start remote session"
        >
          Remote Control
        </button>
      </template>
    </TimerControls>

    <!-- Settings Modal -->
    <SettingsPanel v-model:open="showSettings" />

    <!-- Fullscreen hint -->
    <div
      v-if="isFullscreen"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 text-gray-600 text-sm opacity-0 hover:opacity-100 transition-opacity"
    >
      Press ESC to exit fullscreen
    </div>
  </div>
</template>
