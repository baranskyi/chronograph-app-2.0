<script setup lang="ts">
import { Timer } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const currentYear = new Date().getFullYear()

const links = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' }
  ],
  account: [
    { label: 'Sign In', to: '/login' },
    { label: 'Create Account', to: '/register' },
    { label: 'Try Demo', to: '/app' }
  ]
}
</script>

<template>
  <footer class="relative border-t border-white/5">
    <!-- Gradient top border effect -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
        <!-- Brand -->
        <div class="md:col-span-2">
          <RouterLink to="/" class="flex items-center gap-3 mb-6 cursor-pointer group">
            <div class="relative">
              <div class="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Timer class="relative w-7 h-7 text-blue-400" />
            </div>
            <span class="text-xl font-semibold">
              <span class="text-white">Chrono</span><span class="text-blue-400">graph</span>
            </span>
          </RouterLink>
          <p class="text-gray-500 max-w-sm leading-relaxed">
            Professional timer application for coaches, trainers, and fitness professionals.
            Create, share, and control timers remotely.
          </p>
        </div>

        <!-- Product Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-6">Product</h4>
          <ul class="space-y-4">
            <li v-for="link in links.product" :key="link.label">
              <a
                :href="link.href"
                class="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Account Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-6">Account</h4>
          <ul class="space-y-4">
            <li v-for="link in links.account" :key="link.label">
              <RouterLink
                :to="link.to"
                class="text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-sm text-gray-600">
          &copy; {{ currentYear }} Chronograph.Pro. All rights reserved.
        </p>
        <p class="text-sm text-gray-600">
          Made for coaches, by coaches.
        </p>
      </div>
    </div>
  </footer>
</template>
