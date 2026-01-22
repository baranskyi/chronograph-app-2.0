<script setup lang="ts">
import OceanBackground from '@/components/landing/OceanBackground.vue'
import LandingNav from '@/components/landing/LandingNav.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import HowItWorks from '@/components/landing/HowItWorks.vue'
import UseCasesSection from '@/components/landing/UseCasesSection.vue'
import TestimonialsSection from '@/components/landing/TestimonialsSection.vue'
import PricingSection from '@/components/landing/PricingSection.vue'
import FAQSection from '@/components/landing/FAQSection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
</script>

<template>
  <div class="landing-page">
    <!-- Ocean of dots background -->
    <OceanBackground />

    <LandingNav />

    <main class="landing-content">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <UseCasesSection />
      <TestimonialsSection />
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
}
</style>
