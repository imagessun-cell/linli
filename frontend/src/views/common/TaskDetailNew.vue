<template>
  <div class="task-detail-page">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">←</button>
      <span class="header-label">岗位详情</span>
    </header>

    <div class="hero-section" v-if="task">
      <div class="hero-type">
        <span class="type-icon">{{ task.typeIcon }}</span>
        <span class="type-name">{{ task.typeName }}</span>
      </div>
      <h1 class="hero-title">{{ task.title }}</h1>
      <div class="hero-meta">
        <span>{{ formatDistance(task.distance) }}</span>
        <span>{{ task.duration }}分钟</span>
        <span>⭐ {{ task.employerRating }}</span>
      </div>
    </div>

    <div class="main-content" v-if="task">
      <div class="budget-card">
        <div class="budget-info">
          <span class="budget-label">服务报酬</span>
          <span class="budget-value">¥{{ task.budget }}</span>
        </div>
        <div class="physical-tag">{{ task.physicalLevelName }}</div>
      </div>

      <div class="section">
        <h3 class="section-title">服务信息</h3>
        <div class="info-list">
          <div class="info-row">
            <span class="info-icon">📍</span>
            <div class="info-content">
              <span class="info-label">服务地址</span>
              <span class="info-value">{{ task.address }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🗓️</span>
            <div class="info-content">
              <span class="info-label">服务时间</span>
              <span class="info-value">{{ formatDateTime(task.startTime) }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">⏳</span>
            <div class="info-content">
              <span class="info-label">预计时长</span>
              <span class="info-value">{{ task.duration }}分钟</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">💪</span>
            <div class="info-content">
              <span class="info-label">体力要求</span>
              <span class="info-value">{{ task.physicalLevelName }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section" v-if="task.specialRequirements">
        <h3 class="section-title">特殊要求</h3>
        <p class="special-requirements">{{ task.specialRequirements }}</p>
      </div>

      <div class="section contact-section">
        <h3 class="section-title">联系信息</h3>
        <div class="publisher-card">
          <img :src="task.employerAvatar || '/default-avatar.png'" class="publisher-avatar" />
          <div class="publisher-info">
            <span class="publisher-name">{{ task.employerNickname }}</span>
            <span class="publisher-rating">⭐ {{ task.employerRating || 5.0 }}</span>
          </div>
        </div>
        <div class="contact-actions">
          <button class="contact-btn" @click="handleContact" :disabled="loading">
            📞 联系雇主
          </button>
          <button
            class="grab-btn"
            @click="handleGrab"
            :disabled="!canGrab || grabLoading"
          >
            {{ grabLoading ? '接单中...' : '立即接单' }}
          </button>
        </div>
      </div>
    </div>

    <div class="loading-state" v-if="!task && !error">
      <span>加载中...</span>
    </div>

    <div class="error-state" v-if="error">
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const task = ref(null)
const loading = ref(false)
const grabLoading = ref(false)
const error = ref(null)

const canGrab = computed(() => {
  return task.value && task.value.status === 0
})

const formatDistance = (distance) => {
  if (!distance) return '未知'
  if (distance < 1000) return `${distance}m`
  return `${(distance / 1000).toFixed(1)}km`
}

const formatDateTime = (str) => {
  if (!str) return ''
  const d = new Date(str)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadTask = async () => {
  try {
    const res = await request.get(`/task/public/${route.params.id}`)
    if (res.code === 0) {
      task.value = res.data
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (e) {
    error.value = '加载失败'
  }
}

const handleContact = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push(`/common/chat/${task.value.employerId}`)
}

const handleGrab = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (userStore.userInfo?.role !== 1) {
    ElMessage.warning('请切换为陪诊师身份接单')
    return
  }
  grabLoading.value = true
  try {
    const res = await request.post(`/task/${route.params.id}/grab`)
    if (res.code === 0) {
      ElMessage.success('接单成功')
      router.push('/worker/my-tasks')
    } else {
      ElMessage.error(res.message || '接单失败')
    }
  } catch (e) {
    ElMessage.error('接单失败')
  } finally {
    grabLoading.value = false
  }
}

onMounted(() => {
  loadTask()
})
</script>

<style scoped>
.task-detail-page {
  min-height: 100vh;
  background: #FFFFFF;
  padding-bottom: 80px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #000;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: none;
  border: 1px solid #000;
  cursor: pointer;
}

.back-btn:hover {
  background: #000;
  color: #fff;
}

.header-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
}

.hero-section {
  padding: 32px 20px;
  border-bottom: 1px solid #E0E0E0;
}

.hero-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.type-icon {
  font-size: 24px;
}

.type-name {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
}

.hero-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.hero-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #666;
}

.main-content {
  padding: 0;
}

.budget-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 20px;
  border-bottom: 1px solid #E0E0E0;
}

.budget-info {
  display: flex;
  flex-direction: column;
}

.budget-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  margin-bottom: 4px;
}

.budget-value {
  font-size: 36px;
  font-weight: 900;
  color: #FF3300;
}

.physical-tag {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid #000;
}

.section {
  padding: 24px 20px;
  border-bottom: 1px solid #E0E0E0;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  margin-bottom: 20px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-icon {
  font-size: 18px;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #999;
  margin-bottom: 4px;
}

.info-value {
  font-size: 15px;
  color: #000;
}

.special-requirements {
  margin: 0;
  padding: 16px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  border: 1px solid #E0E0E0;
}

.publisher-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.publisher-avatar {
  width: 56px;
  height: 56px;
  border: 2px solid #000;
  object-fit: cover;
}

.publisher-info {
  display: flex;
  flex-direction: column;
}

.publisher-name {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.publisher-rating {
  font-size: 13px;
  color: #666;
}

.contact-actions {
  display: flex;
  gap: 12px;
}

.contact-btn, .grab-btn {
  flex: 1;
  padding: 16px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #fff;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.15s;
}

.contact-btn:hover:not(:disabled), .grab-btn:hover:not(:disabled) {
  background: #0066FF;
  border-color: #0066FF;
  color: #fff;
}

.grab-btn {
  background: #000;
  color: #fff;
}

.grab-btn:hover:not(:disabled) {
  background: #FF3300;
  border-color: #FF3300;
}

.contact-btn:disabled, .grab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: 14px;
  color: #666;
}
</style>