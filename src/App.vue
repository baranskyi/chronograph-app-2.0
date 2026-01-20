<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()
const appVersion = '1.2.12'

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div class="h-full">
    <router-view />
    <!-- Version badge for deploy verification -->
    <div class="fixed bottom-2 right-2 text-xs text-gray-600 opacity-50">
      v{{ appVersion }}
    </div>
  </div>
</template>
