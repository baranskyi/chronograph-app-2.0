<script setup lang="ts">
import { Timer, Github, Twitter, Mail } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()

const links = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Use Cases', href: '#use-cases' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ],
  account: [
    { label: 'Sign In', to: '/login' },
    { label: 'Create Account', to: '/register' },
    { label: 'Try Demo', to: '/app' }
  ],
  legal: [
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Cookie Policy', href: '#' }
  ],
  resources: [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Status', href: '#' }
  ]
}
</script>

<template>
  <footer class="relative border-t border-white/5">
    <!-- Gradient top border effect -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
        <!-- Brand -->
        <div class="col-span-2">
          <RouterLink to="/" class="flex items-center gap-3 mb-6 cursor-pointer group">
            <div class="relative">
              <div class="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Timer class="relative w-7 h-7 text-blue-400" />
            </div>
            <span class="text-xl font-semibold">
              <span class="text-white">Chronograph</span><span class="text-blue-400">.pro</span>
            </span>
          </RouterLink>
          <p class="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
            Professional timer system for events, conferences, and training sessions. Control time, lead sessions, sync everywhere.
          </p>
          <!-- Social links -->
          <div class="flex items-center gap-4">
            <a
              href="#"
              class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Twitter"
            >
              <Twitter class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              aria-label="GitHub"
            >
              <Github class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              aria-label="Email"
            >
              <Mail class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Product Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
          <ul class="space-y-3">
            <li v-for="link in links.product" :key="link.label">
              <a
                :href="link.href"
                class="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Account Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account</h4>
          <ul class="space-y-3">
            <li v-for="link in links.account" :key="link.label">
              <RouterLink
                :to="link.to"
                class="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Resources Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
          <ul class="space-y-3">
            <li v-for="link in links.resources" :key="link.label">
              <a
                :href="link.href"
                class="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
          <ul class="space-y-3">
            <li v-for="link in links.legal" :key="link.label">
              <a
                :href="link.href"
                class="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-sm text-gray-600">
          &copy; {{ currentYear }} Chronograph.pro. All rights reserved.
        </p>
        <p class="text-sm text-gray-600">
          Made with precision for professionals worldwide.
        </p>
      </div>
    </div>
  </footer>
</template>
