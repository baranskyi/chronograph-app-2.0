<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

// Mouse glow effect
const formRef = ref<HTMLElement | null>(null)
const glowX = ref(0)
const glowY = ref(0)
const isHovering = ref(false)

function handleMouseMove(e: MouseEvent) {
  if (!formRef.value) return
  const rect = formRef.value.getBoundingClientRect()
  glowX.value = e.clientX - rect.left
  glowY.value = e.clientY - rect.top
}

function handleMouseEnter() {
  isHovering.value = true
}

function handleMouseLeave() {
  isHovering.value = false
}

async function handleLogin() {
  if (!email.value || !password.value) return

  const success = await authStore.signIn(email.value, password.value)
  if (success) {
    router.push('/my-rooms')
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="login-page">
    <!-- Subtle background pattern -->
    <div class="bg-pattern"></div>

    <div class="login-container">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-wrapper">
          <span class="logo-dot"></span>
          <h1 class="logo-text">Chronograph <span class="logo-accent">Pro</span></h1>
        </div>
        <p class="logo-subtitle">Professional timer management for events</p>
      </div>

      <!-- Login Form with Glow Effect -->
      <form
        ref="formRef"
        @submit.prevent="handleLogin"
        class="login-form"
        @mousemove="handleMouseMove"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- Glow overlay -->
        <div
          class="glow-effect"
          :class="{ active: isHovering }"
          :style="{
            '--glow-x': glowX + 'px',
            '--glow-y': glowY + 'px'
          }"
        ></div>

        <div class="form-content">
          <h2 class="form-title">Welcome back</h2>
          <p class="form-description">Sign in to continue to your dashboard</p>

          <!-- Email -->
          <div class="input-group">
            <label for="email" class="input-label">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="input-field"
              placeholder="you@example.com"
            />
          </div>

          <!-- Password -->
          <div class="input-group">
            <label for="password" class="input-label">Password</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="input-field"
                placeholder="Enter your password"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="toggle-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="authStore.error" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ authStore.error }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.loading || !email || !password"
            class="submit-button"
          >
            <svg v-if="authStore.loading" class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ authStore.loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>

          <!-- Register Link -->
          <div class="register-link">
            <span>Don't have an account?</span>
            <button type="button" class="link-button" @click="goToRegister">
              Create account
            </button>
          </div>
        </div>
      </form>

      <!-- Back to Home -->
      <router-link to="/" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" class="back-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        <span>Back to home</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #080808;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.login-container {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
}

/* Logo Section */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
  animation: logo-pulse 2s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.95); }
}

.logo-text {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.logo-accent {
  color: #ef4444;
}

.logo-subtitle {
  font-size: 16px;
  color: #6b7280;
  font-weight: 400;
}

/* Form */
.login-form {
  position: relative;
  background: #111111;
  border-radius: 20px;
  border: 1px solid #1f1f1f;
  overflow: hidden;
}

.glow-effect {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  background: radial-gradient(
    600px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(239, 68, 68, 0.07),
    transparent 40%
  );
}

.glow-effect.active {
  opacity: 1;
}

.form-content {
  position: relative;
  z-index: 1;
  padding: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.form-description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
}

/* Input Group */
.input-group {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 10px;
}

.input-wrapper {
  position: relative;
}

.input-field {
  width: 100%;
  padding: 16px 20px;
  background: #0a0a0a;
  border: 1px solid #252525;
  border-radius: 12px;
  font-size: 16px;
  color: #ffffff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-field::placeholder {
  color: #4b5563;
}

.input-field:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-wrapper .input-field {
  padding-right: 52px;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #ffffff;
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  margin-bottom: 24px;
  color: #f87171;
  font-size: 14px;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Submit Button */
.submit-button {
  width: 100%;
  padding: 18px 24px;
  background: #ef4444;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.submit-button:hover:not(:disabled) {
  background: #dc2626;
}

.submit-button:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-button:disabled {
  background: #7f1d1d;
  cursor: not-allowed;
  opacity: 0.7;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.spinner-track {
  opacity: 0.25;
}

.spinner-fill {
  opacity: 0.75;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Register Link */
.register-link {
  margin-top: 28px;
  text-align: center;
  font-size: 15px;
  color: #6b7280;
}

.link-button {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  margin-left: 6px;
  transition: color 0.2s ease;
}

.link-button:hover {
  color: #f87171;
}

/* Back Link */
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  color: #4b5563;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #9ca3af;
}

.back-icon {
  width: 16px;
  height: 16px;
}
</style>
