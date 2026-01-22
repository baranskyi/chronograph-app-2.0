<script setup lang="ts">
import { Presentation, Users, Church, Dumbbell, GraduationCap, Video, Mic, Briefcase } from 'lucide-vue-next'

const useCases = [
  {
    icon: Presentation,
    title: 'Conferences & Events',
    description: 'Keep speakers on schedule with visible countdown timers. Perfect for multi-track conferences with parallel sessions.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    icon: Church,
    title: 'Churches & Worship',
    description: 'Manage sermon timing, worship transitions, and service segments. Discreet speaker monitors keep everyone in sync.',
    gradient: 'from-purple-500 to-violet-500'
  },
  {
    icon: Dumbbell,
    title: 'Gyms & CrossFit',
    description: 'EMOM, Tabata, and interval training made easy. Display on gym TVs while coaching from anywhere in the room.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Video,
    title: 'Live Shows & Production',
    description: 'Backstage timing for concerts, broadcasts, and live events. Multiple timers for different cues and segments.',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    icon: GraduationCap,
    title: 'Education & Training',
    description: 'Workshops, seminars, and classroom activities. Share timers with students for group exercises and exams.',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Briefcase,
    title: 'Corporate Meetings',
    description: 'Run efficient meetings with visible time limits. Agenda items, presentations, and Q&A sessions stay on track.',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Mic,
    title: 'Webinars & Podcasts',
    description: 'Keep remote sessions on schedule. Hosts and guests see the same timer regardless of their location.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Users,
    title: 'Sports & Competitions',
    description: 'Track rounds, matches, and breaks. Large display works for spectators while organizers control remotely.',
    gradient: 'from-teal-500 to-green-500'
  }
]
</script>

<template>
  <section id="use-cases" class="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background -->
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />

    <div class="relative max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span class="text-white">Built for</span>
          <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> Every Industry</span>
        </h2>
        <p class="text-gray-400 text-lg">
          From small meetings to large events, Chronograph.pro adapts to your needs
        </p>
      </div>

      <!-- Use Cases Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="useCase in useCases"
          :key="useCase.title"
          class="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer"
        >
          <!-- Icon -->
          <div class="relative mb-5">
            <div
              class="absolute inset-0 w-12 h-12 rounded-xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity"
              :class="`bg-gradient-to-r ${useCase.gradient}`"
            />
            <div class="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
              <component
                :is="useCase.icon"
                class="w-6 h-6 text-white/80"
              />
            </div>
          </div>

          <!-- Content -->
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ useCase.title }}
          </h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            {{ useCase.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
