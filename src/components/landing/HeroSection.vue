<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Play, ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <section class="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

    <div class="relative max-w-7xl mx-auto">
      <div class="text-center max-w-3xl mx-auto">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Free for coaches and trainers
        </div>

        <!-- Headline -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          Professional Timer for
          <span class="text-primary">Coaches & Trainers</span>
        </h1>

        <!-- Subheadline -->
        <p class="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Create multiple timers, share with clients via QR code, and control everything remotely.
          Perfect for gyms, CrossFit boxes, yoga studios, and personal training.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" as-child class="min-w-[180px]">
            <RouterLink to="/register">
              Get Started Free
              <ArrowRight class="w-4 h-4" />
            </RouterLink>
          </Button>
          <Button variant="outline" size="lg" as-child class="min-w-[180px]">
            <RouterLink to="/app">
              <Play class="w-4 h-4" />
              Try Demo
            </RouterLink>
          </Button>
        </div>

        <!-- Trust badges -->
        <p class="mt-8 text-sm text-muted-foreground">
          No credit card required • Free forever for basic use
        </p>
      </div>

      <!-- Timer Preview -->
      <div class="mt-16 relative">
        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
        <div class="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-primary/5">
          <div class="p-4 border-b border-border flex items-center gap-2">
            <div class="flex gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-500" />
              <div class="w-3 h-3 rounded-full bg-yellow-500" />
              <div class="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span class="text-sm text-muted-foreground ml-2">chronograph.pro</span>
          </div>
          <div class="p-8 sm:p-12 flex items-center justify-center bg-gradient-to-b from-card to-background">
            <div class="text-center">
              <div class="timer-font text-6xl sm:text-8xl lg:text-9xl font-bold text-green-500" style="text-shadow: 0 0 60px rgba(34, 197, 94, 0.5);">
                05:00
              </div>
              <p class="mt-4 text-muted-foreground text-lg">EMOM Timer • Round 1/10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
