<script setup lang="ts">
import type { SpeakerMessage } from '../stores/roomStore'

defineProps<{
  message: SpeakerMessage
}>()
</script>

<template>
  <Transition name="message">
    <div
      v-if="message"
      class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div
        :class="[
          'px-12 py-8 rounded-2xl shadow-2xl max-w-[80vw] text-center',
          'backdrop-blur-md',
          message.priority === 'urgent'
            ? 'bg-red-600/90 text-white'
            : 'bg-zinc-900/90 text-white'
        ]"
      >
        <p class="text-4xl md:text-6xl font-bold leading-tight">
          {{ message.text }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.message-enter-active {
  animation: messageIn 0.3s ease-out;
}

.message-leave-active {
  animation: messageOut 0.3s ease-in;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes messageOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>
