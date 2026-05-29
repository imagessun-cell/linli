import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/role-select',
    name: 'RoleSelect',
    component: () => import('@/views/RoleSelect.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/task/:id',
    name: 'TaskDetail',
    component: () => import('@/views/common/TaskDetail.vue')
  },
  {
    path: '/worker',
    component: () => import('@/views/worker/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/worker/dashboard' },
      { path: 'dashboard', name: 'WorkerDashboard', component: () => import('@/views/worker/Dashboard.vue') },
      { path: 'task-hall', name: 'TaskHall', component: () => import('@/views/worker/TaskHall.vue') },
      { path: 'task/:id', name: 'WorkerTaskDetail', component: () => import('@/views/worker/TaskDetail.vue') },
      { path: 'my-tasks', name: 'WorkerMyTasks', component: () => import('@/views/worker/MyTasks.vue') },
      { path: 'wallet', name: 'WorkerWallet', component: () => import('@/views/worker/Wallet.vue') },
      { path: 'profile', name: 'WorkerProfile', component: () => import('@/views/worker/Profile.vue') },
      { path: 'apply', name: 'WorkerApply', component: () => import('@/views/worker/Apply.vue') }
    ]
  },
  {
    path: '/employer',
    component: () => import('@/views/employer/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/employer/dashboard' },
      { path: 'dashboard', name: 'EmployerDashboard', component: () => import('@/views/employer/Dashboard.vue') },
      { path: 'publish', name: 'PublishTask', component: () => import('@/views/employer/Publish.vue') },
      { path: 'workers', name: 'WorkerSquare', component: () => import('@/views/employer/WorkerSquare.vue') },
      { path: 'orders', name: 'EmployerOrders', component: () => import('@/views/employer/Orders.vue') },
      { path: 'profile', name: 'EmployerProfile', component: () => import('@/views/employer/Profile.vue') }
    ]
  },
  {
    path: '/common',
    component: () => import('@/views/common/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'order/:id', name: 'OrderDetail', component: () => import('@/views/common/OrderDetail.vue') },
      { path: 'messages', name: 'MessageList', component: () => import('@/views/common/MessageList.vue') },
      { path: 'chat/:userId', name: 'ChatRoom', component: () => import('@/views/common/ChatRoom.vue') },
      { path: 'training', name: 'Training', component: () => import('@/views/common/Training.vue') },
      { path: 'community', name: 'Community', component: () => import('@/views/common/Community.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/role-select')
  } else {
    next()
  }
})

export default router