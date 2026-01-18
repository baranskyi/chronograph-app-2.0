<script setup lang="ts">
import { ref, computed } from 'vue'
import QRCodeVue3 from 'qrcode.vue'
import { useRoomStore } from '../stores/roomStore'

const roomStore = useRoomStore()
const copied = ref(false)

const emit = defineEmits<{
  close: []
}>()

const viewerUrl = computed(() => roomStore.shareUrl)

async function copyLink() {
  if (!viewerUrl.value) return
  try {
    await navigator.clipboard.writeText(viewerUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    @click.self="emit('close')"
  >
    <div class="bg-[#1a1a24] rounded-lg p-6 w-full max-w-md mx-4 border border-gray-800">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-white">Share Timer</h2>
        <button
          class="text-gray-400 hover:text-white transition-colors"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Room ID -->
      <div class="text-center mb-6">
        <div class="text-sm text-gray-400 mb-1">Room Code</div>
        <div class="text-3xl font-mono font-bold tracking-wider text-white">
          {{ roomStore.roomId }}
        </div>
      </div>

      <!-- QR Code -->
      <div class="flex justify-center mb-6">
        <div class="bg-white p-4 rounded-lg">
          <QRCodeVue3
            v-if="viewerUrl"
            :value="viewerUrl"
            :size="180"
            level="M"
          />
        </div>
      </div>

      <!-- Link -->
      <div class="mb-4">
        <div class="text-sm text-gray-400 mb-2">Viewer Link</div>
        <div class="flex gap-2">
          <input
            type="text"
            :value="viewerUrl"
            readonly
            class="flex-1 bg-[#0a0a0f] border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
          />
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm font-medium"
            @click="copyLink"
          >
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>

      <p class="text-sm text-gray-500 text-center">
        Share this link with viewers. They will see the timer in real-time.
      </p>
    </div>
  </div>
</template>
