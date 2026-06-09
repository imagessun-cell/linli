<template>
  <div class="home-container">
    <header class="home-header">
      <div class="header-brand">
        <h1>LINLI</h1>
        <h2 class="header-tagline">邻里守候，就诊无忧</h2>
      </div>
      <div class="header-actions">
        <button class="header-icon-btn" @click="toggleSearch" aria-label="搜索">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <button class="header-icon-btn filter-header-btn" @click="showFilters = true" aria-label="打开筛选">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
            <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="10" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="14" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </header>

    <div class="search-bar" role="search" :class="{ expanded: searchExpanded }">
      <div class="search-input-wrapper">
        <input
          id="search-input"
          v-model="searchKeyword"
          placeholder="搜索地址或关键词"
          class="search-input"
          type="text"
          autocomplete="off"
          @input="onSearchInput"
          @focus="onSearchFocus"
          @blur="hideSuggestionsLater"
          @keyup.enter="handleSearch"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.esc="closeSearch"
        />
        <button v-if="searchKeyword" class="search-clear-btn" @click="clearSearch" aria-label="清除搜索">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px; vertical-align: middle;">
            <path v-if="sortBy === sort.value && sortAsc" d="M12 19V5M5 12l7-7 7 7"/>
            <path v-else d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
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
              <span v-if="task.subTypeIcon" :class="[getSubTypeClass(task.subType)]">{{ task.subTypeIcon }} {{ task.subTypeName }}</span>
              <span v-else>{{ task.typeIcon }} {{ task.typeName }}</span>
            </span>
            <h3 class="task-title">{{ task.title }}</h3>
            <div class="task-meta">
              <span>距您 {{ formatDistance(task.distance) }} 米</span>
              <span>预计 {{ task.duration }} 分钟</span>
              <span>{{ task.physicalLevelName || '轻度' }}体力</span>
            </div>
          </div>
          <div class="task-side">
            <div class="task-budget" aria-label="报酬">{{ task.budget }}</div>
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

        <!-- 定位中脉冲动画 -->
        <div v-if="locating" class="locating-pulse"></div>

        <!-- 我的位置标记：脉冲动画点 -->
        <div
          v-show="!locating"
          class="user-location-dot"
          :class="{ 'has-accuracy': locationAccuracy > 0 }"
          :style="userLocationStyle"
          aria-label="我的位置"
          role="img"
        >
          <div class="dot-inner"></div>
          <div class="dot-ring"></div>
          <div class="dot-ring delay"></div>
        </div>

        <!-- 定位按钮：右下角，距 global-tab-bar 20px -->
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
        </button>

        <div v-if="selectedTask" class="map-info-window" role="dialog">
          <div class="info-header">
            <div v-if="selectedTask.employerAvatar" class="avatar-small">
              <img :src="selectedTask.employerAvatar" :alt="selectedTask.employerName + '的头像'" @error="handleMapAvatarError($event, selectedTask.employerName)" />
            </div>
            <div v-else class="avatar-small avatar-placeholder">
              {{ (selectedTask.employerName || '就').charAt(0) }}
            </div>
            <span class="employer-name">{{ selectedTask.employerName || '就诊人' }}</span>
            <button class="map-info-close" @click="selectedTask = null" aria-label="关闭">×</button>
          </div>
          <div class="info-type">
            <span v-if="selectedTask.subTypeIcon">{{ selectedTask.subTypeIcon }} {{ selectedTask.subTypeName }}</span>
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
const searchExpanded = ref(false)
const sortBy = ref('distance')
const sortAsc = ref(false)
const viewMode = ref('list')
const showFilters = ref(false)
const selectedTypes = ref([])
const selectedLevels = ref([])
const radius = ref(5000000)
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
let mapMoveHandler = null
let mapZoomHandler = null
const locating = ref(false)
const locationAccuracy = ref(0)
const userLocationStyle = ref({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' })

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
        console.warn('[Home.vue] geolocation failed:', err?.message, '→ 尝试IP定位')
        // 浏览器定位失败，尝试通过IP获取位置（不依赖浏览器权限）
        request.get('/location/ip').then(ipRes => {
          console.log('[Home.vue] IP定位结果:', ipRes)
          if (ipRes.code === 0 && ipRes.data) {
            userLocation.value = { lat: ipRes.data.lat, lng: ipRes.data.lng }
            if (map) {
              map.centerAndZoom(new window.BMapGL.Point(ipRes.data.lng, ipRes.data.lat), 13)
            }
          } else {
            userLocation.value = { lat: 39.929, lng: 116.494 }
            if (map) {
              map.centerAndZoom(new window.BMapGL.Point(116.494, 39.929), 14)
            }
          }
        }).catch(() => {
          userLocation.value = { lat: 39.929, lng: 116.494 }
          if (map) {
            map.centerAndZoom(new window.BMapGL.Point(116.494, 39.929), 14)
          }
        }).finally(() => resolve())
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  })
}

// 更新用户位置标记的屏幕像素位置
const updateUserLocationDot = () => {
  if (!map) return
  try {
    const pixel = map.pointToOverlayPixel(new window.BMapGL.Point(userLocation.value.lng, userLocation.value.lat))
    const mapContainer = document.getElementById('baidu-map')
    if (!mapContainer) return
    const containerRect = mapContainer.getBoundingClientRect()
    userLocationStyle.value = {
      left: `${pixel.x + containerRect.left}px`,
      top: `${pixel.y + containerRect.top}px`,
      transform: 'translate(-50%, -50%)'
    }
  } catch (e) {
    console.warn('[Home.vue] updateUserLocationDot failed:', e)
  }
}

// 重新定位：重新获取 GPS 并刷新任务
const relocate = async () => {
  locating.value = true
  try {
    await getUserLocation()
    if (map) {
      recenterMap()
      updateUserLocationDot()
    }
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
  updateUserLocationDot()
}

// 监听位置变化：自动重新加载任务列表
watch(userLocation, () => {
  if (map) recenterMap()
})

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
      const list = Array.isArray(res.data.list) ? res.data.list : []
      if (reset) {
        tasks.value = list
      } else {
        tasks.value = [...tasks.value, ...list]
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
  if (sortBy.value === sort) {
    sortAsc.value = !sortAsc.value
  } else {
    sortBy.value = sort
    sortAsc.value = true
  }
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

const toggleSearch = () => {
  searchExpanded.value = !searchExpanded.value
  if (searchExpanded.value) {
    nextTick(() => {
      document.getElementById('search-input')?.focus()
    })
  }
}

const closeSearch = () => {
  showSuggestions.value = false
  if (!searchKeyword.value.trim()) {
    searchExpanded.value = false
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  showSuggestions.value = false
  document.getElementById('search-input')?.focus()
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

// 根据 sort-bar 底部动态计算并设置地图容器高度
const updateMapContainerSize = () => {
  const mapEl = document.querySelector('.map-container')
  if (!mapEl) return
  const sortBar = document.querySelector('.sort-bar')
  if (!sortBar) return
  const rect = sortBar.getBoundingClientRect()
  mapEl.style.top = `${rect.bottom}px`
  // 通知百度地图尺寸变化
  if (map) setTimeout(() => map.reset(), 0)
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

  // 移除旧的事件监听
  if (mapMoveHandler) { map.removeEventListener('moveend', mapMoveHandler); mapMoveHandler = null }
  if (mapZoomHandler) { map.removeEventListener('zoomend', mapZoomHandler); mapZoomHandler = null }

  // 地图移动或缩放时，更新用户位置点的像素坐标
  mapMoveHandler = () => updateUserLocationDot()
  mapZoomHandler = () => updateUserLocationDot()
  map.addEventListener('moveend', mapMoveHandler)
  map.addEventListener('zoomend', mapZoomHandler)

  // 初始化用户位置标记
  nextTick(() => updateUserLocationDot())

  // 动态设置地图容器尺寸（适配 sort-bar 位置）
  nextTick(() => updateMapContainerSize())

  markers.forEach(m => map.removeOverlay(m))
  markers = []

  tasks.value.forEach(task => {
    const point = new BMapGL.Point(task.longitude, task.latitude)

    // 圆形头像 + 白色描边 + 投影
    const avatarHtml = task.employerAvatar
      ? `<img src="${task.employerAvatar}" style="width:36px;height:36px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);object-fit:cover;display:block;" onerror="this.style.display='none'" />`
      : `<div style="width:36px;height:36px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);background:#1677ff;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:600;">${(task.employerName || '就').charAt(0)}</div>`

    const label = new BMapGL.Label(avatarHtml, {
      position: point,
      offset: new BMapGL.Size(-18, -18)
    })
    label.setStyle({ border: 'none', background: 'transparent', padding: '0' })
    label.taskId = task.id

    label.addEventListener('click', () => {
      selectedTask.value = task
    })
    map.addOverlay(label)
    markers.push(label)
  })
}

onMounted(async () => {
  console.log('[Home.vue] onMounted start, default userLocation:', userLocation.value)
  await getUserLocation()
  console.log('[Home.vue] after getUserLocation, userLocation:', userLocation.value, 'radius:', radius.value, 'sortBy:', sortBy.value)
  await loadTasks(true)
  console.log('[Home.vue] after loadTasks, tasks length:', tasks.value.length, 'hasMore:', hasMore.value)
  // 如果默认是地图视图，初始化地图和位置标记
  if (viewMode.value === 'map') {
    nextTick(() => {
      initMap()
      updateUserLocationDot()
    })
  }

  // 窗口大小变化时重新计算地图尺寸
  window.addEventListener('resize', updateMapContainerSize)
})

watch(viewMode, (newMode) => {
  if (newMode === 'map') {
    nextTick(() => {
      initMap()
      updateMapContainerSize()
      // 如果已有GPS定位，立即居中
      if (userLocation.value.lat !== 39.929 || userLocation.value.lng !== 116.494) {
        recenterMap()
      }
    })
  }
})

onUnmounted(() => {
  if (map) {
    map = null
  }
  window.removeEventListener('resize', updateMapContainerSize)
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--bg-warm);
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-md);
  background: var(--accent);
  border-bottom: none;
}

.header-brand {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
  min-width: 0;
}

.home-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  flex-shrink: 0;
}

.header-tagline {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  cursor: pointer;
  border-radius: 50% !important;
  padding: 0 !important;
  min-height: unset !important;
  transition: all 0.2s var(--transition-soft);
}

.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}

.search-bar {
  max-height: 0;
  padding: 0 var(--spacing-md);
  border-bottom: none;
  background: var(--bg-primary);
  transition: all 0.3s var(--transition-spring);
}

.search-bar.expanded {
  max-height: 160px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) 36px var(--spacing-sm) var(--spacing-md);
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

.search-clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none !important;
  background: #e0e0e0 !important;
  color: #666 !important;
  cursor: pointer;
  border-radius: 50% !important;
  padding: 0 !important;
  min-height: unset !important;
  transition: all 0.2s var(--transition-soft);
}

.search-clear-btn:hover {
  background: #d0d0d0 !important;
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

.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 24px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 50;
}

.sort-tabs {
  display: flex;
  gap: 2px;
}

.sort-tabs button {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  border: none !important;
  color: var(--text-muted) !important;
  cursor: pointer;
  min-height: 32px;
  position: relative;
  transition: all 0.2s var(--transition-soft);
  border-radius: var(--border-radius-sm) !important;
}

.sort-tabs button.active {
  color: var(--accent) !important;
  font-weight: 600;
  background: var(--accent-light);
}

.view-toggle {
  display: flex;
  gap: 2px;
}

.view-toggle button {
  height: 32px;
  width: 32px;
  font-size: var(--font-size-sm);
  background: transparent;
  border: none !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm) !important;
  transition: all 0.2s var(--transition-soft);
  color: var(--text-muted) !important;
  padding: 0 !important;
  min-height: unset !important;
}

.view-toggle button.active {
  background: var(--accent-light);
  color: var(--accent) !important;
}

/* locate-btn 浮标已迁移到地图上，view-toggle 不再需要旧样式 */

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.content-area {
  padding: 0;
  .list,.task-list {
    padding-bottom: calc(90px + env(safe-area-inset-bottom));
  }
}

.loading, .empty {
  text-align: center;
  padding: var(--spacing-2xl) 0;
  color: var(--text-muted);
}

.loading {
  font-size: var(--font-size-base);
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.2;
  color: var(--accent-soft);
}

.empty p {
  font-size: var(--font-size-lg);
  margin: 0;
  color: var(--text-secondary);
}

.empty .tip {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-top: var(--spacing-sm);
}

.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
  align-items: flex-start;
  padding: var(--spacing-lg) var(--spacing-lg);
  border-bottom:1px solid rgba(44, 122, 158, 0.218);
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  background: var(--bg-primary);
}

.task-card:hover {
  background: var(--bg-secondary);
}

.task-card:focus-visible {
  outline: 3px solid var(--accent-light);
  outline-offset: -3px;
}

.task-card:last-child {
  border-bottom: none;
}

.task-main {
  flex: 1;
  min-width: 0;
  height: 120px;
  width: 290px;
  flex-direction: column;
  margin: -8px 0;
}

.task-type {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--accent);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.05em;
  display: block;
  background: rgba(64, 158, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  width: 84px;
}

.sub-type-tag {
  display: inline-block;
  color: white;
  padding: 3px 10px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--accent);
}

.task-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 10px 0 var(--spacing-sm);
  color: var(--text-primary);
  line-height: 1.4;
  width: 300px;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: 38px;
  height: 32px;
  margin: -6px 0;
}

.task-meta span:first-child {
  text-align: left;
  height: 32px;
  display: flex;
  line-height: 32px;
}

.task-meta span:nth-child(2) {
  height: 32px;
  text-align: left;
  line-height: 32px;
}

.task-meta span:nth-child(3) {
  height: 32px;
  line-height: 32px;
}

.task-meta .poster-info {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}

.task-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
  margin-left: var(--spacing-md);
  margin: -6px 0;
  height: 88px;
  width: 40px;
}

.task-budget {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--accent-warm);
  line-height: 1;
  width: 37px;
}

.task-budget::before {
  content: '¥';
  font-size: var(--font-size-sm);
  font-weight: 600;
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
  width: 100%;
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
  position: fixed;
  left: 0;
  right: 0;
  z-index: 10;
  bottom: var(--global-tab-bar-height); /* 距底部 tab-bar */
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
  top: 520px;
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
  padding-top: calc(var(--spacing-lg) + 4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.employer-name {
  margin-left: 8px;
}

.map-info-close {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  width: 40px !important;
  height: 40px !important;
  font-size: 20px !important;
  color: var(--text-muted) !important;
  cursor: pointer;
  margin-left: auto;
  padding: 0 !important;
  line-height: 1 !important;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-info-close:hover {
  color: var(--text-primary);
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
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(30, 42, 58, 0.1);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.drawer-header h2 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none !important;
  background: transparent !important;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted) !important;
  border-radius: 50% !important;
  padding: 0 !important;
  min-height: unset !important;
  font-size: 20px;
  transition: all 0.2s var(--transition-soft);
}

.close-btn:hover {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}

.filter-section {
  padding: var(--spacing-lg) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.filter-section h3 {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  border: 1.5px solid var(--border-light);
  cursor: pointer;
  min-height: 36px;
  border-radius: var(--border-radius-full) !important;
  background: var(--bg-primary);
  color: var(--text-secondary);
  transition: all 0.2s var(--transition-soft);
}

.chip:hover {
  border-color: var(--accent-soft);
  background: var(--accent-light);
}

.chip:has(input:checked) {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.chip input {
  display: none;
}

.drawer-footer {
  margin-top: auto;
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
  background: var(--bg-primary);
}

.drawer-footer button {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  background: var(--bg-primary) !important;
  border: 1.5px solid var(--border-light) !important;
  cursor: pointer;
  min-height: var(--touch-target-min);
  border-radius: var(--border-radius) !important;
  transition: all 0.2s var(--transition-soft);
  color: var(--text-primary) !important;
}

.drawer-footer button.primary {
  background: var(--accent) !important;
  color: #fff !important;
  border-color: var(--accent) !important;
}

.drawer-footer button:hover {
  background: var(--bg-secondary) !important;
}

.drawer-footer button.primary:hover {
  background: var(--accent-hover) !important;
  border-color: var(--accent-hover) !important;
}

/* ── 用户位置脉冲动画 ── */
.user-location-dot {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  /* 默认居中，由 JS 动态更新 left/top */
}

.dot-inner {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #1677ff;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(22, 119, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  left: 0;
  top: 0;
  z-index: 3;
}

.dot-ring {
  position: absolute;
  width: 32px;
  height: 32px;
  border: 2px solid #1677ff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  left: 0;
  top: 0;
  z-index: 2;
  opacity: 0;
  animation: locationPulse 2.4s ease-out infinite;
}

.dot-ring.delay {
  animation-delay: 1.2s;
}

@keyframes locationPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.2);
    opacity: 0;
  }
}

/* 定位中扫描动画 */
.locating-pulse {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  margin: -40px 0 0 -40px;
  border: 2px solid #1677ff;
  border-radius: 50%;
  z-index: 1000;
  pointer-events: none;
  animation: scanPulse 1.5s ease-out infinite;
}

@keyframes scanPulse {
  0% {
    transform: scale(0.4);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
</style>
