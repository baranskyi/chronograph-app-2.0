<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const faqs = [
  {
    question: 'What is Chronograph.Pro?',
    answer: 'Chronograph.Pro is a professional timer application designed for coaches, trainers, and fitness professionals. It allows you to create multiple timers, share them with clients via QR code, and control them remotely from any device.'
  },
  {
    question: 'How do I share my timer with clients?',
    answer: 'Simply create a room and add your timers. Then click the share button to get a QR code or link. Clients can scan the QR code or open the link to see your timers in real-time — no account required for viewers.'
  },
  {
    question: 'Is it really free?',
    answer: 'Yes! The free plan includes 1 room with up to 3 timers, which is enough for most individual coaches. All core features including real-time sync and QR sharing are included. The Pro plan (coming soon) will offer unlimited rooms and timers.'
  },
  {
    question: 'What timer types are supported?',
    answer: 'We support Countdown timers, Stopwatch (count up), EMOM (Every Minute on the Minute), Tabata intervals, and custom interval timers. Each timer can be configured with work/rest periods, rounds, and more.'
  },
  {
    question: 'Can I use it on mobile?',
    answer: 'Absolutely! Chronograph.Pro is fully responsive and works great on phones, tablets, and desktop computers. Use your phone as a remote control while clients view on a TV or projector.'
  },
  {
    question: 'Do clients need to create an account?',
    answer: 'No. Viewers can watch your timers without any account or login. Only you (the coach) need an account to create and control timers.'
  }
]

const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <section id="faq" class="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
    <div class="max-w-3xl mx-auto">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold mb-4">
          Frequently asked questions
        </h2>
        <p class="text-muted-foreground text-lg">
          Everything you need to know about Chronograph.Pro.
        </p>
      </div>

      <!-- FAQ Items -->
      <div class="space-y-4">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="border border-border rounded-lg overflow-hidden"
        >
          <button
            class="w-full px-6 py-4 flex items-center justify-between text-left bg-card/50 hover:bg-card transition-colors"
            @click="toggle(index)"
          >
            <span class="font-medium">{{ faq.question }}</span>
            <ChevronDown
              class="w-5 h-5 text-muted-foreground transition-transform"
              :class="{ 'rotate-180': openIndex === index }"
            />
          </button>
          <div
            v-show="openIndex === index"
            class="px-6 py-4 bg-background border-t border-border"
          >
            <p class="text-muted-foreground">{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
