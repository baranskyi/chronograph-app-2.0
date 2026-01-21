<script setup lang="ts">
import LandingNav from '@/components/landing/LandingNav.vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import HowItWorks from '@/components/landing/HowItWorks.vue'
import PricingSection from '@/components/landing/PricingSection.vue'
import FAQSection from '@/components/landing/FAQSection.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
</script>

<template>
  <div class="min-h-full flex flex-col">
    <LandingNav />

    <main class="flex-1">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <FAQSection />
    </main>

    <LandingFooter />
  </div>
</template>
