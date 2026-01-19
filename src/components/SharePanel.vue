<script setup lang="ts">
import { ref, computed } from 'vue'
import QRCodeVue3 from 'qrcode.vue'
import { useRoomStore } from '../stores/roomStore'
import { useTimerStore } from '../stores/timerStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const roomStore = useRoomStore()
const timerStore = useTimerStore()
const copied = ref<string | null>(null)
const selectedQRTimer = ref<string | null>(null) // null = active timer link

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const viewerUrl = computed(() => roomStore.shareUrl)

const currentQRUrl = computed(() => {
  if (selectedQRTimer.value) {
    return roomStore.getTimerShareUrl(selectedQRTimer.value)
  }
  return viewerUrl.value
})

async function copyLink(url: string, id: string) {
  try {
    await navigator.clipboard.writeText(url)
    copied.value = id
    setTimeout(() => {
      copied.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

function selectQRTimer(timerId: string | null) {
  selectedQRTimer.value = timerId
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg max-h-[90vh] overflow-hidden bg-card border-border">
      <DialogHeader>
        <DialogTitle>Share Timer</DialogTitle>
      </DialogHeader>

      <div class="overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
        <!-- Room ID -->
        <div class="text-center">
          <div class="text-sm text-muted-foreground mb-1">Room Code</div>
          <div class="text-3xl font-mono font-bold tracking-wider text-foreground">
            {{ roomStore.roomId }}
          </div>
        </div>

        <!-- QR Code -->
        <div class="flex justify-center">
          <div class="bg-white p-4 rounded-lg">
            <QRCodeVue3
              v-if="currentQRUrl"
              :value="currentQRUrl"
              :size="180"
              level="M"
            />
          </div>
        </div>

        <!-- QR Timer selector -->
        <div v-if="timerStore.timerList.length > 1" class="flex justify-center gap-2">
          <Button
            :variant="selectedQRTimer === null ? 'default' : 'secondary'"
            size="sm"
            @click="selectQRTimer(null)"
          >
            Active Timer
          </Button>
          <Button
            v-for="timer in timerStore.timerList"
            :key="timer.id"
            :variant="selectedQRTimer === timer.id ? 'default' : 'secondary'"
            size="sm"
            @click="selectQRTimer(timer.id)"
          >
            {{ timer.name }}
          </Button>
        </div>

        <!-- Active Timer Link -->
        <div>
          <div class="text-sm text-muted-foreground mb-2">Active Timer Link (follows On Air)</div>
          <div class="flex gap-2">
            <Input
              :model-value="viewerUrl || ''"
              readonly
              class="flex-1"
            />
            <Button
              @click="viewerUrl && copyLink(viewerUrl, 'active')"
            >
              {{ copied === 'active' ? 'Copied!' : 'Copy' }}
            </Button>
          </div>
        </div>

        <!-- Individual Timer Links -->
        <div v-if="timerStore.timerList.length > 1">
          <div class="text-sm text-muted-foreground mb-2">Individual Timer Links</div>
          <div class="space-y-2">
            <div
              v-for="timer in timerStore.timerList"
              :key="timer.id"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-muted-foreground w-20 truncate" :title="timer.name">{{ timer.name }}</span>
              <Input
                :model-value="roomStore.getTimerShareUrl(timer.id) || ''"
                readonly
                class="flex-1 h-8 text-xs"
              />
              <Button
                variant="secondary"
                size="sm"
                @click="roomStore.getTimerShareUrl(timer.id) && copyLink(roomStore.getTimerShareUrl(timer.id)!, timer.id)"
              >
                {{ copied === timer.id ? 'Copied!' : 'Copy' }}
              </Button>
            </div>
          </div>
        </div>

        <p class="text-sm text-muted-foreground text-center">
          Share these links with viewers. They will see the timer in real-time.
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
