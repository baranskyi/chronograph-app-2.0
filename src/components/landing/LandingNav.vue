<script setup lang="ts">
import { Timer } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 text-xl font-bold">
          <Timer class="w-6 h-6 text-primary" />
          <span>Chronograph.Pro</span>
        </RouterLink>

        <!-- Nav Links (desktop) -->
        <div class="hidden md:flex items-center gap-6">
          <a href="#features" class="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" class="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" class="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" class="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>

        <!-- Auth Buttons -->
        <div class="flex items-center gap-3">
          <Button variant="ghost" as-child>
            <RouterLink to="/login">Sign In</RouterLink>
          </Button>
          <Button as-child>
            <RouterLink to="/register">Get Started</RouterLink>
          </Button>
        </div>
      </div>
    </div>
  </nav>
</template>
