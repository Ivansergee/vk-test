import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UserDetailsView from '../views/UserDetailsView.vue'
import LoginView from '../views/LoginView.vue'


const routes = [
  {
    path: '/',
    name: 'home',
    meta: {
      title: 'VK Test'
    },
    component: HomeView
  },
  {
    path: '/:id',
    name: 'details',
    meta: {
      title: 'VK Test'
    },
    component: UserDetailsView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title}`;
  }
  next();
})

export default router
