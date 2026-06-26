import axios from 'axios'
import { createDemoRequest, isDemoMode } from './demo'

if (isDemoMode) {
  console.info('[Linli] demo API mode enabled')
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('linli_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('linli_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default isDemoMode ? createDemoRequest() : request
