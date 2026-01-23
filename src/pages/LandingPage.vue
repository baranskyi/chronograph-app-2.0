<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import OceanBackground from '@/components/landing/OceanBackground.vue'
import LandingNav from '@/components/landing/LandingNav.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import SocialProofSection from '@/components/landing/SocialProofSection.vue'
import ShowcaseSection from '@/components/landing/ShowcaseSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import HowItWorks from '@/components/landing/HowItWorks.vue'
import UseCasesSection from '@/components/landing/UseCasesSection.vue'
import TestimonialsSection from '@/components/landing/TestimonialsSection.vue'
import PricingSection from '@/components/landing/PricingSection.vue'
import FAQSection from '@/components/landing/FAQSection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'

// Mouse glow effect
const mouseGlowRef = ref<HTMLDivElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)

function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY

  if (mouseGlowRef.value) {
    mouseGlowRef.value.style.left = `${e.clientX}px`
    mouseGlowRef.value.style.top = `${e.clientY}px`
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="landing-page">
    <!-- Ocean of dots background -->
    <OceanBackground />

    <!-- Mouse glow effect -->
    <div ref="mouseGlowRef" class="mouse-glow"></div>

    <LandingNav />

    <main class="landing-content">
      <HeroSection />
      <ShowcaseSection />
      <FeaturesSection />
      <HowItWorks />
      <UseCasesSection />
      <TestimonialsSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
    </main>

    <LandingFooter />
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #080808;
  position: relative;
}

.landing-content {
  flex: 1;
  position: relative;
  z-index: 1;
  width: 100%;
}

/* Mouse glow effect - soft light that follows cursor */
.mouse-glow {
  position: fixed;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle at center,
    rgba(239, 68, 68, 0.12) 0%,
    rgba(239, 68, 68, 0.06) 30%,
    rgba(239, 68, 68, 0.02) 50%,
    transparent 70%
  );
  mix-blend-mode: screen;
  transition: opacity 0.15s ease;
}
</style>
