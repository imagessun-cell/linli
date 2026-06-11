<template>
  <div class="task-detail-page">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">←</button>
      <span class="header-label">岗位详情</span>
    </header>

    <div class="hero-section" v-if="task">
      <div class="hero-type">
        <span v-if="task.subTypeIcon" :class="['sub-type-tag', getSubTypeClass(task.subType)]">{{ task.subTypeIcon }} {{ task.subTypeName }}</span>
        <span v-else class="hero-type-plain">{{ task.typeIcon }} {{ task.typeName }}</span>
      </div>
      <h1 class="hero-title">{{ task.employerCommunity }} → {{ task.targetHospital }}</h1>
      <div class="hero-meta">
        <span>{{ formatPublishTime(task.createdAt) }}</span>
      </div>
    </div>

    <div class="main-content" v-if="task">
      <div class="section">
        <h3 class="section-title">服务信息</h3>
        <div class="info-list">
          <div class="info-row info-row-budget">
            <span class="info-icon">💰</span>
            <div class="info-content">
              <span class="info-label">服务报酬</span>
              <span class="info-value info-value-budget">¥{{ task.budget }}</span>
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
              <span class="info-value">{{ formatDuration(task.duration) }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🏥</span>
            <div class="info-content">
              <span class="info-label">服务路线</span>
              <span class="info-value">{{ task.employerCommunity }} → {{ task.targetHospital }}</span>
            </div>
          </div>
          <div class="map-container-small">
            <div id="task-detail-map" class="map-small"></div>
          </div>
          <div class="info-row">
            <span class="info-icon">📍</span>
            <div class="info-content">
              <span class="info-label">
                我的位置
                <span class="route-arrow-inline">→</span>
                雇主家
              </span>
              <div class="info-value-row">
                <span class="info-value">{{ formatDistance(myToEmployerKm) }}</span>
                <a
                  class="route-nav-link"
                  :href="myToEmployerNavUrl"
                  target="_blank"
                  rel="noopener"
                >导航</a>
              </div>
            </div>
          </div>
          <div class="info-row">
            <span class="info-icon">🏠</span>
            <div class="info-content">
              <span class="info-label">
                雇主家
                <span class="route-arrow-inline">→</span>
                医院
              </span>
              <div class="info-value-row">
                <span class="info-value">{{ formatDistance(employerToHospitalKm) }}</span>
                <a
                  class="route-nav-link"
                  :href="employerToHospitalNavUrl"
                  target="_blank"
                  rel="noopener"
                >导航</a>
              </div>
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
            <span class="publisher-rating">📍 {{ task.employerCommunity || '所在社区' }}</span>
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

const formatDateTime = (str) => {
  if (!str) return ''
  const d = new Date(str)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDuration = (minutes) => {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分钟`
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

const formatPublishTime = (timestamp) => {
  const now = new Date();
  const publish = new Date(timestamp);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart - 86400000);
  const twoDaysAgoStart = new Date(todayStart - 172800000);

  if (publish >= todayStart) {
    const hours = String(publish.getHours()).padStart(2, '0');
    const minutes = String(publish.getMinutes()).padStart(2, '0');
    return `今天 ${hours}:${minutes}`;
  } else if (publish >= yesterdayStart) {
    return `昨天 ${String(publish.getHours()).padStart(2, '0')}:${String(publish.getMinutes()).padStart(2, '0')}`;
  } else if (publish >= twoDaysAgoStart) {
    return `前天 ${String(publish.getHours()).padStart(2, '0')}:${String(publish.getMinutes()).padStart(2, '0')}`;
  } else if (now.getTime() - publish.getTime() < 7 * 86400000) {
    const month = String(publish.getMonth() + 1).padStart(2, '0');
    const day = String(publish.getDate()).padStart(2, '0');
    return `${month}-${day} ${String(publish.getHours()).padStart(2, '0')}:${String(publish.getMinutes()).padStart(2, '0')}`;
  } else {
    const month = String(publish.getMonth() + 1).padStart(2, '0');
    const day = String(publish.getDate()).padStart(2, '0');
    return `${publish.getFullYear()}-${month}-${day}`;
  }
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

// 我的位置坐标（实时更新，兜底为雇主家附近）
const myLocation = ref(null)
const updateMyLocation = () => {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      myLocation.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
    },
    () => {
      // 定位失败兜底：使用雇主家附近
      if (task.value && task.value.employerCommunityLat) {
        myLocation.value = {
          lat: task.value.employerCommunityLat,
          lng: task.value.employerCommunityLng
        }
      }
    },
    { timeout: 3000, maximumAge: 60000 }
  )
}

// 计算两点之间的球面距离（km）
const calcKm = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const employerToHospitalKm = computed(() => {
  const t = task.value
  if (!t) return null
  return calcKm(t.employerCommunityLat, t.employerCommunityLng, t.latitude, t.longitude)
})

const myToEmployerKm = computed(() => {
  const t = task.value
  if (!t) return null
  const me = myLocation.value || {
    lat: t.employerCommunityLat,
    lng: t.employerCommunityLng
  }
  return calcKm(me.lat, me.lng, t.employerCommunityLat, t.employerCommunityLng)
})

const formatDistance = (km) => {
  if (km == null) return '—'
  if (km < 1) return `${Math.round(km * 1000)} 米`
  return `${km.toFixed(1)}km`
}

// 百度地图 URL Scheme 导航
const buildNavUrl = (fromLat, fromLng, toLat, toLng, toName) => {
  if (!fromLat || !fromLng || !toLat || !toLng) return '#'
  return `https://api.map.baidu.com/direction?` +
    `origin=latlng:${fromLat},${fromLng}|name:起点` +
    `&destination=latlng:${toLat},${toLng}|name:${encodeURIComponent(toName || '终点')}` +
    `&mode=transit&region=北京&output=html&coord_type=bd09ll&src=webapp`
}

const myToEmployerNavUrl = computed(() => {
  const t = task.value
  if (!t) return '#'
  const me = myLocation.value || {
    lat: t.employerCommunityLat,
    lng: t.employerCommunityLng
  }
  return buildNavUrl(me.lat, me.lng, t.employerCommunityLat, t.employerCommunityLng, t.employerCommunity)
})

const employerToHospitalNavUrl = computed(() => {
  const t = task.value
  if (!t) return '#'
  return buildNavUrl(t.employerCommunityLat, t.employerCommunityLng, t.latitude, t.longitude, t.targetHospital)
})

// 初始化详情页地图（DOMOverlay 自定义 marker，雇主家→医院公交路线）
const initTaskMap = () => {
  const mapContainer = document.getElementById('task-detail-map')
  if (!mapContainer || !task.value) return
  if (!task.value.latitude || !task.value.longitude) return

  const start = () => {
    const BMapGL = window.BMapGL
    if (!BMapGL || typeof BMapGL.Map !== 'function') {
      console.warn('BMapGL 尚未就绪，1s 后重试')
      setTimeout(start, 1000)
      return
    }
    try {
      const map = new BMapGL.Map('task-detail-map')
      const hospitalPoint = new BMapGL.Point(task.value.longitude, task.value.latitude)

      const employerLat = task.value.employerCommunityLat
      const employerLng = task.value.employerCommunityLng
      const hasEmployer = !!(employerLat && employerLng)
      const employerPoint = hasEmployer
        ? new BMapGL.Point(employerLng, employerLat)
        : null

      const myPoint = employerPoint
        ? new BMapGL.Point(
            employerLng + (Math.random() - 0.5) * 0.006,
            employerLat + (Math.random() - 0.5) * 0.006
          )
        : new BMapGL.Point(
            task.value.longitude + 0.003,
            task.value.latitude + 0.003
          )

      const buildMarker = (id, point, title, color, emoji) => {
        const wrap = document.createElement('div')
        wrap.className = 'task-map-marker'
        wrap.dataset.id = id
        wrap.innerHTML = `
          <div class="task-map-pin" style="background:${color}">
            <span class="task-map-emoji">${emoji}</span>
          </div>
          <div class="task-map-callout">${title}</div>
        `
        if (typeof BMapGL.DomOverlay === 'function') {
          try {
            const dom = new BMapGL.DomOverlay(point, wrap, {
              offset: { width: 0, height: 0 }
            })
            map.addOverlay(dom)
            return
          } catch (e) { /* fallthrough */ }
        }
        map.addOverlay(new BMapGL.Marker(point))
      }

      const markers = [
        { id: 1, point: myPoint, title: '我的位置', color: '#22c55e', emoji: '📍' },
        hasEmployer && { id: 2, point: employerPoint, title: '雇主家', color: '#f59e0b', emoji: '🏠' },
        { id: 3, point: hospitalPoint, title: '目标医院', color: '#ef4444', emoji: '🏥' }
      ].filter(Boolean)

      markers.forEach(m => buildMarker(m.id, m.point, m.title, m.color, m.emoji))

      // 雇主家 → 医院 公交路线
      if (hasEmployer) {
        const transit = new BMapGL.TransitRoute(map, {
          renderOptions: { map: map, autoViewport: true }
        })
        transit.search(employerPoint, hospitalPoint)
      } else {
        map.centerAndZoom(hospitalPoint, 15)
      }

      // 调整视野
      try {
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
        markers.forEach(m => {
          if (m.point.lng < minLng) minLng = m.point.lng
          if (m.point.lng > maxLng) maxLng = m.point.lng
          if (m.point.lat < minLat) minLat = m.point.lat
          if (m.point.lat > maxLat) maxLat = m.point.lat
        })
        const bounds = new BMapGL.Bounds(
          new BMapGL.Point(minLng, minLat),
          new BMapGL.Point(maxLng, maxLat)
        )
        map.setBounds(bounds)
      } catch (e) {
        map.centerAndZoom(hospitalPoint, 14)
      }

      map.enableScrollWheelZoom(false)
    } catch (e) {
      console.error('Map error:', e)
    }
  }

  if (window.BMapGL) {
    start()
  } else {
    window.addEventListener('baidu-map-ready', start, { once: true })
    setTimeout(() => {
      if (!window.BMapGL) {
        window.removeEventListener('baidu-map-ready', start)
        console.warn('Baidu map load timeout')
      }
    }, 5000)
  }
}

const loadTask = async () => {
  console.log('loadTask called, route.params.id:', route.params.id)
  try {
    const res = await request.get(`/task/public/${route.params.id}`)
    console.log('Task API response:', res)
    if (res.code === 0) {
      task.value = res.data
      console.log('Task loaded, task.value:', task.value, 'lat:', task.value?.latitude, 'lng:', task.value?.longitude)
      nextTick(() => {
        initTaskMap()
        updateMyLocation()
      })
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
  // 监听百度地图脚本加载完成事件
  window.addEventListener('baidu-map-ready', () => {
    nextTick(() => initTaskMap())
  })
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
  width: 40px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 18px !important;
  background: #f5f7fa !important;
  color: #1E2A3A !important;
  border: 1.5px solid transparent !important;
  border-radius: 12px !important;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 !important;
  min-height: 40px !important;
}

.back-btn:hover {
  background: #e8ecf2 !important;
  color: #2c7a9e !important;
  border-color: #2c7a9e !important;
}

.back-btn:active {
  background: #e8ecf2 !important;
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
  color: var(--accent);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(64, 158, 255, 0.1);
}

.sub-type-tag.tag-escort {
  background: rgba(64, 158, 255, 0.1);
  color: var(--accent);
}

.tag-accompany {
  background: rgba(64, 158, 255, 0.1);
  color: var(--accent);
}

.tag-pharmacy {
  background: rgba(64, 158, 255, 0.1);
  color: var(--accent);
}

.tag-consult {
  background: rgba(64, 158, 255, 0.1);
  color: var(--accent);
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
  height: 21px;
  line-height: 21px;
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

.route-nav-link {
  font-size: 13px;
  color: #4f46e5;
  text-decoration: none;
  padding: 4px 12px;
  border-radius: 999px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  white-space: nowrap;
  transition: all 0.2s;
  font-weight: 500;
  line-height: 1.4;
}

.route-nav-link:hover {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}

.info-icon {
  font-size: 20px;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.info-value-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.info-value-row .info-value {
  font-size: 16px;
  color: rgb(26, 26, 26);
  line-height: 1.5;
  font-weight: 600;
}

.info-row-budget {
  padding-bottom: 0;
  border-bottom: none;
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgb(26, 26, 26);
  margin-bottom: 4px;
}

.route-section-label {
  text-transform: none;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  margin-top: 2px;
}

.info-value {
  font-size: 16px;
  color: rgb(26, 26, 26);
  line-height: 1.5;
}

.info-value-budget {
  font-size: 24px;
  font-weight: 900;
  color: #eb0000;
  line-height: 1.2;
}

.route-arrow-inline {
  color: rgb(26, 26, 26);
  font-weight: 700;
  margin: 0 2px;
}

.route-distance-inline {
  color: rgb(26, 26, 26);
}

.map-container-small {
  margin: 16px 0 12px 32px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: calc(100% - 32px);
  height: 160px;
}

.map-small {
  width: 100%;
  height: 100%;
  display: block;
}

.my-location-marker {
  position: relative;
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.my-location-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #4285f4;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.my-location-pulse {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 20px;
  height: 20px;
  background: rgba(66, 133, 244, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: my-location-pulse 1.8s ease-out infinite;
  z-index: 1;
}

@keyframes my-location-pulse {
  0% {
    width: 20px;
    height: 20px;
    opacity: 0.7;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
  }
}

.task-map-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.task-map-pin {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid #fff;
  animation: pin-drop 0.5s ease-out;
}

.task-map-emoji {
  transform: rotate(45deg);
  font-size: 14px;
  line-height: 1;
}

.task-map-callout {
  margin-top: 4px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  white-space: nowrap;
}

@keyframes pin-drop {
  0% {
    transform: rotate(-45deg) translateY(-30px);
    opacity: 0;
  }
  60% {
    transform: rotate(-45deg) translateY(4px);
    opacity: 1;
  }
  100% {
    transform: rotate(-45deg) translateY(0);
    opacity: 1;
  }
}

.special-requirements {
  margin: 0;
  padding: 0;
  font-size: 16px;
  color: #1a1a1a;
  line-height: 1.6;
  border: none;
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
  flex: 1 !important;
  padding: 16px !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  border: 1.5px solid transparent !important;
  border-radius: 12px !important;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 52px !important;
}

.contact-btn {
  background: #f5f7fa !important;
  color: #1E2A3A !important;
  border-color: transparent !important;
}

.contact-btn:hover:not(:disabled) {
  background: #e8ecf2 !important;
  color: #2c7a9e !important;
  border-color: #2c7a9e !important;
}

.grab-btn {
  background: #2c7a9e !important;
  color: #FFFFFF !important;
  border-color: #2c7a9e !important;
}

.grab-btn:hover:not(:disabled) {
  background: #216080 !important;
  color: #FFFFFF !important;
  border-color: #216080 !important;
}

.contact-btn:active:not(:disabled),
.grab-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.contact-btn:disabled, .grab-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed;
  background: #999 !important;
  color: #fff !important;
  border-color: transparent !important;
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