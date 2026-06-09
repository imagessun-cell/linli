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
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue')
  },
  {
    path: '/task/:id',
    name: 'TaskDetail',
    component: () => import('@/views/common/TaskDetailNew.vue')
  },
  {
    path: '/worker/dashboard',
    name: 'WorkerDashboard',
    component: () => import('@/views/worker/MyTasks.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/worker/task/:id',
    name: 'WorkerTaskDetail',
    component: () => import('@/views/worker/TaskDetail.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/worker/my-tasks',
    name: 'WorkerMyTasks',
    component: () => import('@/views/worker/MyTasks.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/worker/wallet',
    name: 'WorkerWallet',
    component: () => import('@/views/worker/Wallet.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/worker/profile',
    name: 'WorkerProfile',
    component: () => import('@/views/worker/Profile.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/worker/apply',
    name: 'WorkerApply',
    component: () => import('@/views/worker/Apply.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/employer/dashboard',
    name: 'EmployerDashboard',
    component: () => import('@/views/employer/Dashboard.vue'),
    meta: { requiresAuth: true, role: 2 }
  },
  {
    path: '/employer/publish',
    name: 'PublishTask',
    component: () => import('@/views/employer/Publish.vue'),
    meta: { requiresAuth: true, role: 2 }
  },
  {
    path: '/employer/workers',
    name: 'WorkerSquare',
    component: () => import('@/views/employer/WorkerSquare.vue'),
    meta: { requiresAuth: true, role: 2 }
  },
  {
    path: '/employer/orders',
    name: 'EmployerOrders',
    component: () => import('@/views/employer/Orders.vue'),
    meta: { requiresAuth: true, role: 2 }
  },
  {
    path: '/employer/profile',
    name: 'EmployerProfile',
    component: () => import('@/views/employer/Profile.vue'),
    meta: { requiresAuth: true, role: 2 }
  },
  {
    path: '/common/order/:id',
    name: 'OrderDetail',
    component: () => import('@/views/common/OrderDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/common/messages',
    name: 'MessageList',
    component: () => import('@/views/common/MessageList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/common/chat/:userId',
    name: 'ChatRoom',
    component: () => import('@/views/common/ChatRoom.vue'),
    meta: { requiresAuth: true, hideTabBar: true }
  },
  {
    path: '/common/training',
    name: 'Training',
    component: () => import('@/views/common/Training.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/common/community',
    name: 'Community',
    component: () => import('@/views/common/Community.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/worker/task-hall',
    name: 'TaskHall',
    component: () => import('@/views/worker/MyTasks.vue'),
    meta: { requiresAuth: true, role: 1 }
  },
  {
    path: '/demo/search',
    name: 'SearchDemo',
    component: () => import('@/views/common/SearchDemo.vue')
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'tasks',
        name: 'AdminTasks',
        component: () => import('@/views/admin/Tasks.vue')
      },
      {
        path: 'types',
        name: 'AdminTypes',
        component: () => import('@/views/admin/Types.vue')
      }
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
