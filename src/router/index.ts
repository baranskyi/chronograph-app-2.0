import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/DashboardPage.vue')
  },
  // Legacy controller route - redirect to dashboard
  {
    path: '/controller',
    redirect: '/dashboard'
  },
  // Viewer with optional timer ID
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
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
