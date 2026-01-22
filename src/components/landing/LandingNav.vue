<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Timer, Menu, X } from 'lucide-vue-next'
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
        ? 'bg-[#0f1419]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink
          to="/"
          class="flex items-center gap-3 group cursor-pointer"
          @click="closeMobileMenu"
        >
          <div class="relative">
            <div class="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-300" />
            <Timer class="relative w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
          </div>
          <span class="text-xl font-semibold tracking-tight">
            <span class="text-white">Chronograph</span><span class="text-blue-400">.pro</span>
          </span>
        </RouterLink>

        <!-- Desktop Nav Links -->
        <div class="hidden lg:flex items-center gap-1">
          <a
            v-for="link in navLinks"
            :key="link.label"
            :href="link.href"
            class="px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer"
          >
            {{ link.label }}
          </a>
        </div>

        <!-- Desktop Auth Buttons -->
        <div class="hidden md:flex items-center gap-3">
          <RouterLink
            to="/login"
            class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </RouterLink>
          <RouterLink
            to="/register"
            class="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
          >
            Get Started Free
          </RouterLink>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          @click="toggleMobileMenu"
          aria-label="Toggle menu"
        >
          <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
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
            class="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </a>
          <div class="flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
            <RouterLink
              to="/login"
              class="px-4 py-3 text-center text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
              @click="closeMobileMenu"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/register"
              class="px-4 py-3 text-center font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer"
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
