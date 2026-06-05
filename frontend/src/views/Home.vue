<template>
  <div class="home-container">
    <header class="home-header">
      <h1>LINLI</h1>
      <h2 class="header-tagline">邻里守候，就诊无忧</h2>
    </header>

    <div class="search-bar" role="search">
      <label for="search-input" class="sr-only">搜索任务</label>
      <div class="search-input-wrapper">
        <input
          id="search-input"
          v-model="searchKeyword"
          placeholder="搜索地址或关键词"
          class="search-input"
          type="search"
          autocomplete="off"
          @input="onSearchInput"
          @focus="onSearchFocus"
          @blur="hideSuggestionsLater"
          @keyup.enter="handleSearch"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.esc="showSuggestions = false"
        />
        <ul v-if="showSuggestions && (suggestions.length > 0 || hotKeywords.length > 0)" class="suggestion-list" role="listbox">
          <li v-if="suggestions.length > 0" class="suggestion-section">相关地址</li>
          <li
            v-for="(s, idx) in suggestions"
            :key="'s-' + idx"
            class="suggestion-item"
            :class="{ active: highlightIndex === idx }"
            role="option"
            :aria-selected="highlightIndex === idx"
            @mousedown.prevent="selectSuggestion(s)"
          >
            <span class="suggestion-icon">{{ suggestionIcon(s.type) }}</span>
            <span v-html="highlightKeyword(s.text, searchKeyword)"></span>
          </li>
          <li v-if="hotKeywords.length > 0 && !searchKeyword" class="suggestion-section">热门关键词</li>
          <li
            v-for="(kw, idx) in hotKeywords"
            v-if="!searchKeyword"
            :key="'h-' + idx"
            class="suggestion-item hot"
            :class="{ active: highlightIndex === suggestions.length + idx }"
            role="option"
            :aria-selected="highlightIndex === suggestions.length + idx"
            @mousedown.prevent="selectSuggestion({ text: kw })"
          >
            <span class="suggestion-icon">🔥</span>
            <span>{{ kw }}</span>
          </li>
        </ul>
      </div>
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
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor"/>
            <circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </button>
        <button
          :class="{ active: viewMode === 'map' }"
          @click="viewMode = 'map'"
          :aria-pressed="viewMode === 'map'"
          aria-label="地图视图"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor"/>
            <circle cx="12" cy="9" r="2.5" stroke="currentColor"/>
          </svg>
        </button>
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
            <span class="task-type" aria-label="任务类型">
              <span v-if="task.subTypeIcon" :class="['sub-type-tag', getSubTypeClass(task.subType)]">{{ task.subTypeIcon }} {{ task.subTypeName }}</span>
              <span v-else>{{ task.typeIcon }} {{ task.typeName }}</span>
            </span>
            <h3 class="task-title">{{ task.title }}</h3>
            <div class="task-meta">
              <span>{{ formatDistance(task.distance) }}</span>
              <span>{{ task.duration }}分钟</span>
              <span>💪 {{ task.employerRating }}</span>
              <span class="poster-info">
              <i v-if="task.employerAvatar" class="avatar-small">
                <img :src="task.employerAvatar" :alt="task.employerName + '的头像'" @error="handleAvatarError($event, task.employerName)" />
              </i>
              <i v-else class="avatar-small avatar-placeholder">
                {{ (task.employerName || '就').charAt(0) }}
              </i>
              <span class="employer-name">{{ task.employerName || '就诊人' }}</span>
              </span>


            </div>
          </div>
          <div class="task-side">
            <div class="task-budget" aria-label="报酬">¥{{ task.budget }}</div>
          </div>


            <div class="task-header">
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

        <!-- 我的位置浮标：右下角，距 global-tab-bar 20px -->
        <button
          :class="['map-locate-btn', { spinning: locating }]"
          @click="relocate"
          :disabled="locating"
          :aria-label="locating ? '正在定位' : '回到我的位置'"
          :title="locating ? '正在定位…' : '回到我的位置'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" stroke="currentColor"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor"/>
            <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-dasharray="2 3"/>
          </svg>
          <span class="map-locate-btn__label">{{ locating ? '定位中…' : '我的位置' }}</span>
        </button>

        <div v-if="selectedTask" class="map-info-window" role="dialog" aria-labelledby="map-task-title">
          <div class="info-header">
            <div v-if="selectedTask.employerAvatar" class="avatar-small">
              <img :src="selectedTask.employerAvatar" :alt="selectedTask.employerName + '的头像'" @error="handleMapAvatarError($event, selectedTask.employerName)" />
            </div>
            <div v-else class="avatar-small avatar-placeholder">
              {{ (selectedTask.employerName || '就').charAt(0) }}
            </div>
            <span class="employer-name">{{ selectedTask.employerName || '就诊人' }}</span>
          </div>
          <div id="map-task-title" class="info-type">
            <span v-if="selectedTask.subTypeIcon" class="sub-type-tag">{{ selectedTask.subTypeIcon }} {{ selectedTask.subTypeName }}</span>
            <span v-else-if="selectedTask.typeName === '陪诊'" class="sub-type-tag tag-escort">🪑 门诊陪护</span>
            <span v-else>{{ selectedTask.typeIcon }} {{ selectedTask.typeName }}</span>
          </div>
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
const suggestions = ref([])
const hotKeywords = ref([])
const showSuggestions = ref(false)
const highlightIndex = ref(-1)
const sortBy = ref('distance')
const viewMode = ref('list')
const showFilters = ref(false)
const selectedTypes = ref([])
const selectedLevels = ref([])
const radius = ref(50000)
const selectedTask = ref(null)
// 默认位置：北京·朝阳区（BD09 坐标），GPS 获取失败时回退到此
const userLocation = ref({ lat: 39.929, lng: 116.494 })

const sortOptions = [
  { label: '距离', value: 'distance' },
  { label: '报酬', value: 'budget' },
  { label: '体力', value: 'physicalLevel' }
]

const taskTypes = [
  { label: '全程陪同', icon: '👣', value: 1 },
  { label: '挂号取药', icon: '💊', value: 2 },
  { label: '门诊陪护', icon: '🪑', value: 3 },
  { label: '代为问诊', icon: '📝', value: 4 }
]

const physicalLevels = [
  { label: '轻度', value: 1, color: '#52c41a' },
  { label: '中度', value: 2, color: '#faad14' },
  { label: '重度', value: 3, color: '#f5222d' }
]

let map = null
let markers = []
let userMarker = null
const locating = ref(false)

const getUserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(); return }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        let finalLat = lat, finalLng = lng
        try {
          const res = await request.get('/location/convert', { lat, lng })
          if (res.code === 0) {
            finalLat = res.data.lat
            finalLng = res.data.lng
          }
        } catch (e) {
          console.warn('[Home.vue] /location/convert failed, using raw GPS', e)
        }
        userLocation.value = { lat: finalLat, lng: finalLng }
        console.log('[Home.vue] userLocation updated →', userLocation.value)
        resolve()
      },
      (err) => {
        console.warn('[Home.vue] geolocation failed:', err?.message)
        ElMessage?.warning?.('未获取到定位权限，列表将按默认位置展示')
        resolve()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  })
}

// 重新定位：重新获取 GPS 并刷新任务
const relocate = async () => {
  locating.value = true
  try {
    await getUserLocation()
    if (map) recenterMap()
    await loadTasks(true)
  } finally {
    locating.value = false
  }
}

// 地图以用户当前坐标为中心
const recenterMap = () => {
  if (!map) return
  const { lat, lng } = userLocation.value
  const point = new BMapGL.Point(lng, lat)
  map.centerAndZoom(point, 13)
  if (userMarker) {
    userMarker.setPosition(point)
  } else {
    userMarker = new BMapGL.Marker(point)
    map.addOverlay(userMarker)
  }
}

// 监听位置变化：自动重新加载任务列表
watch(userLocation, () => {
  if (map) recenterMap()
})

// 仅展示官方 4 种任务类型（sub_type 1-4）
const OFFICIAL_TASK_TYPES = new Set([1])
const filterOfficialTasks = (list) => {
  if (!Array.isArray(list)) return []
  return list.filter(t => OFFICIAL_TASK_TYPES.has(t.type) && t.subType && t.subType >= 1 && t.subType <= 4)
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
      latitude: userLocation.value.lat,
      longitude: userLocation.value.lng,
      radius: radius.value,
      page: page.value,
      pageSize: 10,
      sortBy: sortBy.value
    }

    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }

    if (selectedTypes.value.length > 0) {
      params.type = selectedTypes.value.join(',')
    }
    if (selectedLevels.value.length > 0) {
      params.physicalLevel = selectedLevels.value.join(',')
    }

    console.log('[Home.vue] loadTasks params:', params)
    const res = await request.get('/task/nearby', { params })
    console.log('[Home.vue] loadTasks response:', res.code, 'list length:', res.data?.list?.length)

    if (res.code === 0) {
      const filtered = filterOfficialTasks(res.data.list)
      if (reset) {
        tasks.value = filtered
      } else {
        tasks.value = [...tasks.value, ...filtered]
      }
      hasMore.value = res.data.hasMore
      page.value++
    } else {
      console.warn('[Home.vue] loadTasks non-zero code:', res)
    }
  } catch (e) {
    console.error('[Home.vue] loadTasks error:', e)
    ElMessage.error('加载失败：' + (e?.message || e))
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
  radius.value = 50000
}

let suggestTimer = null
const onSearchInput = () => {
  const q = searchKeyword.value.trim()
  highlightIndex.value = -1
  showSuggestions.value = true
  if (suggestTimer) clearTimeout(suggestTimer)
  if (!q) {
    suggestions.value = []
    return
  }
  suggestTimer = setTimeout(() => fetchSuggestions(q), 200)
}

const fetchSuggestions = async (q) => {
  try {
    const res = await request.get('/task/suggestions', { params: { q, limit: 8 } })
    if (res.code === 0) {
      suggestions.value = res.data.suggestions || []
      if (Array.isArray(res.data.hotKeywords)) {
        hotKeywords.value = res.data.hotKeywords
      }
      console.log('[Home.vue] fetchSuggestions q=', q, 'got', suggestions.value.length, 'suggestions,', hotKeywords.value.length, 'hot')
    }
  } catch (e) {
    console.warn('[Home.vue] fetchSuggestions error:', e)
  }
}

const onSearchFocus = () => {
  showSuggestions.value = true
  // 进入即拉一次，确保下拉至少有热门关键词
  if (suggestions.value.length === 0 && hotKeywords.value.length === 0) {
    fetchSuggestions('')
  }
}

const hideSuggestionsLater = () => {
  // 延迟关闭，保证 mousedown 触发 selectSuggestion
  setTimeout(() => { showSuggestions.value = false }, 150)
}

const moveHighlight = (delta) => {
  const total = suggestions.value.length + (searchKeyword.value ? 0 : hotKeywords.value.length)
  if (total === 0) return
  let next = highlightIndex.value + delta
  if (next < 0) next = total - 1
  if (next >= total) next = 0
  highlightIndex.value = next
}

const selectSuggestion = (s) => {
  if (!s || !s.text) return
  searchKeyword.value = s.text
  showSuggestions.value = false
  highlightIndex.value = -1
  loadTasks(true)
}

const highlightKeyword = (text, keyword) => {
  if (!keyword) return text
  const escaped = String(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, 'gi')
  return String(text).replace(re, (m) => `<mark>${m}</mark>`)
}

const suggestionIcon = (type) => {
  switch (type) {
    case 'type': return '🩺'
    case 'subType': return '💊'
    case 'requirement': return '📝'
    case 'keyword': return '🏥'
    case 'address':
    default: return '📍'
  }
}

const handleSearch = () => {
  showSuggestions.value = false
  loadTasks(true)
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

const handleAvatarError = (event, name) => {
  const img = event.target
  img.style.display = 'none'
  const wrapper = img.parentElement
  wrapper.classList.add('avatar-error')
  const placeholder = document.createElement('div')
  placeholder.className = 'avatar-small avatar-placeholder'
  placeholder.textContent = (name || '就').charAt(0)
  wrapper.appendChild(placeholder)
}

const handleMapAvatarError = (event, name) => {
  const img = event.target
  img.style.display = 'none'
  const wrapper = img.parentElement
  wrapper.classList.add('avatar-error')
  const placeholder = document.createElement('div')
  placeholder.className = 'avatar-small avatar-placeholder'
  placeholder.textContent = (name || '就').charAt(0)
  wrapper.appendChild(placeholder)
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
  const point = new BMapGL.Point(userLocation.value.lng, userLocation.value.lat)
  map.centerAndZoom(point, 13)
  map.enableScrollWheelZoom(true)

  // 我自己的位置标记
  if (userMarker) {
    userMarker.setPosition(point)
  } else {
    userMarker = new BMapGL.Marker(point)
    map.addOverlay(userMarker)
  }

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
  console.log('[Home.vue] onMounted start, default userLocation:', userLocation.value)
  await getUserLocation()
  console.log('[Home.vue] after getUserLocation, userLocation:', userLocation.value, 'radius:', radius.value, 'sortBy:', sortBy.value)
  await loadTasks(true)
  console.log('[Home.vue] after loadTasks, tasks length:', tasks.value.length, 'hasMore:', hasMore.value)
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
  position: sticky;
  top: 0;
  z-index: 51;
  background: var(--bg-primary);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  border: var(--border-light);
  outline: none;
  min-height: var(--touch-target-min);
  box-sizing: border-box;
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--transition-soft);
}

.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.suggestion-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  max-height: 360px;
  overflow-y: auto;
  z-index: 100;
  list-style: none;
  margin: 0;
  padding: var(--spacing-xs) 0;
}

.suggestion-section {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--bg-secondary);
  list-style: none;
  font-weight: 500;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: var(--touch-target-min);
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  transition: all 0.2s var(--transition-soft);
}

.suggestion-item:hover,
.suggestion-item.active {
  background: var(--accent-light);
}

.suggestion-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.suggestion-item :deep(mark) {
  background: transparent;
  color: var(--accent);
  font-weight: 600;
}

.filter-btn {
  padding: var(--spacing-xs) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--bg-primary) !important;
  border: var(--border-light) !important;
  cursor: pointer;
  min-width: 80px;
  min-height: var(--touch-target-min);
  border-radius: var(--border-radius) !important;
  color: var(--text-secondary) !important;
  transition: all 0.3s var(--transition-soft);
}

.filter-btn:hover {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
  background: var(--accent-light) !important;
}

.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
  background: var(--bg-tertiary);
  position: sticky;
  top: var(--search-bar-height, 72px);
  z-index: 50;
}

.sort-tabs {
  display: flex;
  gap: 4px;
  border-radius: var(--border-radius-sm);
}

.sort-tabs button {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  min-height: var(--touch-target-min);
  position: relative;
  transition: all 0.3s var(--transition-soft);
  border-radius: var(--border-radius-sm);
}

.sort-tabs button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.sort-tabs button.active {
  color: var(--accent) !important;
  font-weight: 600;
  background: var(--bg-primary);
  border-color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.view-toggle {
  display: flex;
  gap: var(--spacing-xs);
}

.view-toggle button {
  height: var(--touch-target-min);
  font-size: var(--font-size-lg);
  background: var(--bg-primary);
  border: var(--border-light) !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm) !important;
  transition: all 0.3s var(--transition-soft);
  color: var(--text-muted) !important;
}

.view-toggle button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.view-toggle button.active {
  background: var(--text-primary);
  color: var(--accent) !important;
}

/* locate-btn 浮标已迁移到地图上，view-toggle 不再需要旧样式 */

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.avatar-small {
  width: 22px ;
  height: 22px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-warm) 100%);
}

.avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-small.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.employer-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.task-card {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-md);
  border-bottom: var(--border-light);
  cursor: pointer;
  min-height: 100px;
  transition: all 0.3s var(--transition-soft);
  background: var(--bg-primary);
}

.task-card:hover {
  background: var(--bg-secondary);
}

.task-card:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.task-card:last-child {
  border-bottom: none;
}

.task-main {
  flex: 1;
}

.task-type {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.05em;
  padding-bottom: var(--spacing-xs);
  display: block;
}

.sub-type-tag {
  display: inline-block;
  color: white;
  padding: 4px 12px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--accent);
}

.main-type-tag {
  display: inline-block;
  color: white;
  padding: 4px 12px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--accent-soft);
  color: var(--text-primary);
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  .poster-info{
    display: grid;
    gap: 4px;
    grid-template-columns: 24px 6em;
  }
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
  height: calc(100vh - 264px);
}

.map {
  width: 100%;
  height: 100%;
}

/* global-tab-bar 高度见 App.vue 全局变量 --global-tab-bar-height */

/* 我的位置浮标：地图右下角，距 global-tab-bar 20px */
.map-locate-btn {
  position: absolute;
  right: var(--spacing-md);
  bottom: calc(var(--global-tab-bar-height) + 20px);
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: 22px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.25s var(--transition-soft);
}

.map-locate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.map-locate-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.map-locate-btn.spinning svg {
  animation: spin 1s linear infinite;
}

.map-locate-btn__label {
  white-space: nowrap;
}

/* 选中的地标卡片：底部贴齐"我的位置"按钮上方 */
.map-info-window {
  position: absolute;
  bottom: calc(var(--global-tab-bar-height) + 20px);
  left: var(--spacing-md);
  right: var(--spacing-md);
  z-index: 99;
  background: var(--bg-primary);
  border: var(--border);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.info-type {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
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
  bottom: 76px;
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
  border-bottom: var(--border-light);
}

.drawer-header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
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
  border-top: var(--border-light);
}

.drawer-footer button {
  flex: 1;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--bg-primary);
  border: var(--border-light) !important;
  cursor: pointer;
  min-height: var(--touch-target-min);
  border-radius: var(--border-radius) !important;
  transition: all 0.3s var(--transition-soft);
  color: var(--text-primary) !important;
}

.drawer-footer button.primary {
  background: var(--accent) !important;
  color: #FFFFFF !important;
  border-color: var(--accent) !important;
}

.drawer-footer button:hover {
  background: var(--bg-secondary) !important;
}

.drawer-footer button.primary:hover {
  background: var(--accent-hover) !important;
  border-color: var(--accent-hover) !important;
}
</style>
