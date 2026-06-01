<template>
  <div class="home-container">
    <header class="home-header">
      <h1>LINLI</h1>
      <h2 class="header-tagline">邻里互助，老有所为</h2>
    </header>

    <div class="search-bar" role="search">
      <label for="search-input" class="sr-only">搜索任务</label>
      <input
        id="search-input"
        v-model="searchKeyword"
        placeholder="搜索地址或关键词"
        class="search-input"
        type="search"
        @keyup.enter="handleSearch"
      />
      <button class="filter-btn" @click="showFilters = true" aria-label="打开筛选">筛选</button>
    </div>

    <div class="sort-bar">
      <div class="sort-tabs" role="tablist" aria-label="排序方式">
        <button
          v-for="sort in sortOptions"
          :key="sort.value"
          role="tab"
          :aria-selected="sortBy === sort.value"
          :class="{ active: sortBy === sort.value }"
          @click="changeSort(sort.value)"
        >
          {{ sort.label }}
        </button>
      </div>
      <div class="view-toggle" role="group" aria-label="视图切换">
        <button
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
          :aria-pressed="viewMode === 'list'"
          aria-label="列表视图"
        >▤</button>
        <button
          :class="{ active: viewMode === 'map' }"
          @click="viewMode = 'map'"
          :aria-pressed="viewMode === 'map'"
          aria-label="地图视图"
        >▥</button>
      </div>
    </div>

    <main class="content-area" role="main" id="main-content">
      <div v-if="viewMode === 'list'" class="task-list">
        <div v-if="loading" class="loading" aria-live="polite">
          <span>加载中，请稍候...</span>
        </div>
        <div v-else-if="tasks.length === 0" class="empty">
          <span class="empty-icon" aria-hidden="true">—</span>
          <p>暂无附近岗位</p>
          <p class="tip">试试扩大搜索范围</p>
        </div>
        <div
          v-else
          v-for="task in tasks"
          :key="task.id"
          class="task-card"
          role="article"
          @click="goToDetail(task.id)"
          @keydown.enter="goToDetail(task.id)"
          tabindex="0"
        >
          <div class="task-main">
            <div class="task-type" aria-label="任务类型">{{ task.typeIcon }} {{ task.typeName }}</div>
            <h3 class="task-title">{{ task.title }}</h3>
            <div class="task-meta">
              <span>{{ formatDistance(task.distance) }}</span>
              <span>{{ task.duration }}分钟</span>
              <span>⭐ {{ task.employerRating }}</span>
            </div>
          </div>
          <div class="task-side">
            <div class="task-budget" aria-label="报酬">¥{{ task.budget }}</div>
           
          </div>
        </div>

        <div v-if="hasMore" class="load-more">
          <button @click="loadMore" :disabled="loadingMore" aria-busy="loadingMore">
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </div>

      <div v-else class="map-container" role="region" aria-label="地图视图">
        <div id="baidu-map" class="map" aria-label="任务分布地图"></div>
        <div v-if="selectedTask" class="map-info-window" role="dialog" aria-labelledby="map-task-title">
          <div id="map-task-title" class="info-type">{{ selectedTask.typeIcon }} {{ selectedTask.typeName }}</div>
          <div class="info-title">{{ selectedTask.title }}</div>
          <div class="info-detail">
            <span>{{ formatDistance(selectedTask.distance) }}</span>
            <span>¥{{ selectedTask.budget }}</span>
          </div>
          <button @click="goToDetail(selectedTask.id)">查看详情</button>
        </div>
      </div>
    </main>

    <div
      v-if="showFilters"
      class="filter-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-title"
    >
      <div class="drawer-header">
        <h2 id="filter-title">筛选条件</h2>
        <button class="close-btn" @click="showFilters = false" aria-label="关闭筛选">×</button>
      </div>
      <div class="filter-section">
        <h3>任务类型</h3>
        <div class="filter-chips">
          <label v-for="type in taskTypes" :key="type.value" class="chip">
            <input type="checkbox" v-model="selectedTypes" :value="type.value" />
            <span>{{ type.icon }} {{ type.label }}</span>
          </label>
        </div>
      </div>
      <div class="filter-section">
        <h3>体力等级</h3>
        <div class="filter-chips">
          <label v-for="level in physicalLevels" :key="level.value" class="chip">
            <input type="checkbox" v-model="selectedLevels" :value="level.value" />
            <span :style="{ color: level.color }">{{ level.label }}</span>
          </label>
        </div>
      </div>
      <div class="drawer-footer">
        <button @click="resetFilters">重置</button>
        <button class="primary" @click="applyFilters">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
const radius = ref(5000000)
const selectedTask = ref(null)

const sortOptions = [
  { label: '距离', value: 'distance' },
  { label: '报酬', value: 'budget' },
  { label: '体力', value: 'physicalLevel' }
]

const taskTypes = [
  { label: '陪诊', icon: '＋', value: 1 },
  { label: '陪聊', icon: '＋', value: 2 },
  { label: '保洁', icon: '＋', value: 3 },
  { label: '做饭', icon: '＋', value: 4 },
  { label: '接送', icon: '＋', value: 5 },
  { label: '看护', icon: '＋', value: 6 },
  { label: '跑腿', icon: '＋', value: 7 },
  { label: '助教', icon: '＋', value: 8 }
]

const physicalLevels = [
  { label: '轻度', value: 1, color: '#52c41a' },
  { label: '中度', value: 2, color: '#faad14' }
]

let map = null
let markers = []
let userLocation = { lat: 31.230416, lng: 121.473701 }

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
  radius.value = 5000000
}

const handleSearch = () => {
  loadTasks(true)
}

const formatDistance = (distance) => {
  if (!distance) return '—'
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

watch(viewMode, (newMode) => {
  if (newMode === 'map') {
    nextTick(() => initMap())
  }
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
  background: var(--bg-primary);
  padding-bottom: 100px;
}

.home-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-md);
  border-bottom: var(--border);
  gap: var(--spacing-sm);
}

.home-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  letter-spacing: -0.03em;
}

.header-tagline {
  font-size: var(--font-size-base);
  font-weight: 400;
  font-style: italic;
  color: var(--text-muted);
  margin: 0;
}

.search-bar {
  display: flex;
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
  border-bottom: var(--border-light);
}

.search-input {
  flex: 1;
  padding: var(--spacing-xs);
  font-size: var(--font-size-base);
  border: var(--border-medium);
  outline: none;
  min-height: var(--touch-target-min);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.filter-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-transform: uppercase;
  background: var(--bg-primary) !important;
  border: var(--border) !important;
  cursor: pointer;
  min-width: 80px;
  min-height: var(--touch-target-min);
}

.filter-btn:hover {
  background: var(--text-primary) !important;
  color: var(--bg-primary) !important;
}

.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
}

.sort-tabs {
  display: flex;
  gap: 0;
}

.sort-tabs button {
  padding: var(--spacing-sm) var(--spacing-sm);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-transform: uppercase;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  min-height: var(--touch-target-min);
  position: relative;
}

.sort-tabs button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.sort-tabs button.active {
  color: var(--text-primary);
}

.sort-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--spacing-md);
  right: var(--spacing-md);
  height: 3px;
  background: var(--accent);
}

.view-toggle {
  display: flex;
  gap: var(--spacing-xs);
}

.view-toggle button {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  font-size: var(--font-size-lg);
  background: var(--bg-primary);
  border: var(--border-medium) !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-toggle button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.view-toggle button.active {
  background: var(--text-primary);
  color: var(--bg-primary);
}

.content-area {
  padding: 0;
}

.loading, .empty {
  text-align: center;
  padding: var(--spacing-2xl) 0;
  color: var(--text-muted);
}

.loading {
  font-size: var(--font-size-lg);
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.3;
}

.empty p {
  font-size: var(--font-size-lg);
  margin: 0;
}

.empty .tip {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin-top: var(--spacing-sm);
}

.task-card {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-md);
  border-bottom: var(--border-light);
  cursor: pointer;
  min-height: 100px;
}

.task-card:hover {
  background: var(--bg-secondary);
}

.task-card:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.task-main {
  flex: 1;
}

.task-type {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.task-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

.task-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

.task-budget {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--danger);
}

.grab-btn, .login-btn, .detail-btn {
  padding: var(--spacing-xs) var(--spacing-xs);
  font-size: var(--font-size-base);
  font-weight: 700;
  text-transform: uppercase;
  background: var(--text-primary);
  color: var(--bg-primary);
  border: var(--border) !important;
  cursor: pointer;
  min-width: 80px;
  min-height: 44px;
}

.grab-btn:hover, .login-btn:hover {
  background: var(--accent);
  border-color: var(--accent) !important;
}

.detail-btn {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.detail-btn:hover {
  background: var(--bg-secondary);
}

.load-more {
  padding: var(--spacing-lg) var(--spacing-md);
  text-align: center;
}

.load-more button {
  padding: var(--spacing-md) var(--spacing-2xl);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-transform: uppercase;
  background: var(--bg-primary);
  border: var(--border) !important;
  cursor: pointer;
  min-width: 200px;
  min-height: var(--touch-target-min);
}

.load-more button:hover:not(:disabled) {
  background: var(--text-primary);
  color: var(--bg-primary);
}

.load-more button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  bottom: var(--spacing-lg);
  left: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--bg-primary);
  border: var(--border);
  padding: var(--spacing-lg);
}

.info-type {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
}

.info-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.info-detail {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.map-info-window button {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 700;
  text-transform: uppercase;
  background: var(--text-primary);
  color: var(--bg-primary);
  border: var(--border) !important;
  cursor: pointer;
  min-height: var(--touch-target-min);
}

.map-info-window button:hover {
  background: var(--accent);
  border-color: var(--accent) !important;
}

.filter-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 90%;
  max-width: 400px;
  background: var(--bg-primary);
  border-left: var(--border);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-md);
  border-bottom: var(--border);
}

.drawer-header h2 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;
}

.close-btn {
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  font-size: var(--font-size-2xl);
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.close-btn:hover {
  background: var(--bg-secondary);
}

.close-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.filter-section {
  padding: var(--spacing-lg) var(--spacing-md);
  border-bottom: var(--border-light);
}

.filter-section h3 {
  font-size: var(--font-size-base);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-md);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  border: var(--border-medium);
  cursor: pointer;
  min-height: 44px;
}

.chip:has(input:checked) {
  background: var(--text-primary);
  color: var(--bg-primary);
}

.chip input {
  display: none;
}

.drawer-footer {
  margin-top: auto;
  padding: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
  border-top: var(--border);
}

.drawer-footer button {
  flex: 1;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 700;
  text-transform: uppercase;
  background: var(--bg-primary);
  border: var(--border) !important;
  cursor: pointer;
  min-height: var(--touch-target-min);
}

.drawer-footer button.primary {
  background: var(--text-primary);
  color: var(--bg-primary);
}

.drawer-footer button:hover {
  background: var(--bg-secondary);
}

.drawer-footer button.primary:hover {
  background: var(--accent);
  border-color: var(--accent) !important;
}
</style>
