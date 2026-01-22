<script setup lang="ts">
import { Star } from 'lucide-vue-next'

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Event Coordinator',
    company: 'TechConf Global',
    initials: 'SM',
    text: 'Chronograph.pro transformed how we manage speaker sessions. The real-time sync means our backstage team always knows exactly where we are.'
  },
  {
    name: 'Marcus Chen',
    role: 'Head Pastor',
    company: 'Grace Community',
    initials: 'MC',
    text: 'We use it every Sunday for sermon timing. The visual color alerts help our worship team know when to prepare for transitions.'
  },
  {
    name: 'Elena Rodriguez',
    role: 'CrossFit Coach',
    company: 'Forge Fitness',
    initials: 'ER',
    text: 'Finally, a timer app that understands fitness! The EMOM and Tabata presets are perfect. My clients love the big display.'
  },
  {
    name: 'David Park',
    role: 'Corporate Trainer',
    company: 'LeaderUp Consulting',
    initials: 'DP',
    text: 'I run workshops in different cities every week. The QR code sharing gets participants set up in seconds.'
  },
  {
    name: 'Amanda Foster',
    role: 'Production Manager',
    company: 'Stellar Productions',
    initials: 'AF',
    text: 'The overtime feature and sound alerts are game-changers for live shows. No more awkward speaker overruns.'
  },
  {
    name: 'James Wilson',
    role: 'Studio Owner',
    company: 'Mindful Yoga',
    initials: 'JW',
    text: 'Clean design that fits our studio aesthetic. The timer looks beautiful on our wall-mounted screen.'
  }
]
</script>

<template>
  <section id="testimonials" class="relative" style="padding: 100px 24px;">
    <div class="w-full max-w-[1200px] mx-auto">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">Trusted by</span>
          <span class="text-red-500"> Professionals</span>
        </h2>
        <p class="section-subtitle">
          See why coaches, event organizers, and trainers love Chronograph.
        </p>
      </div>

      <!-- Testimonials Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="testimonial in testimonials"
          :key="testimonial.name"
          class="testimonial-card"
        >
          <!-- Rating -->
          <div class="testimonial-rating">
            <Star v-for="i in 5" :key="i" class="w-4 h-4 text-red-400 fill-red-400" />
          </div>

          <!-- Text -->
          <p class="testimonial-text">"{{ testimonial.text }}"</p>

          <!-- Author -->
          <div class="testimonial-author">
            <div class="testimonial-avatar">{{ testimonial.initials }}</div>
            <div>
              <p class="testimonial-name">{{ testimonial.name }}</p>
              <p class="testimonial-role">{{ testimonial.role }}, {{ testimonial.company }}</p>
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

.testimonial-card {
  padding: 28px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.testimonial-rating {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}

.testimonial-text {
  font-size: 15px;
  line-height: 1.7;
  color: #9ca3af;
  margin-bottom: 20px;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.testimonial-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1));
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

.testimonial-name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.testimonial-role {
  font-size: 12px;
  color: #6b7280;
}
</style>
