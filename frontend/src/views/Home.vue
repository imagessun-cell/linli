<template>
  <div class="home-container">
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索地址或关键词"
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <span class="search-icon">🔍</span>
        </template>
      </el-input>
      <el-button @click="showFilters = true" class="filter-btn">
        筛选
      </el-button>
    </div>

    <div class="sort-bar">
      <div class="sort-tabs">
        <span
          v-for="sort in sortOptions"
          :key="sort.value"
          :class="{ active: sortBy === sort.value }"
          @click="changeSort(sort.value)"
        >
          {{ sort.label }}
        </span>
      </div>
      <div class="view-toggle">
        <span :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">📋</span>
        <span :class="{ active: viewMode === 'map' }" @click="viewMode = 'map'">🗺️</span>
      </div>
    </div>

    <div class="content-area">
      <div v-if="viewMode === 'list'" class="task-list">
        <div v-if="loading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <div v-else-if="tasks.length === 0" class="empty">
          <span class="empty-icon">📭</span>
          <p>暂无附近岗位</p>
          <p class="tip">试试扩大搜索范围</p>
        </div>
        <div
          v-else
          v-for="task in tasks"
          :key="task.id"
          class="task-card"
          @click="goToDetail(task.id)"
        >
          <div class="task-header">
            <span class="task-type-icon">{{ task.typeIcon }}</span>
            <span class="task-type">{{ task.typeName }}</span>
            <span class="physical-badge" :style="{ background: task.physicalLevelColor }">
              {{ task.physicalLevelName }}
            </span>
          </div>
          <div class="task-title">{{ task.title }}</div>
          <div class="task-info">
            <span class="info-item">
              <span class="label">距离</span>
              <span class="value">{{ formatDistance(task.distance) }}</span>
            </span>
            <span class="info-item">
              <span class="label">时长</span>
              <span class="value">{{ task.duration }}分钟</span>
            </span>
            <span class="info-item">
              <span class="label">评分</span>
              <span class="value">⭐ {{ task.employerRating }}</span>
            </span>
          </div>
          <div class="task-footer">
            <span class="budget">¥{{ task.budget }}</span>
            <span class="employer">{{ task.employerNickname }}</span>
          </div>
          <div class="task-actions">
            <el-button
              v-if="userStore.isLoggedIn && userStore.userInfo?.role === 1"
              type="primary"
              size="small"
              @click.stop="grabTask(task.id)"
            >
              立即接单
            </el-button>
            <el-button
              v-else-if="!userStore.isLoggedIn"
              type="primary"
              size="small"
              @click.stop="goToLogin"
            >
              登录后接单
            </el-button>
            <el-button
              v-else
              size="small"
              @click.stop="goToDetail(task.id)"
            >
              查看详情
            </el-button>
          </div>
        </div>

        <div v-if="hasMore" class="load-more">
          <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
        </div>
      </div>

      <div v-else class="map-container">
        <div id="baidu-map" class="map"></div>
        <div v-if="selectedTask" class="map-info-window">
          <div class="info-header">
            <span class="info-type-icon">{{ selectedTask.typeIcon }}</span>
            <span class="info-type">{{ selectedTask.typeName }}</span>
          </div>
          <div class="info-title">{{ selectedTask.title }}</div>
          <div class="info-detail">
            <span>距离: {{ formatDistance(selectedTask.distance) }}</span>
            <span>报酬: ¥{{ selectedTask.budget }}</span>
          </div>
          <el-button type="primary" size="small" @click="goToDetail(selectedTask.id)">
            查看详情
          </el-button>
        </div>
      </div>
    </div>

    <el-drawer v-model="showFilters" title="筛选条件" size="80%">
      <div class="filter-section">
        <h4>任务类型</h4>
        <div class="filter-chips">
          <el-checkbox
            v-for="type in taskTypes"
            :key="type.value"
            v-model="selectedTypes"
            :label="type.value"
          >
            {{ type.icon }} {{ type.label }}
          </el-checkbox>
        </div>
      </div>
      <div class="filter-section">
        <h4>体力等级</h4>
        <div class="filter-chips">
          <el-checkbox
            v-for="level in physicalLevels"
            :key="level.value"
            v-model="selectedLevels"
            :label="level.value"
          >
            <span :style="{ color: level.color }">●</span> {{ level.label }}
          </el-checkbox>
        </div>
      </div>
      <div class="filter-section">
        <h4>距离范围</h4>
        <el-slider v-model="radius" :min="500" :max="10000" :step="500" show-stops :marks="radiusMarks" />
      </div>
      <template #footer>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="primary" @click="applyFilters">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()

const tasks = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(true)

const searchKeyword = ref('')
const sortBy = ref('distance')
const viewMode = ref('list')
const showFilters = ref(false)
const selectedTypes = ref([])
const selectedLevels = ref([])
const radius = ref(5000)
const selectedTask = ref(null)

let map = null
let markers = []
let userLocation = { lat: 31.230416, lng: 121.473701 }

const sortOptions = [
  { label: '距离最近', value: 'distance' },
  { label: '报酬最高', value: 'budget' },
  { label: '体力最轻', value: 'physicalLevel' }
]

const taskTypes = [
  { label: '陪诊', icon: '🩺', value: 1 },
  { label: '陪聊', icon: '💬', value: 2 },
  { label: '保洁', icon: '🧹', value: 3 },
  { label: '做饭', icon: '🍳', value: 4 },
  { label: '接送', icon: '🚗', value: 5 },
  { label: '看护', icon: '👴', value: 6 },
  { label: '跑腿', icon: '📦', value: 7 },
  { label: '助教', icon: '📚', value: 8 }
]

const physicalLevels = [
  { label: '轻度', value: 1, color: '#52c41a' },
  { label: '中度', value: 2, color: '#faad14' }
]

const radiusMarks = {
  500: '500m',
  2000: '2km',
  5000: '5km',
  10000: '10km'
}

const getUserLocation = () => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          try {
            const res = await request.get('/location/convert', { lat, lng })
            if (res.code === 0) {
              userLocation = { lat: res.data.lat, lng: res.data.lng }
            } else {
              userLocation = { lat, lng }
            }
          } catch {
            userLocation = { lat, lng }
          }
          resolve()
        },
        () => {
          resolve()
        }
      )
    } else {
      resolve()
    }
  })
}

const loadTasks = async (reset = false) => {
  if (reset) {
    page.value = 1
    tasks.value = []
    hasMore.value = true
  }

  if (!hasMore.value && !reset) return

  loading.value = reset || page.value === 1
  loadingMore.value = !reset && page.value > 1

  try {
    const params = {
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      radius: radius.value,
      page: page.value,
      pageSize: 10,
      sortBy: sortBy.value
    }

    if (selectedTypes.value.length > 0) {
      params.type = selectedTypes.value.join(',')
    }
    if (selectedLevels.value.length > 0) {
      params.physicalLevel = selectedLevels.value.join(',')
    }

    const res = await request.get('/task/nearby', { params })

    if (res.code === 0) {
      if (reset) {
        tasks.value = res.data.list
      } else {
        tasks.value = [...tasks.value, ...res.data.list]
      }
      hasMore.value = res.data.hasMore
      page.value++
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  loadTasks(false)
}

const changeSort = (sort) => {
  sortBy.value = sort
  loadTasks(true)
  if (viewMode.value === 'map') {
    nextTick(() => initMap())
  }
}

const applyFilters = () => {
  showFilters.value = false
  loadTasks(true)
}

const resetFilters = () => {
  selectedTypes.value = []
  selectedLevels.value = []
  radius.value = 5000
}

const handleSearch = () => {
  loadTasks(true)
}

const formatDistance = (distance) => {
  if (!distance) return '未知'
  if (distance < 1000) return `${distance}m`
  return `${(distance / 1000).toFixed(1)}km`
}

const goToDetail = (id) => {
  router.push(`/task/${id}`)
}

const goToLogin = () => {
  router.push('/login')
}

const grabTask = async (taskId) => {
  try {
    const res = await request.post(`/tasks/${taskId}/grab`)
    if (res.code === 0) {
      ElMessage.success('接单成功')
      loadTasks(true)
    } else {
      ElMessage.error(res.message || '接单失败')
    }
  } catch (e) {
    ElMessage.error('接单失败')
  }
}

const initMap = () => {
  if (typeof BMapGL === 'undefined') {
    setTimeout(initMap, 500)
    return
  }

  const mapContainer = document.getElementById('baidu-map')
  if (!mapContainer) return

  map = new BMapGL.Map('baidu-map')
  const point = new BMapGL.Point(userLocation.lng, userLocation.lat)
  map.centerAndZoom(point, 13)
  map.enableScrollWheelZoom(true)

  markers.forEach(m => map.removeOverlay(m))
  markers = []

  tasks.value.forEach(task => {
    const marker = new BMapGL.Marker(
      new BMapGL.Point(task.longitude, task.latitude)
    )
    marker.addEventListener('click', () => {
      selectedTask.value = task
    })
    map.addOverlay(marker)
    markers.push(marker)
  })
}

onMounted(async () => {
  await getUserLocation()
  await loadTasks(true)
})

onUnmounted(() => {
  if (map) {
    map = null
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.search-bar {
  display: flex;
  padding: 12px 16px;
  background: #fff;
  gap: 10px;
}

.search-input {
  flex: 1;
}

.filter-btn {
  background: #f0f0f0;
  border: none;
}

.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.sort-tabs {
  display: flex;
  gap: 16px;
}

.sort-tabs span {
  color: #666;
  font-size: 14px;
  cursor: pointer;
}

.sort-tabs span.active {
  color: #1890ff;
  font-weight: bold;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.view-toggle span {
  font-size: 18px;
  cursor: pointer;
  opacity: 0.5;
}

.view-toggle span.active {
  opacity: 1;
}

.content-area {
  padding: 12px 16px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty .tip {
  font-size: 12px;
  color: #ccc;
}

.task-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.task-type-icon {
  font-size: 20px;
}

.task-type {
  font-size: 14px;
  color: #333;
}

.physical-badge {
  font-size: 12px;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

.task-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.task-info {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  gap: 4px;
  font-size: 13px;
}

.info-item .label {
  color: #999;
}

.info-item .value {
  color: #666;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.budget {
  font-size: 20px;
  font-weight: bold;
  color: #ff6b00;
}

.employer {
  font-size: 13px;
  color: #999;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.map-container {
  position: relative;
  height: calc(100vh - 200px);
}

.map {
  width: 100%;
  height: 100%;
}

.map-info-window {
  position: absolute;
  bottom: 20px;
  left: 16px;
  right: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-type-icon {
  font-size: 24px;
}

.info-type {
  font-size: 16px;
  font-weight: bold;
}

.info-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.info-detail {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>