import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../pages/LandingPage.vue')
  },
  {
    path: '/app',
    name: 'app',
    component: () => import('../pages/HomePage.vue')
  },
  // Auth routes
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../pages/RegisterPage.vue'),
    meta: { guestOnly: true }
  },
  // Protected routes
  {
    path: '/my-rooms',
    name: 'my-rooms',
    component: () => import('../pages/MyRoomsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/room/:roomCode',
    name: 'room',
    component: () => import('../pages/DashboardPage.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  // Legacy dashboard route - redirect to my-rooms
  {
    path: '/dashboard',
    name: 'dashboard',
    redirect: '/my-rooms'
  },
  // Legacy controller route - redirect to dashboard
  {
    path: '/controller',
    redirect: '/dashboard'
  },
  // Viewer with optional timer ID (public - no auth required)
  {
    path: '/viewer/:roomId/:timerId?',
    name: 'viewer',
    component: () => import('../pages/ViewerPage.vue'),
    props: true
  },
  // Short URL - same component, different path
  {
    path: '/v/:roomId/:timerId?',
    name: 'viewer-short',
    component: () => import('../pages/ViewerPage.vue'),
    props: true
  },
  // Public Q&A submission page (no auth required)
  {
    path: '/ask/:roomCode',
    name: 'ask',
    component: () => import('../pages/AskPage.vue'),
    props: true
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth if not done yet
  if (authStore.loading && !authStore.user) {
    await authStore.initialize()
  }

  const requiresAuth = to.meta.requiresAuth
  const guestOnly = to.meta.guestOnly
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if auth required but not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (guestOnly && isAuthenticated) {
    // Redirect to my-rooms if guest-only route but authenticated
    next({ name: 'my-rooms' })
  } else {
    next()
  }
})
