import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'
import { isDemoMode } from '@/api/demo'

const demoAsset = (path) => `${import.meta.env.BASE_URL || '/'}${path.replace(/^\//, '')}`

const demoUserInfo = {
  id: 15,
  phone: '13900000001',
  nickname: '林阿姨',
  real_name: '林阿姨',
  age: 58,
  role: 2,
  avatar_url: demoAsset('/img/Avatar/KuaPai_AI_20260602114803.png'),
  community: '朝阳区花家地社区',
  worker: {
    age: 58,
    community: '朝阳区花家地社区',
    status: 1,
    total_orders: 38,
    completed_tasks: 38,
    service_hours: 124,
    avg_rating: 4.9,
    rating: 4.9,
    total_earnings: 2688,
    honor_level: '金牌邻里陪诊师'
  },
  employer: {
    age: 58,
    community: '朝阳区花家地社区',
    credit_score: 116,
    published_tasks: 7
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('linli_token') || (isDemoMode ? 'demo-token' : ''))
  const userInfo = ref(isDemoMode ? demoUserInfo : null)
  const role = ref(Number(localStorage.getItem('linli_role')) || (isDemoMode ? 2 : 1))

  if (isDemoMode && !localStorage.getItem('linli_token')) {
    localStorage.setItem('linli_token', 'demo-token')
  }

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('linli_token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    if (info.role) {
      role.value = info.role
      localStorage.setItem('linli_role', info.role)
    }
  }

  const login = async (phone, code) => {
    const res = await request.post('/auth/login', { phone, code })
    if (res.code === 0) {
      setToken(res.data.token)
      setUserInfo(res.data.user)
    }
    return res
  }

  const register = async (phone, password, role) => {
    const res = await request.post('/auth/register', { phone, password, role })
    if (res.code === 0) {
      setToken(res.data.token)
      setUserInfo(res.data.user)
    }
    return res
  }

  const fetchProfile = async () => {
    if (!token.value) return null
    const res = await request.get('/auth/profile')
    if (res.code === 0) {
      setUserInfo(res.data)
    }
    return res
  }

  const switchRole = async (newRole) => {
    const res = await request.put('/auth/switch-role', { role: newRole })
    if (res.code === 0) {
      setToken(res.data.token)
      role.value = res.data.role
      localStorage.setItem('linli_role', res.data.role)
    }
    return res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    role.value = 1
    localStorage.removeItem('linli_token')
    localStorage.removeItem('linli_role')
  }

  return {
    token,
    userInfo,
    role,
    isLoggedIn,
    setToken,
    setUserInfo,
    login,
    register,
    fetchProfile,
    switchRole,
    logout
  }
})
