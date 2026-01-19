<script setup lang="ts">
import { useTimerStore } from '../stores/timerStore'
import { useFullscreen } from '@vueuse/core'
import { Button } from '@/components/ui/button'

const store = useTimerStore()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(document.documentElement)

const emit = defineEmits<{
  openSettings: []
}>()

function handlePlayPause() {
  if (store.isRunning) {
    store.pause()
  } else {
    store.start()
  }
}
</script>

<template>
  <div class="timer-controls px-4 py-6">
    <div class="flex items-center justify-center gap-3">
      <!-- Reset button -->
      <Button
        variant="outline"
        size="icon"
        @click="store.reset()"
        title="Reset (R)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </Button>

      <!-- -1 minute button -->
      <Button
        variant="outline"
        size="icon"
        @click="store.selectedTimerId && store.adjustTime(store.selectedTimerId, -60)"
        title="Subtract 1 minute"
      >
        <span class="text-sm font-medium">-1m</span>
      </Button>

      <!-- Play/Pause button -->
      <Button
        :variant="store.isRunning ? 'destructive' : 'default'"
        size="icon-lg"
        class="rounded-full"
        @click="handlePlayPause"
        title="Play/Pause (Space)"
      >
        <!-- Play icon -->
        <svg v-if="!store.isRunning" xmlns="http://www.w3.org/2000/svg" class="size-8" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        <!-- Pause icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-8" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </Button>

      <!-- +1 minute button -->
      <Button
        variant="outline"
        size="icon"
        @click="store.selectedTimerId && store.adjustTime(store.selectedTimerId, 60)"
        title="Add 1 minute"
      >
        <span class="text-sm font-medium">+1m</span>
      </Button>

      <!-- Fullscreen button -->
      <Button
        variant="outline"
        size="icon"
        @click="toggleFullscreen"
        title="Fullscreen (F)"
      >
        <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
      </Button>
    </div>

    <!-- Settings link and extra slot -->
    <div class="mt-4 flex items-center justify-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        class="text-muted-foreground"
        @click="emit('openSettings')"
      >
        Settings
      </Button>
      <slot name="extra"></slot>
    </div>
  </div>
</template>
