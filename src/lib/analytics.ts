/**
 * Google Analytics 4 Event Tracking
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics'
 *   trackEvent('sign_up', { method: 'email' })
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

/**
 * Track a custom event in Google Analytics 4
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams)
  }
}

/**
 * Pre-defined events for Chronograph
 */
export const analytics = {
  // Auth events
  signUp: (method: string = 'email') => {
    trackEvent('sign_up', { method })
  },

  login: (method: string = 'email') => {
    trackEvent('login', { method })
  },

  logout: () => {
    trackEvent('logout')
  },

  // Room events
  createRoom: () => {
    trackEvent('create_room')
  },

  deleteRoom: () => {
    trackEvent('delete_room')
  },

  enterRoom: (roomCode: string) => {
    trackEvent('enter_room', { room_code: roomCode })
  },

  // Timer events
  createTimer: () => {
    trackEvent('create_timer')
  },

  startTimer: () => {
    trackEvent('start_timer')
  },

  // Subscription events
  viewPricing: () => {
    trackEvent('view_pricing')
  },

  startCheckout: (plan: string, billing: string) => {
    trackEvent('begin_checkout', {
      currency: 'USD',
      items: [{
        item_name: `Chronograph ${plan}`,
        item_category: billing
      }]
    })
  },

  completeCheckout: (plan: string, billing: string, value: number) => {
    trackEvent('purchase', {
      currency: 'USD',
      value,
      items: [{
        item_name: `Chronograph ${plan}`,
        item_category: billing
      }]
    })
  },

  // Trial events
  trialStarted: () => {
    trackEvent('trial_started')
  },

  trialExpired: () => {
    trackEvent('trial_expired')
  },

  // Feature usage
  sendMessage: () => {
    trackEvent('send_message')
  },

  shareRoom: () => {
    trackEvent('share_room')
  },

  viewerJoined: (roomCode: string) => {
    trackEvent('viewer_joined', { room_code: roomCode })
  }
}

export default analytics
