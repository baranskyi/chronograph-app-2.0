<script setup lang="ts">
import { ref } from 'vue'
import { useTimerStore } from '../stores/timerStore'
import type { TimerMode } from '../types/timer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const store = useTimerStore()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// Local state for form inputs
const durationMinutes = ref(Math.floor(store.settings.duration / 60))
const durationSeconds = ref(store.settings.duration % 60)
const yellowMinutes = ref(Math.floor(store.settings.yellowThreshold / 60))
const yellowSeconds = ref(store.settings.yellowThreshold % 60)
const redMinutes = ref(Math.floor(store.settings.redThreshold / 60))
const redSeconds = ref(store.settings.redThreshold % 60)

// Preset durations
const presets = [
  { label: '1', seconds: 60 },
  { label: '3', seconds: 180 },
  { label: '5', seconds: 300 },
  { label: '10', seconds: 600 },
  { label: '15', seconds: 900 },
  { label: '20', seconds: 1200 },
  { label: '30', seconds: 1800 },
  { label: '45', seconds: 2700 },
]

const isPresetActive = (seconds: number) => {
  return store.settings.duration === seconds
}

function applyPreset(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  durationMinutes.value = minutes
  durationSeconds.value = seconds % 60
  // Set reasonable defaults for thresholds
  yellowMinutes.value = Math.max(1, Math.floor(minutes * 0.2))
  yellowSeconds.value = 0
  redMinutes.value = Math.max(0, Math.floor(minutes * 0.1))
  redSeconds.value = 30
  saveSettings()
}

function saveSettings() {
  const timerId = store.selectedTimerId
  if (!timerId) return

  const duration = durationMinutes.value * 60 + durationSeconds.value
  const yellowThreshold = yellowMinutes.value * 60 + yellowSeconds.value
  const redThreshold = redMinutes.value * 60 + redSeconds.value

  store.updateSettings(timerId, {
    duration,
    yellowThreshold,
    redThreshold,
  })
  store.setDuration(timerId, duration)
}

function handleModeChange(mode: string | number) {
  const timerId = store.selectedTimerId
  if (!timerId) return
  store.setMode(timerId, String(mode) as TimerMode)
}

function incrementMinutes(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') durationMinutes.value = Math.min(999, durationMinutes.value + 1)
  else if (type === 'yellow') yellowMinutes.value = Math.min(999, yellowMinutes.value + 1)
  else redMinutes.value = Math.min(999, redMinutes.value + 1)
  saveSettings()
}

function decrementMinutes(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') durationMinutes.value = Math.max(0, durationMinutes.value - 1)
  else if (type === 'yellow') yellowMinutes.value = Math.max(0, yellowMinutes.value - 1)
  else redMinutes.value = Math.max(0, redMinutes.value - 1)
  saveSettings()
}

function incrementSeconds(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') {
    if (durationSeconds.value >= 59) {
      durationSeconds.value = 0
      durationMinutes.value++
    } else {
      durationSeconds.value++
    }
  } else if (type === 'yellow') {
    if (yellowSeconds.value >= 59) {
      yellowSeconds.value = 0
      yellowMinutes.value++
    } else {
      yellowSeconds.value++
    }
  } else {
    if (redSeconds.value >= 59) {
      redSeconds.value = 0
      redMinutes.value++
    } else {
      redSeconds.value++
    }
  }
  saveSettings()
}

function decrementSeconds(type: 'duration' | 'yellow' | 'red') {
  if (type === 'duration') {
    if (durationSeconds.value <= 0 && durationMinutes.value > 0) {
      durationSeconds.value = 59
      durationMinutes.value--
    } else {
      durationSeconds.value = Math.max(0, durationSeconds.value - 1)
    }
  } else if (type === 'yellow') {
    if (yellowSeconds.value <= 0 && yellowMinutes.value > 0) {
      yellowSeconds.value = 59
      yellowMinutes.value--
    } else {
      yellowSeconds.value = Math.max(0, yellowSeconds.value - 1)
    }
  } else {
    if (redSeconds.value <= 0 && redMinutes.value > 0) {
      redSeconds.value = 59
      redMinutes.value--
    } else {
      redSeconds.value = Math.max(0, redSeconds.value - 1)
    }
  }
  saveSettings()
}

function handleSoundToggle(checked: boolean) {
  if (store.selectedTimerId) {
    store.updateSettings(store.selectedTimerId, { soundEnabled: checked })
  }
}

function handleOvertimeToggle(checked: boolean) {
  if (store.selectedTimerId) {
    store.updateSettings(store.selectedTimerId, { overtimeEnabled: checked })
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg max-h-[90vh] overflow-hidden bg-card border-border">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>

      <div class="overflow-y-auto max-h-[calc(90vh-100px)] space-y-6 pr-2">
        <!-- Timer Mode -->
        <div>
          <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Mode</label>
          <Tabs :default-value="store.settings.mode" @update:model-value="handleModeChange">
            <TabsList class="w-full">
              <TabsTrigger value="countdown" class="flex-1">Countdown</TabsTrigger>
              <TabsTrigger value="countup" class="flex-1">Count Up</TabsTrigger>
              <TabsTrigger value="clock" class="flex-1">Clock</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <!-- Duration Presets -->
        <div v-if="store.settings.mode === 'countdown'">
          <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Set (minutes)</label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="preset in presets"
              :key="preset.seconds"
              :variant="isPresetActive(preset.seconds) ? 'default' : 'secondary'"
              size="icon"
              class="w-12 h-12"
              @click="applyPreset(preset.seconds)"
            >
              {{ preset.label }}
            </Button>
          </div>
        </div>

        <!-- Custom Duration -->
        <div v-if="store.settings.mode === 'countdown'">
          <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Duration</label>
          <div class="bg-secondary rounded-xl p-4">
            <div class="flex items-center justify-center gap-4">
              <!-- Minutes -->
              <div class="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="incrementMinutes('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </Button>
                <div class="text-4xl font-mono font-bold text-foreground my-1 w-16 text-center">
                  {{ durationMinutes.toString().padStart(2, '0') }}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="decrementMinutes('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <span class="text-xs text-muted-foreground mt-1">min</span>
              </div>

              <span class="text-3xl font-bold text-muted-foreground">:</span>

              <!-- Seconds -->
              <div class="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="incrementSeconds('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </Button>
                <div class="text-4xl font-mono font-bold text-foreground my-1 w-16 text-center">
                  {{ durationSeconds.toString().padStart(2, '0') }}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  @click="decrementSeconds('duration')"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <span class="text-xs text-muted-foreground mt-1">sec</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Warning Thresholds -->
        <div v-if="store.settings.mode === 'countdown'">
          <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Warning Thresholds</label>
          <div class="space-y-3">
            <!-- Yellow Warning -->
            <div class="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span class="text-sm text-foreground">Yellow warning</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-background rounded-lg">
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="decrementMinutes('yellow')">−</Button>
                  <span class="w-8 text-center font-mono text-foreground">{{ yellowMinutes }}</span>
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="incrementMinutes('yellow')">+</Button>
                </div>
                <span class="text-xs text-muted-foreground">:</span>
                <div class="flex items-center bg-background rounded-lg">
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="decrementSeconds('yellow')">−</Button>
                  <span class="w-8 text-center font-mono text-foreground">{{ yellowSeconds.toString().padStart(2, '0') }}</span>
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="incrementSeconds('yellow')">+</Button>
                </div>
              </div>
            </div>

            <!-- Red Warning -->
            <div class="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                <span class="text-sm text-foreground">Red warning</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-background rounded-lg">
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="decrementMinutes('red')">−</Button>
                  <span class="w-8 text-center font-mono text-foreground">{{ redMinutes }}</span>
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="incrementMinutes('red')">+</Button>
                </div>
                <span class="text-xs text-muted-foreground">:</span>
                <div class="flex items-center bg-background rounded-lg">
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="decrementSeconds('red')">−</Button>
                  <span class="w-8 text-center font-mono text-foreground">{{ redSeconds.toString().padStart(2, '0') }}</span>
                  <Button variant="ghost" size="icon-sm" class="h-8 w-8" @click="incrementSeconds('red')">+</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div>
          <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Options</label>
          <div class="space-y-2">
            <!-- Sound Toggle -->
            <div class="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <span class="text-sm text-foreground">Play sound when timer ends</span>
              </div>
              <Switch
                :checked="store.settings.soundEnabled"
                @update:checked="handleSoundToggle"
              />
            </div>

            <!-- Overtime Toggle -->
            <div
              v-if="store.settings.mode === 'countdown'"
              class="bg-secondary rounded-xl p-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <svg class="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span class="text-sm text-foreground">Continue after zero (overtime)</span>
              </div>
              <Switch
                :checked="store.settings.overtimeEnabled"
                @update:checked="handleOvertimeToggle"
              />
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="pt-4 border-t border-border">
          <label class="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Shortcuts</label>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex items-center gap-2 text-muted-foreground">
              <kbd class="px-2 py-1 bg-secondary rounded text-xs font-mono text-foreground">Space</kbd>
              <span>Play/Pause</span>
            </div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <kbd class="px-2 py-1 bg-secondary rounded text-xs font-mono text-foreground">R</kbd>
              <span>Reset</span>
            </div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <kbd class="px-2 py-1 bg-secondary rounded text-xs font-mono text-foreground">F</kbd>
              <span>Fullscreen</span>
            </div>
            <div class="flex items-center gap-2 text-muted-foreground">
              <kbd class="px-2 py-1 bg-secondary rounded text-xs font-mono text-foreground">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
