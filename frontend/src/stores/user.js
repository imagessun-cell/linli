import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('linli_token') || '')
  const userInfo = ref(null)
  const role = ref(1)

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