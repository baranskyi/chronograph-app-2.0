<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, Clock, ArrowRight } from 'lucide-vue-next'
import { articles } from '@/data/articles'
import LandingNav from '@/components/landing/LandingNav.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'

const mouseGlowRef = ref<HTMLDivElement | null>(null)

function handleMouseMove(e: MouseEvent) {
  if (mouseGlowRef.value) {
    mouseGlowRef.value.style.left = `${e.clientX}px`
    mouseGlowRef.value.style.top = `${e.clientY}px`
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.scrollTo(0, 0)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="kb-page">
    <div ref="mouseGlowRef" class="mouse-glow"></div>
    <LandingNav />

    <main class="kb-content">
      <!-- Hero -->
      <section class="kb-hero">
        <div class="kb-hero-inner">
          <RouterLink to="/" class="back-link">
            <ArrowLeft class="w-4 h-4" />
            Back to Home
          </RouterLink>
          <h1 class="kb-title">Knowledge Base</h1>
          <p class="kb-subtitle">
            Guides, tutorials, and best practices for getting the most out of Chronograph.pro
          </p>
        </div>
      </section>

      <!-- Articles Grid -->
      <section class="articles-section">
        <div class="articles-grid">
          <RouterLink
            v-for="article in articles"
            :key="article.id"
            :to="`/knowledge-base/${article.slug}`"
            class="article-card"
          >
            <div class="article-cover">
              <img
                :src="article.coverImage"
                :alt="article.title"
                class="cover-image"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <div class="cover-overlay"></div>
              <span class="article-category">{{ article.category }}</span>
            </div>
            <div class="article-body">
              <h2 class="article-title">{{ article.title }}</h2>
              <p class="article-description">{{ article.description }}</p>
              <div class="article-meta">
                <span class="meta-item">
                  <Clock class="w-4 h-4" />
                  {{ article.readTime }}
                </span>
                <span class="read-more">
                  Read article
                  <ArrowRight class="w-4 h-4" />
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>
    </main>

    <LandingFooter />
  </div>
</template>

<style scoped>
.kb-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #080808;
  position: relative;
}

.mouse-glow {
  position: fixed;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle at center,
    rgba(239, 68, 68, 0.12) 0%,
    rgba(239, 68, 68, 0.06) 30%,
    rgba(239, 68, 68, 0.02) 50%,
    transparent 70%
  );
  mix-blend-mode: screen;
}

.kb-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.kb-hero {
  padding: 140px 24px 60px;
}

.kb-hero-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 14px;
  text-decoration: none;
  margin-bottom: 24px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #ffffff;
}

.kb-title {
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 16px;
}

.kb-subtitle {
  font-size: 18px;
  color: #6b7280;
  line-height: 1.6;
  max-width: 600px;
}

.articles-section {
  padding: 0 24px 100px;
}

.articles-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

@media (max-width: 480px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }
}

.article-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.article-cover {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(59, 130, 246, 0.05));
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(8, 8, 8, 0.9));
}

.article-category {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.article-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
  margin-bottom: 12px;
}

.article-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  flex: 1;
  margin-bottom: 20px;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.read-more {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
  transition: gap 0.2s;
}

.article-card:hover .read-more {
  gap: 10px;
}
</style>
