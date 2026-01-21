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
  <footer class="border-t border-border bg-card/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-2">
          <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold mb-4">
            <Timer class="w-6 h-6 text-primary" />
            <span>Chronograph.Pro</span>
          </RouterLink>
          <p class="text-muted-foreground max-w-sm">
            Professional timer application for coaches, trainers, and fitness professionals.
            Create, share, and control timers remotely.
          </p>
        </div>

        <!-- Product Links -->
        <div>
          <h4 class="font-semibold mb-4">Product</h4>
          <ul class="space-y-2">
            <li v-for="link in links.product" :key="link.label">
              <a
                :href="link.href"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Account Links -->
        <div>
          <h4 class="font-semibold mb-4">Account</h4>
          <ul class="space-y-2">
            <li v-for="link in links.account" :key="link.label">
              <RouterLink
                :to="link.to"
                class="text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-sm text-muted-foreground">
          &copy; {{ currentYear }} Chronograph.Pro. All rights reserved.
        </p>
        <p class="text-sm text-muted-foreground">
          Made for coaches, by coaches.
        </p>
      </div>
    </div>
  </footer>
</template>
