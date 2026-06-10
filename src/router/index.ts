import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TestView from '@/views/TestView.vue'
import ResultView from '@/views/ResultView.vue'
import { useTestStore } from '@/stores/testStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/test/:mode/:page',
      name: 'test',
      component: TestView,
      beforeEnter: (to) => {
        const mode = to.params.mode as string
        const page = parseInt(to.params.page as string)
        if (!['quick', 'full'].includes(mode)) return '/'
        const maxPage = mode === 'quick' ? 3 : 12
        if (isNaN(page) || page < 1 || page > maxPage) {
          return `/test/${mode}/1`
        }
      },
    },
    {
      path: '/result/:mode',
      name: 'result',
      component: ResultView,
      beforeEnter: (to) => {
        const mode = to.params.mode as string
        if (!['quick', 'full'].includes(mode)) return '/'
        const store = useTestStore()
        if (!store.isComplete || store.mode !== mode) {
          return '/'
        }
      },
    },
  ],
})

export default router
