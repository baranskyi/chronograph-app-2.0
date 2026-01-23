<script setup lang="ts">
import { ref } from 'vue'

// Screenshots showcase section
const screenshots = [
  {
    src: '/screenshots/dashboard.png',
    alt: 'Timer Dashboard - Control multiple timers in real-time',
    title: 'Timer Dashboard',
    description: 'Control time and timers, send messages to speakers, let people speak to a talent.'
  },
  {
    src: '/screenshots/rooms.png',
    alt: 'My Rooms - Manage all your timer rooms',
    title: 'Room Management',
    description: 'Add rooms for every speaking venue, see all timers from the heli view.'
  },
  {
    src: '/screenshots/settings.png',
    alt: 'Timer Settings - Customize countdown, warnings and more',
    title: 'Timer Settings',
    description: 'Set up countdown, countup timers or show a simple clocks. And much more...'
  }
]

// Lightbox state
const lightboxOpen = ref(false)
const lightboxImage = ref('')
const lightboxAlt = ref('')

function openLightbox(screenshot: typeof screenshots[0]) {
  lightboxImage.value = screenshot.src
  lightboxAlt.value = screenshot.alt
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}
</script>

<template>
  <section id="showcase" class="showcase-section">
    <div class="showcase-container">
      <!-- Section Header -->
      <div class="showcase-header">
        <h2 class="showcase-title">The Product <span class="text-red-500">You'll Love</span></h2>
        <p class="showcase-subtitle">
          Beautiful, intuitive interface designed for professional speakers and event organizers
        </p>
      </div>

      <!-- Screenshots Grid -->
      <div class="screenshots-grid">
        <div
          v-for="(screenshot, index) in screenshots"
          :key="index"
          class="screenshot-card"
          @click="openLightbox(screenshot)"
        >
          <!-- Glow effect behind image -->
          <div class="screenshot-glow"></div>

          <!-- Image container -->
          <div class="screenshot-image-wrapper">
            <img
              :src="screenshot.src"
              :alt="screenshot.alt"
              class="screenshot-image"
              loading="lazy"
            />
          </div>

          <!-- Caption -->
          <div class="screenshot-caption">
            <p class="caption-title">{{ screenshot.title }}</p>
            <p class="caption-description">{{ screenshot.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="lightbox-overlay"
        @click="closeLightbox"
      >
        <div class="lightbox-content" @click.stop="closeLightbox">
          <img
            :src="lightboxImage"
            :alt="lightboxAlt"
            class="lightbox-image"
          />
          <button class="lightbox-close" @click="closeLightbox">×</button>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.showcase-section {
  position: relative;
  width: 100%;
  padding: 100px 24px;
}

.showcase-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.showcase-header {
  text-align: center;
  margin-bottom: 64px;
}

.showcase-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.showcase-subtitle {
  font-size: 18px;
  color: #9ca3af;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Screenshots Grid */
.screenshots-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
}

@media (min-width: 768px) {
  .screenshots-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
}

@media (min-width: 1200px) {
  .screenshots-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
  }
}

/* Screenshot Card */
.screenshot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

/* Glow effect */
.screenshot-glow {
  position: absolute;
  width: 90%;
  height: 80%;
  top: 10%;
  left: 5%;
  background: radial-gradient(
    ellipse at center,
    rgba(239, 68, 68, 0.35) 0%,
    rgba(239, 68, 68, 0.15) 40%,
    transparent 70%
  );
  filter: blur(50px);
  pointer-events: none;
  z-index: 0;
  animation: glow-pulse 4s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

/* Different glow timing for each card */
.screenshot-card:nth-child(2) .screenshot-glow {
  animation-delay: 1.3s;
}

.screenshot-card:nth-child(3) .screenshot-glow {
  animation-delay: 2.6s;
}

/* Image wrapper */
.screenshot-image-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 30px rgba(0, 0, 0, 0.3),
    0 0 60px rgba(239, 68, 68, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.screenshot-card:hover .screenshot-image-wrapper {
  transform: translateY(-8px);
  border-color: rgba(239, 68, 68, 0.3);
  box-shadow:
    0 12px 50px rgba(0, 0, 0, 0.4),
    0 0 80px rgba(239, 68, 68, 0.2);
}

.screenshot-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.screenshot-card:hover .screenshot-image {
  transform: scale(1.02);
}

/* Caption */
.screenshot-caption {
  margin-top: 20px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.caption-title {
  font-size: 18px;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 8px;
}

.caption-description {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
  max-width: 320px;
  margin: 0 auto;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: pointer;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  animation: zoomIn 0.3s ease;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.lightbox-image {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 16px;
  box-shadow:
    0 0 60px rgba(239, 68, 68, 0.3),
    0 25px 80px rgba(0, 0, 0, 0.5);
}

.lightbox-close {
  position: absolute;
  top: -16px;
  right: -16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lightbox-close:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .showcase-section {
    padding: 60px 16px;
  }

  .showcase-header {
    margin-bottom: 40px;
  }

  .screenshots-grid {
    gap: 32px;
  }

  .screenshot-glow {
    filter: blur(40px);
  }
}
</style>
