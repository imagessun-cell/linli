<template>
  <div class="task-detail-page">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">←</button>
      <span class="header-label">岗位详情</span>
    </header>

    <div class="hero-section" v-if="task">
      <div class="hero-type">
        <span v-if="task.subTypeIcon" :class="['sub-type-tag', getSubTypeClass(task.subType)]">{{ task.subTypeIcon }} {{ task.subTypeName }}</span>
        <span v-else-if="task.typeName === '陪诊'" class="sub-type-tag tag-escort">🪑 门诊陪护</span>
        <span v-else class="hero-type-plain">{{ task.typeIcon }} {{ task.typeName }}</span>
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
          <div class="map-container-small">
            <div id="task-detail-map" class="map-small"></div>
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
import { ref, computed, onMounted, nextTick } from 'vue'
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

const getSubTypeClass = (subType) => {
  const classMap = {
    1: 'tag-accompany',
    2: 'tag-pharmacy',
    3: 'tag-escort',
    4: 'tag-consult'
  }
  return classMap[subType] || ''
}

const initTaskMap = () => {
  const checkAndInit = () => {
    console.log('checkAndInit called', { BMapGL: typeof BMapGL })
    if (typeof BMapGL === 'undefined') {
      console.log('BMapGL not loaded yet')
      setTimeout(checkAndInit, 500)
      return
    }
    const mapContainer = document.getElementById('task-detail-map')
    console.log('mapContainer', !!mapContainer, 'task.value', !!task.value)
    if (!mapContainer || !task.value) {
      console.log('Missing container or task')
      return
    }
    console.log('Coordinates:', task.value.latitude, task.value.longitude)
    if (!task.value.latitude || !task.value.longitude) {
      console.log('Missing coordinates')
      return
    }
    try {
      const map = new BMapGL.Map('task-detail-map')
      console.log('Map created')
      const point = new BMapGL.Point(task.value.longitude, task.value.latitude)
      map.centerAndZoom(point, 16)
      map.enableScrollWheelZoom(false)
      map.addEventListener('tilesloaded', () => {
        console.log('Map tiles loaded')
      })
      const marker = new BMapGL.Marker(point)
      map.addOverlay(marker)
      console.log('Marker added')
    } catch (e) {
      console.error('Map error:', e)
    }
  }
  checkAndInit()
}

const loadTask = async () => {
  console.log('loadTask called, route.params.id:', route.params.id)
  try {
    const res = await request.get(`/task/public/${route.params.id}`)
    console.log('Task API response:', res)
    if (res.code === 0) {
      task.value = res.data
      console.log('Task loaded, task.value:', task.value, 'lat:', task.value?.latitude, 'lng:', task.value?.longitude)
      nextTick(() => initTaskMap())
    } else {
      error.value = res.message || '加载失败'
      console.log('Task load failed:', res.message)
    }
  } catch (e) {
    error.value = '加载失败'
    console.error('Task load error:', e)
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

.hero-type-plain {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-type-plain .type-icon {
  font-size: 24px;
}

.hero-type-plain .type-name {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
}

.sub-type-tag {
  display: inline-block;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
}

.sub-type-tag.tag-escort {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

.tag-accompany {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

.tag-pharmacy {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
}

.tag-consult {
  background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
}

.hero-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.hero-meta {
  display: flex;
  gap: 20px;
  font-size: 16px;
  color: #444;
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
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  margin-bottom: 4px;
}

.budget-value {
  font-size: 32px;
  font-weight: 900;
  color: #FF3300;
}

.physical-tag {
  padding: 10px 18px;
  font-size: 14px;
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
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #333;
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
  font-size: 20px;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px;
  color: #1a1a1a;
  line-height: 1.5;
}

.map-container-small {
  margin: 12px 0 12px 30px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: calc(100% - 30px);
  height: 160px;
}

.map-small {
  width: 100%;
  height: 100%;
  display: block;
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
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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