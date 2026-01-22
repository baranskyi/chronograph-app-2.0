<script setup lang="ts">
import { Github, Twitter, Mail } from 'lucide-vue-next'
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
  <footer class="footer">
    <!-- Red gradient top border -->
    <div class="footer-border" />

    <div class="footer-content">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="brand-section">
          <RouterLink to="/" class="brand-link">
            <div class="logo-container">
              <div class="logo-dot" />
              <span class="logo-text">
                <span class="text-white">Chronograph</span><span class="text-red-500">.pro</span>
              </span>
            </div>
          </RouterLink>
          <p class="brand-description">
            Professional timer system for events, conferences, and training sessions. Control time, lead sessions, sync everywhere.
          </p>
          <!-- Social links -->
          <div class="social-links">
            <a
              href="#"
              class="social-button"
              aria-label="Twitter"
            >
              <Twitter class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="social-button"
              aria-label="GitHub"
            >
              <Github class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="social-button"
              aria-label="Email"
            >
              <Mail class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Product Links -->
        <div class="links-section">
          <h4 class="links-title">Product</h4>
          <ul class="links-list">
            <li v-for="link in links.product" :key="link.label">
              <a :href="link.href" class="footer-link">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Account Links -->
        <div class="links-section">
          <h4 class="links-title">Account</h4>
          <ul class="links-list">
            <li v-for="link in links.account" :key="link.label">
              <RouterLink :to="link.to" class="footer-link">
                {{ link.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Resources Links -->
        <div class="links-section">
          <h4 class="links-title">Resources</h4>
          <ul class="links-list">
            <li v-for="link in links.resources" :key="link.label">
              <a :href="link.href" class="footer-link">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal Links -->
        <div class="links-section">
          <h4 class="links-title">Legal</h4>
          <ul class="links-list">
            <li v-for="link in links.legal" :key="link.label">
              <a :href="link.href" class="footer-link">
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="bottom-bar">
        <p class="copyright">
          &copy; {{ currentYear }} Chronograph.pro. All rights reserved.
        </p>
        <p class="tagline">
          Made with precision for professionals worldwide.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(8, 8, 8, 0.8);
}

.footer-border {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(239, 68, 68, 0.5), transparent);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 48px;
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
  .brand-section {
    grid-column: span 4;
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  .brand-section {
    grid-column: span 2;
  }
}

.brand-section {
  display: flex;
  flex-direction: column;
}

.brand-link {
  display: inline-flex;
  margin-bottom: 20px;
  text-decoration: none;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
  50% { opacity: 0.7; box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
}

.brand-description {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 280px;
}

.social-links {
  display: flex;
  align-items: center;
  gap: 12px;
}

.social-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: #6b7280;
  transition: all 0.3s ease;
  cursor: pointer;
}

.social-button:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.links-section {
  display: flex;
  flex-direction: column;
}

.links-title {
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-link {
  color: #6b7280;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
}

.footer-link:hover {
  color: #ffffff;
}

.bottom-bar {
  margin-top: 64px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

@media (min-width: 640px) {
  .bottom-bar {
    flex-direction: row;
    justify-content: space-between;
  }
}

.copyright {
  font-size: 13px;
  color: #4b5563;
}

.tagline {
  font-size: 13px;
  color: #4b5563;
}
</style>
