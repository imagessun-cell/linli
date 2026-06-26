<template>
  <div class="home-container">
    <section class="hero-panel">
      <div class="home-topbar">
        <LinliLogo class="home-logo" variant="full" tone="brand" :size="36" />
        <div class="header-actions">
          <button class="header-icon-btn" @click="toggleSearch" aria-label="搜索任务">
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
      </div>
    </section>

    <div class="search-bar expanded" role="search">
      <div class="search-input-wrapper">
        <input
          id="search-input"
          v-model="searchKeyword"
          placeholder="搜索医院、社区或服务类型"
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px; vertical-align: middle; position: relative; top: -1px;">
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
          <p>暂无附近任务</p>
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
            <div class="task-card-top">
              <span class="task-type" aria-label="任务类型">
                <span v-if="task.subTypeIcon" :class="[getSubTypeClass(task.subType)]">{{ task.subTypeIcon }} {{ task.subTypeName }}</span>
                <span v-else>{{ task.typeIcon }} {{ task.typeName }}</span>
              </span>
              <span class="task-date">{{ formatTaskDate(task.startTime) }}</span>
            </div>
            <h3 class="task-title">{{ task.address || task.employerCommunity || '就诊人地点' }} 到 {{ task.targetHospital || '目标医院' }}</h3>
            <div class="task-facts" aria-label="任务关键信息">
              <div class="task-fact">
                <span>距离</span>
                <strong>{{ formatDistance(task.distance) }}</strong>
              </div>
              <div class="task-fact">
                <span>时长</span>
                <strong>{{ formatDuration(task.duration).trim() }}</strong>
              </div>
            </div>
          </div>
          <div class="task-side">
            <span class="budget-label">报酬</span>
            <div class="task-budget" aria-label="报酬">{{ task.budget }}</div>
            <span class="detail-hint">查看详情</span>
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
            <LinliAvatar
              class="avatar-small vector-avatar-small"
              :name="selectedTask.employerName || '就诊人'"
              :src="selectedTask.employerAvatar"
              variant="patient"
              :size="36"
            />
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
import LinliLogo from '@/components/LinliLogo.vue'
import LinliAvatar from '@/components/LinliAvatar.vue'

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
const radius = ref(5000000)
const selectedTask = ref(null)
// 默认位置：北京·朝阳区（BD09 坐标），GPS 获取失败时回退到此
const userLocation = ref({ lat: 39.929, lng: 116.494 })

const sortOptions = [
  { label: '距离', value: 'distance' },
  { label: '报酬', value: 'budget' }
]

const taskTypes = [
  { label: '全程陪同', icon: '👣', value: 1 },
  { label: '挂号取药', icon: '💊', value: 2 },
  { label: '门诊陪护', icon: '🪑', value: 3 },
  { label: '代为问诊', icon: '📝', value: 4 }
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
      pageSize: 14,
      sortBy: sortBy.value,
      order: sortAsc.value ? 'asc' : 'desc'
    }

    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }

    if (selectedTypes.value.length > 0) {
      params.subType = selectedTypes.value.join(',')
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
  loadTasks(true)
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
    4: 'tag-consult',
    5: 'tag-training'
  }
  return classMap[subType] || ''
}

const fallbackMapAvatarHtml = `
  <span style="width:38px;height:38px;display:inline-flex;border-radius:50%;background:#fffdf8;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.24);overflow:hidden;">
    <svg viewBox="0 0 80 80" style="width:100%;height:100%;display:block;">
      <circle cx="40" cy="40" r="37" fill="#fff7ec" stroke="#ead8bd" stroke-width="2"></circle>
      <path d="M26 50c2.6-7.2 7.2-10.7 14-10.7S51.4 42.8 54 50" fill="none" stroke="#4F3A32" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M28.5 29.8c2-6.2 6.1-9.2 11.5-9.2s9.5 3 11.5 9.2" fill="none" stroke="#4F3A32" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="40" cy="32" r="8.5" fill="none" stroke="#4F3A32" stroke-width="3.2"></circle>
      <path d="M54 27c3.3 0 5.5 2.1 5.5 5.2 0 4.1-5.5 7.9-5.5 7.9s-5.5-3.8-5.5-7.9c0-3.1 2.2-5.2 5.5-5.2Z" fill="none" stroke="#E94F3D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </span>
`

const buildMapAvatarHtml = (task) => {
  const avatar = (task?.employerAvatar || '').trim()
  if (!avatar) return fallbackMapAvatarHtml
  const src = avatar.startsWith('/') || /^(https?:)?\/\//.test(avatar) ? avatar : `/${avatar}`
  return `
    <span style="width:38px;height:38px;display:inline-flex;border-radius:50%;background:#fffdf8;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.24);overflow:hidden;">
      <img src="${src.replace(/"/g, '&quot;')}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.remove()" />
    </span>
  `
}

const formatDistance = (distance) => {
  if (!distance) return '—'
  if (distance < 1000) return `${distance}m`
  return `${(distance / 1000).toFixed(1)}km`
}

const formatDuration = (minutes) => {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes}分钟`
  const hours = minutes / 60
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}小时`
}

const formatTaskDate = (time) => {
  if (!time) return '时间待定'
  const date = new Date(String(time).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return '时间待定'
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
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

    const label = new BMapGL.Label(buildMapAvatarHtml(task), {
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
  color: var(--text-primary);
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px var(--spacing-md);
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
  letter-spacing: 0;
  color: #fff;
  flex-shrink: 0;
}

.header-tagline {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.86);
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
  width: 46px;
  height: 46px;
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
  max-height: 180px;
  padding: 12px var(--spacing-md);
  border-bottom: var(--border-light);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 42px 12px var(--spacing-md);
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
  width: 34px;
  height: 34px;
  border: none !important;
  background: #E2CFC6 !important;
  color: #7D6257 !important;
  cursor: pointer;
  border-radius: 50% !important;
  padding: 0 !important;
  min-height: unset !important;
  transition: all 0.2s var(--transition-soft);
}

.search-clear-btn:hover {
  background: #E2CFC6 !important;
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
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  background: var(--bg-secondary);
  list-style: none;
  font-weight: 500;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px var(--spacing-md);
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
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 50;
}

.sort-tabs {
  display: flex;
  gap: 6px;
}

.sort-tabs button {
  padding: 8px 14px;
  font-size: var(--font-size-base);
  font-weight: 700;
  background: transparent;
  border: none !important;
  color: var(--text-muted) !important;
  cursor: pointer;
  min-height: 42px;
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
  gap: 6px;
}

.view-toggle button {
  height: 42px;
  width: 42px;
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
  font-size: var(--font-size-xl);
  margin: 0;
  color: var(--text-secondary);
}

.empty .tip {
  font-size: var(--font-size-base);
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
  padding: 20px 16px;
  border-bottom: 1.5px solid rgba(233, 79, 61, 0.18);
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  background: var(--bg-primary);
  min-height: 150px;
  height: auto;
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
  min-height: 108px;
  width: auto;
  flex-direction: column;
  margin: 0;
}

.task-type {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--accent);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.05em;
  display: block;
  background: rgba(233, 79, 61, 0.10);
  padding: 5px 10px;
  border-radius: 4px;
  width: fit-content;
  max-width: 132px;
  white-space: nowrap;
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

.tag-training {
  background: #B66A25;
}

.task-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  margin: 12px 0 var(--spacing-sm);
  color: var(--text-primary);
  line-height: 1.4;
  max-width: 100%;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.5;
  height: auto;
  margin: 0;
}

.task-meta span:first-child {
  text-align: left;
  min-height: 28px;
  display: flex;
  line-height: 1.5;
}

.task-meta span:nth-child(2) {
  min-height: 28px;
  text-align: left;
  line-height: 1.5;
}

.task-meta span:nth-child(3) {
  min-height: 28px;
  line-height: 1.5;
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
  margin-top: 2px;
  min-height: 104px;
  width: 64px;
}

.task-budget {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent-warm);
  line-height: 1;
  width: auto;
  text-align: right;
}

.task-budget::before {
  content: '¥';
  font-size: var(--font-size-base);
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
  cursor: default;
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
  font-weight: 600;
  margin: 10px 0 var(--spacing-sm);
  color: var(--text-primary);
  line-height: 1.4;
  max-width: 100%;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  width: 46px;
  height: 46px;
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
  font-size: var(--font-size-lg);
  font-weight: 800;
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
  padding: 12px var(--spacing-md);
  font-size: var(--font-size-base);
  border: 1.5px solid var(--border-light);
  cursor: pointer;
  min-height: 46px;
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
  min-height: 54px;
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
  background: #E94F3D;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(233, 79, 61, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  left: 0;
  top: 0;
  z-index: 3;
}

.dot-ring {
  position: absolute;
  width: 32px;
  height: 32px;
  border: 2px solid #E94F3D;
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
  border: 2px solid #E94F3D;
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

/* 新版 H5 首页：社区陪诊工作台 */
.home-container {
  background: #FFF7EF;
}

.hero-panel {
  padding: 18px 16px 22px;
  background: #D94A37;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
}

.home-header {
  padding: 0;
  background: transparent;
  border-bottom: none;
}

.header-brand {
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: #fff;
  color: #D94A37;
  font-size: 24px;
  font-weight: 900;
}

.home-header h1 {
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: 0;
  color: #fff;
}

.header-tagline {
  display: block;
  margin-top: 4px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.88);
}

.header-icon-btn {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.role-switcher {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}

.role-card {
  min-height: 96px;
  padding: 12px;
  border-radius: 10px !important;
  border: 1.5px solid rgba(255, 255, 255, 0.24) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  text-align: left;
}

.role-card.active {
  background: #fff !important;
  color: #D94A37 !important;
  border-color: #fff !important;
}

.role-kicker {
  font-size: 13px;
  font-weight: 800;
  opacity: 0.82;
}

.role-card strong {
  font-size: 21px;
  line-height: 1.1;
}

.role-card span:last-child {
  font-size: 14px;
  line-height: 1.35;
}

.hero-copy {
  margin-top: 18px;
}

.status-pill {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.hero-copy h2 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.24;
  color: #fff;
}

.hero-copy p {
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.9);
}

.search-bar,
.search-bar.expanded {
  max-height: none;
  padding: 14px 16px;
  background: #FFF7EF;
  border-bottom: none;
}

.search-input {
  min-height: 56px;
  font-size: 17px;
  border: 1.5px solid #E0C7BA;
  box-shadow: 0 3px 10px rgba(23, 35, 49, 0.06);
}

.suggestion-list {
  border-color: #E0C7BA;
  z-index: 1300;
  border-radius: 16px;
  box-shadow: 0 16px 36px rgba(23, 35, 49, 0.16);
}

.suggestion-item {
  min-height: 52px;
  font-size: 17px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px 14px;
  background: #FFF7EF;
}

.summary-strip div {
  min-height: 74px;
  padding: 10px;
  background: #fff;
  border: 1px solid #E9D4CA;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-strip strong {
  font-size: 22px;
  line-height: 1;
  color: #D94A37;
}

.summary-strip span {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #7D6257;
}

.sort-bar {
  top: 0;
  padding: 12px 16px;
  background: #FFF9F2;
  border-top: 1px solid #EFE2DC;
  border-bottom: 1px solid #EFE2DC;
}

.sort-tabs {
  gap: 8px;
}

.sort-tabs button {
  min-height: 44px;
  padding: 8px 14px;
  font-size: 16px;
  font-weight: 800;
  color: #6D5146 !important;
  background: #fff !important;
  border: 1px solid #E9D4CA !important;
}

.sort-tabs button.active {
  color: #fff !important;
  background: #D94A37 !important;
  border-color: #D94A37 !important;
}

.view-toggle {
  gap: 8px;
}

.view-toggle button {
  width: 44px;
  height: 44px;
  background: #fff !important;
  border: 1px solid #E9D4CA !important;
}

.view-toggle button.active {
  background: #FFF0EC !important;
  color: #D94A37 !important;
  border-color: #E2B5A8 !important;
}

.task-list {
  padding: 0 0 calc(96px + env(safe-area-inset-bottom));
}

.task-card {
  margin: 0 12px 12px;
  min-height: 184px;
  height: auto;
  padding: 18px;
  background: #fff;
  border: 1px solid #E9D4CA;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(23, 35, 49, 0.06);
  gap: 14px;
}

.task-main {
  width: auto;
  height: auto;
  min-height: 0;
  margin: 0;
}

.task-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.task-type {
  width: auto;
  max-width: 132px;
  margin: 0;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  color: #D94A37;
  background: #FFF0EC;
}

.task-date {
  padding: 6px 10px;
  border-radius: 999px;
  color: #73522b;
  background: #f6ead9;
  font-size: 14px;
  font-weight: 800;
}

.task-title {
  margin: 12px 0 10px;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.35;
  color: #4F3A32;
  word-break: break-word;
}

.task-meta {
  height: auto;
  margin: 0;
  gap: 8px;
  line-height: 1.4;
  font-size: 15px;
  color: #6D5146;
}

.task-meta span,
.task-meta span:first-child,
.task-meta span:nth-child(2),
.task-meta span:nth-child(3) {
  min-height: 30px;
  height: auto;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #FFF5EC;
}

.task-route {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.55;
  color: #8A6C60;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-side {
  width: 76px;
  min-height: 146px;
  height: auto;
  margin: 0;
  align-items: flex-end;
  justify-content: space-between;
}

.task-budget {
  width: auto;
  font-size: 30px;
  line-height: 1.2;
  color: #c06b3f;
  text-align: right;
}

.task-budget::before {
  font-size: 16px;
}

.detail-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  background: #D94A37;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.load-more {
  padding: 8px 16px 24px;
}

.load-more button {
  min-height: 56px;
  border-radius: 10px !important;
  border-color: #D94A37 !important;
  color: #D94A37 !important;
}

.filter-drawer {
  max-width: 420px;
}

.drawer-header h2 {
  font-size: 24px;
}

.chip {
  min-height: 50px;
  font-size: 17px;
  font-weight: 800;
}

@media (max-width: 360px) {
  .hero-copy h2 {
    font-size: 26px;
  }

  .role-card strong {
    font-size: 18px;
  }

  .summary-strip {
    grid-template-columns: 1fr;
  }

  .task-card {
    margin-left: 10px;
    margin-right: 10px;
  }
}

/* 任务大厅轻量适老版 */
.home-container {
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
}

.hero-panel {
  position: relative;
  overflow: hidden;
  padding: 16px 16px 22px;
  background:
    linear-gradient(180deg, #FFFDF8 0%, #FFF6EE 100%);
  border-bottom: 1px solid #F2E6DE;
}

.hero-panel::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background: rgba(233, 79, 61, 0.08);
}

.home-header {
  position: relative;
  z-index: 1;
}

.home-topbar {
  position: relative;
  z-index: 1;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-logo {
  flex: 0 1 auto;
  min-width: 0;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  box-shadow: 0 8px 22px rgba(4, 35, 43, 0.18);
}

.home-header h1 {
  font-size: 24px;
  font-weight: 900;
}

.header-tagline {
  margin-top: 3px;
  font-size: 15px;
  font-weight: 700;
}

.header-actions {
  gap: 8px;
}

.header-icon-btn {
  width: 46px;
  height: 46px;
  border-radius: 13px !important;
  background: #fff !important;
  color: #E94F3D !important;
  border-color: #EBD8CF !important;
  box-shadow: 0 8px 20px rgba(79, 58, 50, 0.08);
}

.header-icon-btn:hover {
  background: #FFF0EC !important;
  border-color: #E94F3D !important;
  color: #E94F3D !important;
}

.hero-copy {
  position: relative;
  z-index: 1;
  margin-top: 22px;
  max-width: 620px;
}

.status-pill {
  background: #f8e1bd;
  color: #5f3b15;
  font-size: 14px;
  box-shadow: 0 8px 20px rgba(4, 35, 43, 0.12);
}

.hero-copy h2 {
  margin: 12px 0 8px;
  max-width: 9em;
  font-size: 30px;
  line-height: 1.22;
  font-weight: 900;
}

.hero-copy p {
  max-width: 25em;
  font-size: 15px;
  line-height: 1.55;
}

.hero-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.hero-stats div {
  min-height: 66px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.hero-stats strong {
  display: block;
  font-size: 27px;
  line-height: 1;
  color: #fff;
}

.hero-stats span {
  display: block;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 14px;
  font-weight: 800;
}

.search-bar,
.search-bar.expanded {
  position: relative;
  z-index: 120;
  margin: -12px 14px 0;
  padding: 0;
  background: transparent;
}

.search-input {
  min-height: 56px;
  padding: 14px 48px 14px 18px;
  border: 1px solid #EBD8CF;
  border-radius: 16px;
  font-size: 18px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(23, 35, 49, 0.12);
}

.search-clear-btn {
  right: 10px;
  width: 38px;
  height: 38px;
}

.summary-strip {
  display: none;
}

.sort-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  margin: 14px 12px 12px;
  padding: 7px;
  border: 1px solid #EFE2DC;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(23, 35, 49, 0.06);
  backdrop-filter: blur(8px);
}

.sort-tabs {
  flex: 1;
}

.sort-tabs button {
  min-height: 46px;
  padding: 8px 12px;
  border: none !important;
  border-radius: 12px !important;
  background: transparent !important;
}

.sort-tabs button.active {
  color: #E94F3D !important;
  background: #FFF0EC !important;
}

.view-toggle button {
  width: 46px;
  height: 46px;
  border: none !important;
  border-radius: 12px !important;
}

.task-list {
  padding: 0 0 calc(104px + env(safe-area-inset-bottom));
}

.task-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 0 14px 16px;
  min-height: 0;
  padding: 22px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.task-card:focus-visible {
  outline: 4px solid rgba(233, 79, 61, 0.28);
  outline-offset: 2px;
}

.task-card-top {
  justify-content: space-between;
  gap: 10px;
}

.task-type,
.task-date {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  font-size: 15px;
}

.task-type {
  max-width: none;
  background: #FFF0EC;
  color: #E94F3D;
}

.task-date {
  color: #654318;
  background: #f8e1bd;
}

.task-title {
  margin: 18px 0 18px;
  font-size: 25px;
  line-height: 1.36;
  color: #162936;
}

.task-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.task-fact {
  min-height: 76px;
  padding: 12px 10px;
  border-radius: 16px;
  background: #FFF9F2;
  border: 1px solid #EFE2DC;
}

.task-fact span {
  display: block;
  margin-bottom: 7px;
  color: #8A6C60;
  font-size: 13px;
  font-weight: 900;
}

.task-fact strong {
  display: block;
  color: #4F3A32;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 900;
}

.task-side {
  width: 100%;
  min-height: 0;
  margin: 18px 0 0;
  padding-top: 16px;
  border-top: 1px solid #F2E6DE;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.budget-label {
  color: #8A6C60;
  font-size: 14px;
  font-weight: 900;
}

.task-budget {
  margin-right: auto;
  margin-left: 8px;
  font-size: 34px;
  color: #b45f32;
}

.task-budget::before {
  font-size: 18px;
}

.detail-hint {
  min-width: 94px;
  min-height: 46px;
  border-radius: 14px;
  background: #E94F3D;
  font-size: 16px;
}

.load-more {
  padding: 8px 16px 28px;
}

@media (max-width: 420px) {
  .hero-panel {
    padding-bottom: 22px;
  }

  .hero-copy h2 {
    font-size: 28px;
  }

  .task-card {
    padding: 20px;
  }

  .task-facts {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .task-fact {
    min-height: 76px;
    padding: 10px 8px;
  }

  .task-fact strong {
    font-size: 16px;
  }

  .task-side {
    align-items: center;
  }
}

@media (max-width: 360px) {
  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .task-title {
    font-size: 23px;
  }

  .sort-bar {
    margin-left: 10px;
    margin-right: 10px;
  }

  .sort-tabs button {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
