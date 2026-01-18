import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue')
  },
  {
    path: '/controller',
    name: 'controller',
    component: () => import('../pages/ControllerPage.vue')
  },
  {
    path: '/viewer/:roomId',
    name: 'viewer',
    component: () => import('../pages/ViewerPage.vue'),
    props: true
  },
  // Short URL - same component, different path
  {
    path: '/v/:roomId',
    name: 'viewer-short',
    component: () => import('../pages/ViewerPage.vue'),
    props: true
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
