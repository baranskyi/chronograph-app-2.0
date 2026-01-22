<script setup lang="ts">
import { Star, Quote } from 'lucide-vue-next'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Event Coordinator',
    company: 'TechConf Global',
    image: 'SM',
    rating: 5,
    text: 'Chronograph.pro transformed how we manage speaker sessions. The real-time sync means our backstage team always knows exactly where we are in the schedule. Absolutely essential for our conferences.'
  },
  {
    name: 'Marcus Chen',
    role: 'Head Pastor',
    company: 'Grace Community Church',
    image: 'MC',
    rating: 5,
    text: 'We use it every Sunday for sermon timing. The fullscreen display is perfect for our speaker monitor, and the visual color alerts help our worship team know when to prepare for transitions.'
  },
  {
    name: 'Elena Rodriguez',
    role: 'CrossFit Coach',
    company: 'Forge Fitness',
    image: 'ER',
    rating: 5,
    text: 'Finally, a timer app that understands fitness! The EMOM and Tabata presets are perfect. My clients can see the timer on the gym TV while I control it from my phone across the room.'
  },
  {
    name: 'David Park',
    role: 'Corporate Trainer',
    company: 'LeaderUp Consulting',
    image: 'DP',
    rating: 5,
    text: 'I run workshops in different cities every week. Chronograph.pro works on any device, so I never worry about compatibility. The QR code sharing gets participants set up in seconds.'
  },
  {
    name: 'Amanda Foster',
    role: 'Production Manager',
    company: 'Stellar Productions',
    image: 'AF',
    rating: 5,
    text: 'We needed something reliable for live shows. The overtime feature and sound alerts are game-changers. No more awkward speaker overruns — everyone knows when time is up.'
  },
  {
    name: 'James Wilson',
    role: 'Studio Owner',
    company: 'Mindful Movement Yoga',
    image: 'JW',
    rating: 5,
    text: 'Clean, minimal design that fits perfectly in our studio aesthetic. The timer display looks beautiful on our wall-mounted screen, and clients love being able to follow along on their phones.'
  }
]
</script>

<template>
  <section id="testimonials" class="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

    <div class="relative max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">Trusted by</span>
          <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Professionals</span>
        </h2>
        <p class="text-gray-400 text-lg">
          See why coaches, event organizers, and trainers love Chronograph.pro
        </p>
      </div>

      <!-- Testimonials Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="testimonial in testimonials"
          :key="testimonial.name"
          class="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
        >
          <!-- Quote icon -->
          <Quote class="w-8 h-8 text-white/10 mb-4" />

          <!-- Rating -->
          <div class="flex gap-1 mb-4">
            <Star
              v-for="i in testimonial.rating"
              :key="i"
              class="w-4 h-4 text-yellow-400 fill-yellow-400"
            />
          </div>

          <!-- Text -->
          <p class="text-gray-400 text-sm leading-relaxed mb-6">
            "{{ testimonial.text }}"
          </p>

          <!-- Author -->
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {{ testimonial.image }}
            </div>
            <div>
              <p class="text-white font-medium text-sm">{{ testimonial.name }}</p>
              <p class="text-gray-500 text-xs">{{ testimonial.role }}, {{ testimonial.company }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
