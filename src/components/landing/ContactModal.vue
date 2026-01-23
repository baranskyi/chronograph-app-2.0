<script setup lang="ts">
import { ref } from 'vue'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'

const emit = defineEmits<{
  close: []
}>()

const form = ref({
  name: '',
  email: '',
  company: '',
  message: ''
})

const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')
const errorMessage = ref('')

async function handleSubmit() {
  if (!form.value.name || !form.value.email || !form.value.message) {
    errorMessage.value = 'Please fill in all required fields'
    submitStatus.value = 'error'
    return
  }

  isSubmitting.value = true
  submitStatus.value = 'idle'
  errorMessage.value = ''

  try {
    const { error } = await supabase
      .from('contact_requests')
      .insert({
        name: form.value.name,
        email: form.value.email,
        company: form.value.company || null,
        message: form.value.message,
        plan_interest: 'enterprise'
      })

    if (error) throw error

    submitStatus.value = 'success'

    // Close after 2 seconds
    setTimeout(() => {
      emit('close')
    }, 2000)
  } catch (error) {
    console.error('Contact form error:', error)
    submitStatus.value = 'error'
    errorMessage.value = 'Failed to submit. Please try again or email us directly.'
  } finally {
    isSubmitting.value = false
  }
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-content">
        <!-- Close button -->
        <button @click="emit('close')" class="close-btn">
          <X class="w-5 h-5" />
        </button>

        <!-- Success state -->
        <div v-if="submitStatus === 'success'" class="success-state">
          <div class="success-icon">
            <CheckCircle class="w-12 h-12 text-green-400" />
          </div>
          <h3>Message Sent!</h3>
          <p>We'll get back to you within 24 hours.</p>
        </div>

        <!-- Form -->
        <template v-else>
          <div class="modal-header">
            <h2>Contact Us</h2>
            <p>Interested in Enterprise? Let's talk about your needs.</p>
          </div>

          <form @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-group">
              <label for="name">Name *</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Your name"
                required
              />
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="company">Company</label>
              <input
                id="company"
                v-model="form.company"
                type="text"
                placeholder="Your company (optional)"
              />
            </div>

            <div class="form-group">
              <label for="message">Message *</label>
              <textarea
                id="message"
                v-model="form.message"
                placeholder="Tell us about your event needs, team size, and any specific requirements..."
                rows="4"
                required
              ></textarea>
            </div>

            <!-- Error message -->
            <div v-if="submitStatus === 'error'" class="error-message">
              <AlertCircle class="w-4 h-4" />
              {{ errorMessage }}
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="submit-btn"
            >
              <template v-if="isSubmitting">
                <span class="spinner"></span>
                Sending...
              </template>
              <template v-else>
                <Send class="w-4 h-4" />
                Send Message
              </template>
            </button>
          </form>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 32px;
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.modal-header p {
  font-size: 14px;
  color: #9ca3af;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #d1d5db;
}

.form-group input,
.form-group textarea {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #6b7280;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
  color: #ef4444;
  font-size: 14px;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.9);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Success state */
.success-state {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  margin-bottom: 24px;
}

.success-state h3 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.success-state p {
  color: #9ca3af;
  font-size: 14px;
}
</style>
