<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import { useAudio } from '../composables/useAudio'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const timerStore = useTimerStore()
const roomStore = useRoomStore()
const audio = useAudio()

const emit = defineEmits<{
  openSettings: []
}>()

const selectedTimer = computed(() => timerStore.selectedTimer)
const colorState = computed(() => {
  if (!timerStore.selectedTimerId) return 'green'
  return timerStore.getColorState(timerStore.selectedTimerId)
})
const formattedTime = computed(() => {
  if (!timerStore.selectedTimerId) return '00:00'
  return timerStore.getFormattedTime(timerStore.selectedTimerId)
})

// Progress percentage (0-100)
const progress = computed(() => {
  const timer = selectedTimer.value
  if (!timer || timer.settings.mode === 'clock') return 100
  if (timer.settings.mode === 'countup') {
    // No max for countup, just return 100
    return 100
  }
  // Countdown
  const total = timer.settings.duration
  const remaining = Math.max(0, timer.remainingSeconds)
  return (remaining / total) * 100
})

// Timer actions
function handlePlayPause() {
  const timerId = timerStore.selectedTimerId
  if (!timerId) return

  if (timerStore.isRunning) {
    timerStore.pauseTimer(timerId)
  } else {
    timerStore.startTimer(timerId)
  }
  broadcastState()
}

function handleReset() {
  const timerId = timerStore.selectedTimerId
  if (!timerId) return

  timerStore.resetTimer(timerId)
  broadcastState()
}

function handleAdjustTime(seconds: number) {
  const timerId = timerStore.selectedTimerId
  if (!timerId) return

  timerStore.adjustTime(timerId, seconds)
  broadcastState()
}

function broadcastState() {
  const timerId = timerStore.selectedTimerId
  if (timerId) {
    roomStore.broadcastTimerState(timerId)
  }
}

// Play sound when timer reaches zero
watch(
  () => selectedTimer.value?.remainingSeconds,
  (newVal, oldVal) => {
    const timer = selectedTimer.value
    if (
      timer?.settings.soundEnabled &&
      timer?.settings.mode === 'countdown' &&
      oldVal === 1 &&
      newVal === 0
    ) {
      audio.playEnd()
    }
  }
)

// Broadcast state changes
watch(
  () => selectedTimer.value,
  () => {
    broadcastState()
  },
  { deep: true }
)
</script>

<template>
  <div class="timer-preview h-full flex flex-col bg-card/50 rounded-xl p-4">
    <!-- No timer selected -->
    <div v-if="!selectedTimer" class="flex-1 flex items-center justify-center">
      <div class="text-muted-foreground text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Select a timer</p>
      </div>
    </div>

    <template v-else>
      <!-- Timer name -->
      <div class="text-center mb-2">
        <div class="text-sm text-muted-foreground uppercase tracking-wide">Preview</div>
        <div class="text-lg font-medium text-foreground truncate">{{ selectedTimer.name }}</div>
        <div
          v-if="selectedTimer.isOnAir"
          class="inline-block px-2 py-0.5 mt-1 text-xs font-medium bg-destructive text-white rounded"
        >
          ON AIR
        </div>
      </div>

      <!-- Timer display -->
      <div class="flex-1 flex items-center justify-center">
        <div
          class="timer-font text-center select-none transition-colors duration-300"
          :class="`timer-${colorState}`"
        >
          <span class="text-5xl md:text-6xl font-bold leading-none">
            {{ formattedTime }}
          </span>
        </div>
      </div>

      <!-- Progress bar -->
      <Progress
        :model-value="progress"
        class="h-1 mb-4"
        :class="{
          '[&>div]:bg-green-500': colorState === 'green',
          '[&>div]:bg-yellow-500': colorState === 'yellow',
          '[&>div]:bg-red-500': colorState === 'red',
        }"
      />

      <!-- Controls -->
      <div class="flex items-center justify-center gap-3">
        <!-- Reset -->
        <Button
          variant="outline"
          size="icon"
          @click="handleReset"
          title="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
        </Button>

        <!-- -1 min -->
        <Button
          variant="outline"
          size="icon"
          @click="handleAdjustTime(-60)"
          title="-1 minute"
        >
          <span class="text-sm font-medium">-1m</span>
        </Button>

        <!-- Play/Pause -->
        <Button
          :variant="timerStore.isRunning ? 'destructive' : 'default'"
          size="icon-lg"
          class="rounded-full"
          @click="handlePlayPause"
          title="Play/Pause"
        >
          <svg v-if="!timerStore.isRunning" xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </Button>

        <!-- +1 min -->
        <Button
          variant="outline"
          size="icon"
          @click="handleAdjustTime(60)"
          title="+1 minute"
        >
          <span class="text-sm font-medium">+1m</span>
        </Button>

        <!-- Settings -->
        <Button
          variant="outline"
          size="icon"
          @click="emit('openSettings')"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
        </Button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.timer-green {
  color: var(--color-green);
  text-shadow: 0 0 30px rgba(34, 197, 94, 0.4);
}
.timer-yellow {
  color: var(--color-yellow);
  text-shadow: 0 0 30px rgba(234, 179, 8, 0.4);
}
.timer-red {
  color: var(--color-red);
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
  animation: pulse-red 1s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
