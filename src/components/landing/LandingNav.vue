<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
]

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav
    class="fixed top-4 left-4 right-4 z-50 transition-all duration-300 rounded-2xl"
    :class="[
      isScrolled
        ? 'glass-nav-scrolled'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-[1200px] mx-auto" style="padding: 0 24px;">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group cursor-pointer"
          @click="closeMobileMenu"
        >
          <span class="logo-dot"></span>
          <span class="text-xl font-bold tracking-tight">
            <span class="text-white">Chronograph</span>
            <span class="text-red-500"> Pro</span>
          </span>
        </RouterLink>

        <!-- Desktop Nav Links -->
        <div class="hidden lg:flex items-center gap-1">
          <a
            v-for="link in navLinks"
            :key="link.label"
            :href="link.href"
            class="nav-link"
          >
            {{ link.label }}
          </a>
        </div>

        <!-- Desktop Auth Buttons -->
        <div class="hidden md:flex items-center gap-3">
          <RouterLink
            to="/login"
            class="nav-link"
          >
            Sign In
          </RouterLink>
          <RouterLink
            to="/register"
            class="cta-button"
          >
            Get Started Free
          </RouterLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden glass-button-subtle rounded-lg cursor-pointer"
          style="padding: 10px;"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
        >
          <Menu v-if="!isMobileMenuOpen" class="w-6 h-6 text-gray-400" />
          <X v-else class="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-show="isMobileMenuOpen"
        class="md:hidden pb-6 pt-2 border-t border-white/5 mt-2"
      >
        <div class="flex flex-col gap-1">
          <a
            v-for="link in navLinks"
            :key="link.label"
            :href="link.href"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </a>
          <div class="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
            <RouterLink
              to="/login"
              class="mobile-nav-link text-center"
              @click="closeMobileMenu"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/register"
              class="cta-button text-center"
              @click="closeMobileMenu"
            >
              Get Started Free
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.glass-nav-scrolled {
  background: rgba(8, 8, 8, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.logo-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.nav-link {
  padding: 8px 16px;
  font-size: 14px;
  color: #9ca3af;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.mobile-nav-link {
  padding: 12px 16px;
  color: #9ca3af;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.mobile-nav-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.cta-button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(210, 70, 70, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
}

.cta-button:hover {
  background: rgba(230, 80, 80, 0.9);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.glass-button-subtle {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.glass-button-subtle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
}
</style>
