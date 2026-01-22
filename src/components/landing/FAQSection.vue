<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const faqs = [
  {
    question: 'What is Chronograph.pro?',
    answer: 'Chronograph.pro is a professional timer application designed for events, conferences, presentations, and training sessions. It allows you to create multiple timers, share them with participants via QR code, and control everything remotely from any device.'
  },
  {
    question: 'How do I share my timer with participants?',
    answer: 'Create a room and add your timers. Click the share button to generate a QR code or copy the link. Participants scan the QR code or open the link to see your timers in real-time. No account is required for viewers — they can join instantly.'
  },
  {
    question: 'Is it really free?',
    answer: 'Yes! The free plan includes 1 room with up to 3 timers, all timer types (countdown, stopwatch, EMOM, Tabata), real-time sync, and unlimited viewers. The Pro plan (coming soon) will offer unlimited rooms and timers, plus custom branding.'
  },
  {
    question: 'What timer types are supported?',
    answer: 'We support Countdown timers, Stopwatch (count up), EMOM (Every Minute on the Minute), Tabata intervals, and custom interval timers. Each can be configured with work/rest periods, custom rounds, and warning alerts at specific time thresholds.'
  },
  {
    question: 'Can I use it on mobile devices?',
    answer: 'Chronograph.pro is fully responsive and works on phones, tablets, and desktops. Use your phone as a remote control while participants view the timer on a TV, projector, or their own devices. It also works as a PWA (Progressive Web App) for a native-like experience.'
  },
  {
    question: 'Do participants need to create an account?',
    answer: 'No. Viewers can watch your timers without any account — they simply scan the QR code or open the link. Only you (the organizer) need an account to create and control timers.'
  },
  {
    question: 'How many people can view my timer simultaneously?',
    answer: 'There is no limit on viewers. Whether you have 10 participants or 1,000, everyone can view your timer in real-time. Our infrastructure scales automatically to handle any audience size.'
  },
  {
    question: 'Does it work offline?',
    answer: 'Yes! Chronograph.pro is a Progressive Web App (PWA) that can be installed on any device. Once installed, basic timer functionality works even without an internet connection. Real-time sync requires connectivity, but local timers run independently.'
  },
  {
    question: 'What are the visual alerts?',
    answer: 'Timers change color based on remaining time: green when time is comfortable, yellow when approaching the warning threshold, and red when time is critical. You can customize these thresholds. Optional sound alerts can notify when the timer reaches zero.'
  },
  {
    question: 'How is this different from other timer apps?',
    answer: 'Most timer apps are single-device tools. Chronograph.pro is built for shared experiences — one person controls, everyone watches. Real-time sync, QR code sharing, and multi-timer rooms make it perfect for professional events where timing coordination is critical.'
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
          <span class="text-white">Frequently Asked</span>
          <span class="text-gray-400"> Questions</span>
        </h2>
        <p class="text-gray-400 text-lg">
          Everything you need to know about Chronograph.pro
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
