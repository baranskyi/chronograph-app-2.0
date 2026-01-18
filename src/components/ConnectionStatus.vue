<script setup lang="ts">
import { useRoomStore } from '../stores/roomStore'

const roomStore = useRoomStore()
</script>

<template>
  <div class="fixed top-4 left-4 flex items-center gap-2 text-xs z-10">
    <div
      class="w-2 h-2 rounded-full transition-colors"
      :class="{
        'bg-green-500': roomStore.isConnected,
        'bg-yellow-500 animate-pulse': roomStore.isConnecting,
        'bg-red-500': !roomStore.isConnected && !roomStore.isConnecting
      }"
    ></div>
    <span class="text-gray-500">
      <template v-if="roomStore.isConnecting">Connecting...</template>
      <template v-else-if="roomStore.isConnected">Connected</template>
      <template v-else>Disconnected</template>
    </span>
    <span v-if="roomStore.error" class="text-red-400 ml-2">
      {{ roomStore.error }}
    </span>
  </div>
</template>
