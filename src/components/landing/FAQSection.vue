<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const faqs = [
  {
    question: 'What is Chronograph.Pro?',
    answer: 'Chronograph.Pro is a professional timer application for coaches, trainers, and fitness professionals. Create multiple timers, share them with clients via QR code, and control everything remotely from any device.'
  },
  {
    question: 'How do I share my timer with clients?',
    answer: 'Create a room and add your timers. Click the share button to get a QR code or link. Clients scan the QR code or open the link to see your timers in real-time. No account required for viewers.'
  },
  {
    question: 'Is it really free?',
    answer: 'Yes! The free plan includes 1 room with up to 3 timers. All core features including real-time sync and QR sharing are included. The Pro plan (coming soon) will offer unlimited rooms and timers.'
  },
  {
    question: 'What timer types are supported?',
    answer: 'We support Countdown timers, Stopwatch (count up), EMOM (Every Minute on the Minute), Tabata intervals, and custom interval timers. Each can be configured with work/rest periods and rounds.'
  },
  {
    question: 'Can I use it on mobile?',
    answer: 'Absolutely! Chronograph.Pro works on phones, tablets, and desktops. Use your phone as a remote control while clients view on a TV or projector.'
  },
  {
    question: 'Do clients need to create an account?',
    answer: 'No. Viewers can watch your timers without any account. Only you (the coach) need an account to create and control timers.'
  }
]

const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <section id="faq" class="relative py-24 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">Frequently asked</span>
          <span class="text-gray-400"> questions</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Everything you need to know.
        </p>
      </div>

      <!-- FAQ Items -->
      <div class="space-y-3">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="group"
        >
          <button
            class="w-full p-6 flex items-center justify-between text-left rounded-2xl transition-all duration-300 cursor-pointer"
            :class="openIndex === index
              ? 'bg-white/[0.05] border border-white/10'
              : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/5'"
            @click="toggle(index)"
          >
            <span class="font-medium text-white pr-4">{{ faq.question }}</span>
            <ChevronDown
              class="w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0"
              :class="{ 'rotate-180 text-blue-400': openIndex === index }"
            />
          </button>

          <!-- Answer panel -->
          <div
            class="overflow-hidden transition-all duration-300"
            :class="openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="px-6 pb-6 pt-2">
              <p class="text-gray-400 leading-relaxed">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
