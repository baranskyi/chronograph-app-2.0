<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, Clock, Calendar, List } from 'lucide-vue-next'
import { getArticleBySlug, articles, extractToc } from '@/data/articles'
import LandingNav from '@/components/landing/LandingNav.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'

const route = useRoute()
const mouseGlowRef = ref<HTMLDivElement | null>(null)
const activeHeadingId = ref('')
const mobileTocOpen = ref(false)

const article = computed(() => {
  return getArticleBySlug(route.params.slug as string)
})

const toc = computed(() => {
  if (!article.value) return []
  return extractToc(article.value.content)
})

const relatedArticles = computed(() => {
  if (!article.value) return []
  return articles
    .filter(a => a.id !== article.value!.id)
    .slice(0, 2)
})

function handleMouseMove(e: MouseEvent) {
  if (mouseGlowRef.value) {
    mouseGlowRef.value.style.left = `${e.clientX}px`
    mouseGlowRef.value.style.top = `${e.clientY}px`
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function scrollToHeading(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    mobileTocOpen.value = false
  }
}

function updateActiveHeading() {
  const headings = toc.value.map(t => document.getElementById(t.id)).filter(Boolean) as HTMLElement[]
  let current = ''
  for (const h of headings) {
    if (h.getBoundingClientRect().top <= 120) {
      current = h.id
    }
  }
  activeHeadingId.value = current
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('scroll', updateActiveHeading, { passive: true })
  window.scrollTo(0, 0)
  nextTick(() => updateActiveHeading())
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('scroll', updateActiveHeading)
})
</script>

<template>
  <div class="article-page">
    <div ref="mouseGlowRef" class="mouse-glow"></div>
    <LandingNav />

    <main v-if="article" class="article-content">
      <!-- Hero -->
      <section class="article-hero">
        <div class="article-hero-inner">
          <RouterLink to="/knowledge-base" class="back-link">
            <ArrowLeft class="w-4 h-4" />
            Knowledge Base
          </RouterLink>

          <div class="article-meta-top">
            <span class="category-badge">{{ article.category }}</span>
            <span class="meta-item">
              <Clock class="w-4 h-4" />
              {{ article.readTime }}
            </span>
            <span class="meta-item">
              <Calendar class="w-4 h-4" />
              {{ formatDate(article.date) }}
            </span>
          </div>

          <h1 class="article-title">{{ article.title }}</h1>
          <p class="article-description">{{ article.description }}</p>
        </div>
      </section>

      <!-- Cover Image -->
      <section class="cover-section">
        <div class="cover-wrapper">
          <img
            :src="article.coverImage"
            :alt="article.title"
            class="cover-image"
            @error="($event.target as HTMLImageElement).parentElement!.style.display = 'none'"
          />
        </div>
      </section>

      <!-- Mobile TOC -->
      <section v-if="toc.length" class="toc-mobile-section">
        <div class="toc-mobile-wrapper">
          <button class="toc-mobile-toggle" @click="mobileTocOpen = !mobileTocOpen">
            <List class="w-4 h-4" />
            <span>Table of Contents</span>
            <span class="toc-mobile-arrow" :class="{ open: mobileTocOpen }">&#9662;</span>
          </button>
          <div v-show="mobileTocOpen" class="toc-mobile-list">
            <a
              v-for="item in toc"
              :key="item.id"
              class="toc-mobile-item"
              :class="{ 'toc-h3': item.level === 3, active: activeHeadingId === item.id }"
              @click.prevent="scrollToHeading(item.id)"
              :href="'#' + item.id"
            >
              {{ item.text }}
            </a>
          </div>
        </div>
      </section>

      <!-- Article Body + Desktop TOC -->
      <section class="body-section">
        <div class="body-with-toc">
          <div class="body-wrapper">
            <div class="prose" v-html="article.content"></div>
          </div>

          <!-- Desktop TOC sidebar -->
          <aside v-if="toc.length" class="toc-sidebar">
            <div class="toc-sidebar-inner">
              <div class="toc-sidebar-title">Contents</div>
              <nav class="toc-sidebar-nav">
                <a
                  v-for="item in toc"
                  :key="item.id"
                  class="toc-sidebar-link"
                  :class="{ 'toc-h3': item.level === 3, active: activeHeadingId === item.id }"
                  @click.prevent="scrollToHeading(item.id)"
                  :href="'#' + item.id"
                >
                  {{ item.text }}
                </a>
              </nav>
            </div>
          </aside>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="cta-wrapper">
          <div class="cta-card">
            <h3 class="cta-title">Ready to get started?</h3>
            <p class="cta-text">Create your free Chronograph.pro account and start managing time like a pro.</p>
            <RouterLink to="/register" class="cta-button">
              Get Started Free
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Related Articles -->
      <section v-if="relatedArticles.length" class="related-section">
        <div class="related-wrapper">
          <h2 class="related-title">More from Knowledge Base</h2>
          <div class="related-grid">
            <RouterLink
              v-for="related in relatedArticles"
              :key="related.id"
              :to="`/knowledge-base/${related.slug}`"
              class="related-card"
            >
              <div class="related-cover">
                <img
                  :src="related.coverImage"
                  :alt="related.title"
                  class="related-cover-img"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
              <div class="related-body">
                <span class="related-category">{{ related.category }}</span>
                <h3 class="related-card-title">{{ related.title }}</h3>
                <span class="related-read-time">{{ related.readTime }}</span>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <!-- 404 -->
    <main v-else class="not-found">
      <h1>Article not found</h1>
      <RouterLink to="/knowledge-base" class="back-link">
        <ArrowLeft class="w-4 h-4" />
        Back to Knowledge Base
      </RouterLink>
    </main>

    <LandingFooter />
  </div>
</template>

<style scoped>
.article-page {
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

.article-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

/* Hero */
.article-hero {
  padding: 140px 24px 40px;
}

.article-hero-inner {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 14px;
  text-decoration: none;
  margin-bottom: 32px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #ffffff;
}

.article-meta-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.article-title {
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-bottom: 16px;
}

.article-description {
  font-size: 18px;
  color: #9ca3af;
  line-height: 1.6;
}

/* Cover */
.cover-section {
  padding: 0 24px 48px;
}

.cover-wrapper {
  max-width: 800px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.cover-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Mobile TOC */
.toc-mobile-section {
  padding: 0 24px 24px;
  display: block;
}

.toc-mobile-wrapper {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.toc-mobile-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: none;
  border: none;
  color: #d1d5db;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.toc-mobile-toggle:hover {
  color: #ffffff;
}

.toc-mobile-arrow {
  margin-left: auto;
  font-size: 12px;
  transition: transform 0.2s;
}

.toc-mobile-arrow.open {
  transform: rotate(180deg);
}

.toc-mobile-list {
  display: flex;
  flex-direction: column;
  padding: 0 16px 14px;
  gap: 2px;
}

.toc-mobile-item {
  display: block;
  padding: 6px 10px;
  font-size: 13px;
  color: #9ca3af;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s;
  cursor: pointer;
}

.toc-mobile-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
}

.toc-mobile-item.toc-h3 {
  padding-left: 24px;
  font-size: 12px;
}

.toc-mobile-item.active {
  color: #ef4444;
}

@media (min-width: 1200px) {
  .toc-mobile-section {
    display: none;
  }
}

/* Body */
.body-section {
  padding: 0 24px 60px;
}

.body-with-toc {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 48px;
  align-items: flex-start;
}

.body-wrapper {
  max-width: 800px;
  flex: 1;
  min-width: 0;
}

/* Desktop TOC Sidebar */
.toc-sidebar {
  display: none;
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

@media (min-width: 1200px) {
  .toc-sidebar {
    display: block;
  }
}

.toc-sidebar-inner {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.toc-sidebar-title {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.toc-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toc-sidebar-link {
  display: block;
  padding: 5px 10px;
  font-size: 13px;
  line-height: 1.4;
  color: #9ca3af;
  text-decoration: none;
  border-radius: 6px;
  border-left: 2px solid transparent;
  transition: all 0.15s;
  cursor: pointer;
}

.toc-sidebar-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
}

.toc-sidebar-link.toc-h3 {
  padding-left: 20px;
  font-size: 12px;
}

.toc-sidebar-link.active {
  color: #ef4444;
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

/* Prose Styles */
.prose {
  color: #d1d5db;
  font-size: 16px;
  line-height: 1.8;
}

.prose :deep(h2) {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-top: 48px;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.prose :deep(h3) {
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  margin-top: 36px;
  margin-bottom: 12px;
}

.prose :deep(h4) {
  font-size: 18px;
  font-weight: 600;
  color: #e5e7eb;
  margin-top: 28px;
  margin-bottom: 10px;
}

.prose :deep(p) {
  margin-bottom: 16px;
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.prose :deep(li) {
  margin-bottom: 8px;
}

.prose :deep(strong) {
  color: #ffffff;
  font-weight: 600;
}

.prose :deep(a) {
  color: #ef4444;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prose :deep(a:hover) {
  color: #f87171;
}

.prose :deep(blockquote) {
  border-left: 3px solid rgba(239, 68, 68, 0.4);
  padding-left: 20px;
  margin: 24px 0;
  color: #9ca3af;
  font-style: italic;
}

.prose :deep(code) {
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  color: #f87171;
}

.prose :deep(pre) {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  overflow-x: auto;
}

.prose :deep(pre code) {
  background: none;
  padding: 0;
  color: #d1d5db;
}

.prose :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin: 40px 0;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
}

.prose :deep(th),
.prose :deep(td) {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.prose :deep(th) {
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
}

/* CTA */
.cta-section {
  padding: 0 24px 60px;
}

.cta-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.cta-card {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.cta-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
}

.cta-text {
  font-size: 16px;
  color: #9ca3af;
  margin-bottom: 24px;
}

.cta-button {
  display: inline-flex;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(210, 70, 70, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
  text-decoration: none;
  transition: all 0.2s ease;
}

.cta-button:hover {
  background: rgba(230, 80, 80, 0.9);
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

/* Related */
.related-section {
  padding: 0 24px 100px;
}

.related-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.related-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 24px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

@media (max-width: 480px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}

.related-card {
  display: flex;
  gap: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.2s ease;
}

.related-card:hover {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.related-cover {
  width: 120px;
  min-height: 100px;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(59, 130, 246, 0.05));
  overflow: hidden;
}

.related-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-body {
  padding: 16px 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-category {
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.related-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
}

.related-read-time {
  font-size: 12px;
  color: #6b7280;
  margin-top: auto;
}

/* 404 */
.not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 140px 24px;
}

.not-found h1 {
  font-size: 32px;
  color: #ffffff;
}
</style>
