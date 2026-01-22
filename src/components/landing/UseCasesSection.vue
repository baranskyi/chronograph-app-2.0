<script setup lang="ts">
import { Presentation, Users, Church, Dumbbell, GraduationCap, Video, Mic, Briefcase } from 'lucide-vue-next'

const useCases = [
  {
    icon: Presentation,
    title: 'Conferences & Events',
    description: 'Keep speakers on schedule with visible countdown timers.'
  },
  {
    icon: Church,
    title: 'Churches & Worship',
    description: 'Manage sermon timing and service segment transitions.'
  },
  {
    icon: Dumbbell,
    title: 'Gyms & CrossFit',
    description: 'EMOM, Tabata, and interval training on gym displays.'
  },
  {
    icon: Video,
    title: 'Live Shows',
    description: 'Backstage timing for concerts and live broadcasts.'
  },
  {
    icon: GraduationCap,
    title: 'Education',
    description: 'Workshops, exams, and classroom activities.'
  },
  {
    icon: Briefcase,
    title: 'Corporate',
    description: 'Efficient meetings with visible time limits.'
  },
  {
    icon: Mic,
    title: 'Webinars',
    description: 'Keep remote sessions on schedule.'
  },
  {
    icon: Users,
    title: 'Sports',
    description: 'Track rounds, matches, and breaks.'
  }
]
</script>

<template>
  <section id="use-cases" class="section-wrapper">
    <div class="section-container">
      <!-- Section Header -->
      <div class="text-center" style="margin-bottom: 64px;">
        <h2 class="section-title">
          <span class="text-white">Built for</span>
          <span class="text-red-500"> Every Industry</span>
        </h2>
        <p class="section-subtitle">
          From small meetings to large events, Chronograph adapts to your needs.
        </p>
      </div>

      <!-- Use Cases Grid -->
      <div class="usecases-grid">
        <div
          v-for="useCase in useCases"
          :key="useCase.title"
          class="usecase-card"
        >
          <div class="usecase-icon">
            <component :is="useCase.icon" class="w-6 h-6" />
          </div>
          <h3 class="usecase-title">{{ useCase.title }}</h3>
          <p class="usecase-description">{{ useCase.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-wrapper {
  position: relative;
  width: 100%;
  padding: 100px 24px;
}

.section-container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.usecases-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 640px) {
  .usecases-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.section-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 18px;
  color: #9ca3af;
  max-width: 500px;
  margin: 0 auto;
}

.usecase-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.usecase-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.usecase-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  color: #9ca3af;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.usecase-card:hover .usecase-icon {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.usecase-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 6px;
}

.usecase-description {
  font-size: 13px;
  line-height: 1.5;
  color: #9ca3af;
}
</style>
