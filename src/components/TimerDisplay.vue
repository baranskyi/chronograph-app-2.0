<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useTimerStore } from '../stores/timerStore'
import { useAudio } from '../composables/useAudio'

const store = useTimerStore()
const audio = useAudio()

const colorClass = computed(() => {
  if (store.settings.mode === 'clock') return 'timer-green'
  return `timer-${store.colorState}`
})

// Play sound when timer reaches zero
watch(() => store.remainingSeconds, (newVal, oldVal) => {
  if (store.settings.soundEnabled && store.settings.mode === 'countdown') {
    if (oldVal === 1 && newVal === 0) {
      audio.playEnd()
    }
  }
})

// Resume audio context on first interaction
onMounted(() => {
  const resumeAudio = () => {
    audio.resumeContext()
    document.removeEventListener('click', resumeAudio)
    document.removeEventListener('keydown', resumeAudio)
  }
  document.addEventListener('click', resumeAudio)
  document.addEventListener('keydown', resumeAudio)
})
</script>

<template>
  <div class="timer-display flex flex-1 items-center justify-center">
    <div
      class="timer-font text-center select-none transition-colors duration-300"
      :class="colorClass"
    >
      <span class="text-[20vw] font-bold leading-none md:text-[25vw]">
        {{ store.formattedTime }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.timer-display {
  min-height: 200px;
}
</style>
