<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTimerStore } from '../stores/timerStore'
import { useRoomStore } from '../stores/roomStore'
import type { Timer } from '../types/timer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  timer: Timer
  index: number
}>()

const emit = defineEmits<{
  select: [timerId: string]
  openSettings: [timerId: string]
}>()

const timerStore = useTimerStore()
const roomStore = useRoomStore()

const isSelected = computed(() => timerStore.selectedTimerId === props.timer.id)
const colorState = computed(() => timerStore.getColorState(props.timer.id))
const formattedTime = computed(() => timerStore.getFormattedTime(props.timer.id))

const isEditing = ref(false)
const editName = ref('')

function startEditing() {
  editName.value = props.timer.name
  isEditing.value = true
}

function saveEdit() {
  if (editName.value.trim() && editName.value !== props.timer.name) {
    roomStore.renameTimer(props.timer.id, editName.value.trim())
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function handlePlayPause() {
  if (props.timer.status === 'running') {
    timerStore.pauseTimer(props.timer.id)
  } else {
    timerStore.startTimer(props.timer.id)
  }
  broadcastState()
}

function handleReset() {
  timerStore.resetTimer(props.timer.id)
  broadcastState()
}

function handleAddTime() {
  timerStore.adjustTime(props.timer.id, 60)
  broadcastState()
}

function handleSetOnAir() {
  roomStore.setTimerOnAir(props.timer.id)
}

function broadcastState() {
  roomStore.broadcastTimerState(props.timer.id)
}
</script>

<template>
  <div
    class="timer-card group relative flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer"
    :class="[
      isSelected
        ? 'bg-secondary ring-1 ring-primary/50'
        : 'bg-secondary/50 hover:bg-secondary',
      timer.isOnAir && 'ring-1 ring-destructive/50'
    ]"
    @click="emit('select', timer.id)"
  >
    <!-- Timer number -->
    <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-muted text-sm font-medium text-muted-foreground">
      {{ index + 1 }}
    </div>

    <!-- Add time button -->
    <Button
      variant="secondary"
      size="icon-sm"
      @click.stop="handleAddTime"
      title="Add 1 minute"
    >
      <span class="text-xs font-medium">+1m</span>
    </Button>

    <!-- Timer display -->
    <div
      class="flex-shrink-0 w-20 text-lg font-mono font-semibold tabular-nums"
      :class="`timer-${colorState}`"
    >
      {{ formattedTime }}
    </div>

    <!-- Timer name (editable) -->
    <div class="flex-1 min-w-0">
      <Input
        v-if="isEditing"
        v-model="editName"
        class="h-8 text-sm"
        @keydown.enter="saveEdit"
        @keydown.escape="cancelEdit"
        @blur="saveEdit"
        @click.stop
        autofocus
      />
      <div
        v-else
        class="text-sm text-foreground/80 truncate group-hover:text-foreground transition-colors"
        @dblclick.stop="startEditing"
      >
        {{ timer.name }}
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
      <!-- Reset -->
      <Button
        variant="ghost"
        size="icon-sm"
        class="h-7 w-7"
        @click.stop="handleReset"
        title="Reset"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </Button>

      <!-- Settings -->
      <Button
        variant="ghost"
        size="icon-sm"
        class="h-7 w-7"
        @click.stop="emit('openSettings', timer.id)"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      </Button>

      <!-- Play/Pause -->
      <Button
        :variant="timer.status === 'running' ? 'destructive' : 'default'"
        size="icon-sm"
        class="h-8 w-8"
        @click.stop="handlePlayPause"
        :title="timer.status === 'running' ? 'Pause' : 'Play'"
      >
        <!-- Play icon -->
        <svg v-if="timer.status !== 'running'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        <!-- Pause icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </Button>
    </div>

    <!-- On Air indicator/button -->
    <Button
      :variant="timer.isOnAir ? 'destructive' : 'secondary'"
      size="sm"
      class="flex-shrink-0 h-7 px-2 text-xs"
      @click.stop="handleSetOnAir"
      :title="timer.isOnAir ? 'Currently On Air' : 'Set as On Air'"
    >
      {{ timer.isOnAir ? 'ON AIR' : 'Set Air' }}
    </Button>
  </div>
</template>

<style scoped>
.timer-green {
  color: var(--color-green);
}
.timer-yellow {
  color: var(--color-yellow);
}
.timer-red {
  color: var(--color-red);
}
</style>
