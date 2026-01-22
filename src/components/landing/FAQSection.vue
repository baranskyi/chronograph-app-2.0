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
  <section id="faq" class="relative" style="padding: 100px 24px;">
    <div class="w-full max-w-[800px] mx-auto">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">Frequently Asked</span>
          <span class="text-red-500"> Questions</span>
        </h2>
        <p class="section-subtitle">
          Everything you need to know about Chronograph.pro
        </p>
      </div>

      <!-- FAQ Items -->
      <div class="faq-list">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="faq-item"
        >
          <button
            class="faq-question"
            :class="{ 'faq-question-open': openIndex === index }"
            @click="toggle(index)"
          >
            <span class="question-text">{{ faq.question }}</span>
            <ChevronDown
              class="chevron"
              :class="{ 'chevron-open': openIndex === index }"
            />
          </button>

          <!-- Answer panel -->
          <div
            class="faq-answer"
            :class="{ 'faq-answer-open': openIndex === index }"
          >
            <div class="answer-content">
              <p class="answer-text">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 18px;
  color: #6b7280;
  max-width: 500px;
  margin: 0 auto;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  border-radius: 16px;
  overflow: hidden;
}

.faq-question {
  width: 100%;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.faq-question:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.faq-question-open {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
  border-radius: 16px 16px 0 0;
}

.faq-question-open:hover {
  border-color: rgba(239, 68, 68, 0.3);
}

.question-text {
  font-weight: 500;
  color: #ffffff;
  padding-right: 16px;
  font-size: 15px;
}

.chevron {
  width: 20px;
  height: 20px;
  color: #6b7280;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.chevron-open {
  transform: rotate(180deg);
  color: #ef4444;
}

.faq-answer {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-answer-open {
  max-height: 500px;
  opacity: 1;
}

.answer-content {
  padding: 0 24px 24px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-top: none;
  border-radius: 0 0 16px 16px;
}

.answer-text {
  color: #9ca3af;
  line-height: 1.7;
  font-size: 14px;
  padding-top: 16px;
}
</style>
