<template>
  <div class="publish">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">✕</button>
    </header>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <div class="sub-type-section">
        <div class="section-title">选择服务类型 <span class="required">*</span></div>
        <div class="sub-type-grid">
          <div
            v-for="sub in escortSubTypes"
            :key="sub.id"
            :class="['sub-type-card', { selected: form.sub_type === sub.id }]"
            @click="selectSubType(sub.id)"
          >
            <span class="sub-icon" v-html="sub.icon"></span>
            <span class="sub-name">{{ sub.name }}</span>
            <span class="sub-price">{{ sub.priceRange }}</span>
            <span class="sub-desc">{{ sub.desc }}</span>
            <span v-if="form.sub_type === sub.id" class="check-mark">✓</span>
          </div>
        </div>
        <div class="service-notice">
          ⚠️ 本服务<strong>不包含任何医疗行为</strong>（代替就诊、代替用药、操作医疗设备、出具诊断意见等）
        </div>
      </div>

      <el-form-item label="就诊人地点" prop="patient_location">
        <div class="location-input-wrapper">
          <div class="location-field-shell">
            <el-input
              ref="patientLocationInputRef"
              v-model="form.patient_location"
              placeholder="请输入就诊人所在小区或详细地址"
              @input="onPatientLocationInput"
              @focus="onPatientLocationFocus"
              @blur="onPatientLocationBlur"
              @keydown.up.prevent="navigatePatientLocationSuggestion(-1)"
              @keydown.down.prevent="navigatePatientLocationSuggestion(1)"
              @keydown.enter.prevent="selectHighlightedPatientLocation"
            />
            <div v-if="showPatientLocationSuggestions" class="location-suggestions">
              <div v-if="isSearchingPatientLocation" class="suggestion-loading">
                <span>正在搜索...</span>
              </div>
              <div v-else-if="filteredPatientLocations.length === 0" class="suggestion-empty">
                无匹配地点，可继续手动输入
              </div>
              <div
                v-else
                v-for="(location, index) in filteredPatientLocations"
                :key="location.name"
                :class="['suggestion-item', { highlighted: highlightedPatientLocationIndex === index }]"
                @click="selectPatientLocation(location)"
                @mouseenter="highlightedPatientLocationIndex = index"
              >
                <span class="suggestion-name">{{ location.name }}</span>
                <span class="suggestion-district">{{ location.district }}</span>
              </div>
            </div>
          </div>
          <div v-if="patientLocationStatus" class="location-status" :class="{ locating: isLocatingPatientLocation }">
            {{ patientLocationStatus }}
          </div>
          <div class="patient-map-card" aria-label="就诊人地点地图">
            <div class="patient-map-head">
              <strong>地图确认位置</strong>
              <span>{{ patientMapStatus }}</span>
            </div>
            <div id="patient-location-map" class="patient-map"></div>
            <p class="patient-map-tip">输入地点后自动定位，也可以拖动地图或定位点微调地址。</p>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="就诊医院" prop="address">
        <div class="hospital-input-wrapper">
          <el-input
            ref="hospitalInputRef"
            v-model="form.address"
            placeholder="请输入医院名称"
            @input="onHospitalInput"
            @focus="onHospitalFocus"
            @blur="onHospitalBlur"
            @keydown.up.prevent="navigateSuggestion(-1)"
            @keydown.down.prevent="navigateSuggestion(1)"
            @keydown.enter.prevent="selectHighlighted"
          />
          <div v-if="showSuggestions" class="hospital-suggestions">
            <div v-if="isSearching" class="suggestion-loading">
              <span>正在搜索...</span>
            </div>
            <div v-else-if="filteredHospitals.length === 0" class="suggestion-empty">
              无匹配医院，可继续手动输入
            </div>
            <div
              v-else
              v-for="(hospital, index) in filteredHospitals"
              :key="hospital.name"
              :class="['suggestion-item', { highlighted: highlightedIndex === index }]"
              @click="selectHospital(hospital)"
              @mouseenter="highlightedIndex = index"
            >
              <span class="hospital-name">{{ hospital.name }}</span>
              <span :class="['hospital-level', hospital.level]">{{ hospital.level }}</span>
              <span class="hospital-city">{{ hospital.city }}</span>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="科室">
        <div class="dept-input-wrapper">
          <el-input
            ref="deptInputRef"
            v-model="form.department"
            placeholder="请输入科室（如：呼吸科）"
            @input="onDeptInput"
            @focus="onDeptFocus"
            @blur="onDeptBlur"
            @keydown.up.prevent="navigateDeptSuggestion(-1)"
            @keydown.down.prevent="navigateDeptSuggestion(1)"
            @keydown.enter.prevent="selectHighlightedDept"
          />
          <div v-if="showDeptSuggestions" class="dept-suggestions">
            <div v-if="isSearchingDept" class="dept-suggestion-loading">
              <span>正在搜索...</span>
            </div>
            <div v-else-if="filteredDepts.length === 0" class="dept-suggestion-empty">
              无匹配科室，可继续手动输入
            </div>
            <div
              v-else
              v-for="(dept, index) in filteredDepts"
              :key="dept"
              :class="['dept-suggestion-item', { highlighted: highlightedDeptIndex === index }]"
              @click="selectDept(dept)"
              @mouseenter="highlightedDeptIndex = index"
            >
              <span class="dept-name">{{ dept }}</span>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="患者信息">
        <el-input v-model="form.patient_info" placeholder="如：张爷爷，78岁，行动不便（选填）" />
      </el-form-item>

      <el-form-item label="服务时间段" prop="service_time_range" class="time-form-item time-range-form-item">
        <div class="service-time-fields">
          <div class="service-time-row">
            <span class="service-time-label">开始</span>
            <el-date-picker
              v-model="serviceStartTime"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm"
              class="service-time-picker"
            />
          </div>
          <div class="service-time-row">
            <span class="service-time-label">结束</span>
            <el-date-picker
              v-model="serviceEndTime"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm"
              class="service-time-picker"
            />
          </div>
        </div>
      </el-form-item>

      <el-form-item label="服务时长">
        <span class="duration-display">{{ durationText }}</span>
      </el-form-item>

      <el-form-item label="体力要求" prop="physical_level">
        <el-radio-group v-model="form.physical_level">
          <el-radio :value="1">轻度</el-radio>
          <el-radio :value="2">中度</el-radio>
          <el-radio :value="3">重度</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="预算" prop="budget">
        <div class="budget-slider-input-wrap">
          <el-slider v-model="form.budget" :min="0" :max="500" :step="5" show-input class="budget-slider-input" />
          <span class="budget-unit">元</span>
        </div>
        <div class="price-hint" v-if="duration > 0">
          建议价：{{ suggestedPrice }}元（10元/小时）
        </div>
      </el-form-item>

      <el-form-item label="特殊协助" class="form-item--tight-bottom">
        <el-checkbox-group v-model="form.special_assist">
          <el-checkbox value="轮椅">轮椅协助</el-checkbox>
          <el-checkbox value="担架">担架协助</el-checkbox>
          <el-checkbox value="翻译">语言翻译</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.special_requirements" type="textarea" :rows="2" placeholder="其他特殊要求（选填）" />
      </el-form-item>

    </el-form>

    <div class="actions">
      <div class="insurance-badge">
        <span class="insurance-badge__text">50万陪诊意外险<span class="insurance-badge__free">平台免费赠送</span></span>
        <span class="insurance-badge__detail" @click="showInsuranceDetail = true">
          详情 <span class="arrow">›</span>
        </span>
      </div>
      <el-button type="primary" size="large" :loading="loading" @click="handlePublish">
        确认发布并支付
      </el-button>
    </div>

    <el-dialog v-model="showInsuranceDetail" title="保险详情" width="90%" align-center>
      <div class="insurance-detail-content">
        <div class="detail-header">陪诊意外险保障计划</div>
        <div class="detail-item">
          <span class="detail-label">保障项目</span>
          <span class="detail-value">意外身故/伤残</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">保障额度</span>
          <span class="detail-value">50万元</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">保障期限</span>
          <span class="detail-value">单次陪诊全程</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">受益人</span>
          <span class="detail-value">被陪诊人</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">保费</span>
          <span class="detail-value">平台赠送（免费）</span>
        </div>
      </div>
    </el-dialog>

    <!-- V1.4 服务协议签署 -->
    <ServiceAgreement
      v-model="showAgreement"
      agreementType="publish"
      @signed="doPublish"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import ServiceAgreement from '@/components/v1_4/ServiceAgreement.vue'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const hospitalInputRef = ref()
const patientLocationInputRef = ref()
const showAgreement = ref(false)

const communities = ref([])
const filteredPatientLocations = ref([])
const showPatientLocationSuggestions = ref(false)
const isSearchingPatientLocation = ref(false)
const isLocatingPatientLocation = ref(false)
const highlightedPatientLocationIndex = ref(-1)
const patientLocationStatus = ref('')
const patientMapStatus = ref('地图加载中')

const hospitals = ref([])
const filteredHospitals = ref([])
const showSuggestions = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-1)
const showInsuranceDetail = ref(false)
let debounceTimer = null
let patientLocationDebounceTimer = null
let patientLocationGeocodeTimer = null
let patientMap = null
let patientMarker = null
let patientGeocoder = null
let isSyncingPatientMap = false
const defaultPatientPoint = { lng: 116.4074, lat: 39.9042 }
const publicUrl = (path) => `${import.meta.env.BASE_URL || '/'}${path.replace(/^\//, '')}`

const loadHospitals = async () => {
  if (hospitals.value.length > 0) return

  try {
    const res = await fetch(publicUrl('/data/hospitals.json'))
    const data = await res.json()
    hospitals.value = data.hospitals || []
  } catch (e) {
    console.error('加载医院数据失败:', e)
  }
}

const loadCommunities = async () => {
  if (communities.value.length > 0) return

  try {
    const res = await fetch(publicUrl('/data/communities.json'))
    const data = await res.json()
    communities.value = data.communities || []
  } catch (e) {
    console.error('加载社区数据失败:', e)
  }
}

onMounted(async () => {
  await Promise.all([loadHospitals(), loadCommunities()])
  await nextTick()
  initPatientLocationMap()
})

const debounce = (fn, delay) => {
  return (...args) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fn(...args), delay)
  }
}

const searchPatientLocations = async (keyword) => {
  if (!keyword || keyword.length === 0) {
    filteredPatientLocations.value = []
    showPatientLocationSuggestions.value = false
    return
  }

  isSearchingPatientLocation.value = true
  await loadCommunities()

  const kw = keyword.toLowerCase()
  const matched = communities.value.filter(c => {
    return c.name.includes(keyword) ||
      c.name.toLowerCase().includes(kw) ||
      c.district.includes(keyword) ||
      c.area.includes(keyword)
  })

  const startsWith = matched.filter(c => c.name.startsWith(keyword) || c.area.startsWith(keyword))
  const contains = matched.filter(c => !startsWith.includes(c))

  filteredPatientLocations.value = [...startsWith, ...contains].slice(0, 8)
  isSearchingPatientLocation.value = false
  showPatientLocationSuggestions.value = true
  highlightedPatientLocationIndex.value = -1
}

const debouncedSearchPatientLocations = (keyword) => {
  clearTimeout(patientLocationDebounceTimer)
  patientLocationDebounceTimer = setTimeout(() => searchPatientLocations(keyword), 220)
}

const getPatientMapPoint = () => {
  const BMapGL = window.BMapGL
  if (!BMapGL) return null
  const lng = Number(form.longitude || defaultPatientPoint.lng)
  const lat = Number(form.latitude || defaultPatientPoint.lat)
  return new BMapGL.Point(lng, lat)
}

const setPatientMapPoint = (lat, lng, status = '已同步地图位置') => {
  if (!patientMap || !window.BMapGL || !lat || !lng) return
  const point = new window.BMapGL.Point(Number(lng), Number(lat))
  isSyncingPatientMap = true
  if (patientMarker) {
    patientMarker.setPosition(point)
  }
  patientMap.centerAndZoom(point, 16)
  setTimeout(() => {
    isSyncingPatientMap = false
  }, 200)
  patientMapStatus.value = status
}

const reversePatientPoint = (point) => {
  return new Promise((resolve) => {
    if (!patientGeocoder || !point) {
      resolve('')
      return
    }
    try {
      patientGeocoder.getLocation(point, (result) => {
        const address = result?.address ||
          result?.content?.address ||
          result?.surroundingPois?.[0]?.title ||
          ''
        resolve(address)
      })
    } catch (e) {
      resolve('')
    }
  })
}

const syncPatientLocationFromPoint = async (point, shouldReverse = true) => {
  if (!point) return
  form.latitude = Number(point.lat)
  form.longitude = Number(point.lng)
  if (patientMarker) patientMarker.setPosition(point)
  patientMapStatus.value = shouldReverse ? '正在同步地图位置...' : '已同步地图位置'
  if (!shouldReverse) return

  const address = await reversePatientPoint(point)
  if (address) {
    form.patient_location = address
    patientLocationStatus.value = '已通过地图更新'
  } else {
    form.patient_location = `地图选点 ${Number(point.lat).toFixed(6)}, ${Number(point.lng).toFixed(6)}`
    patientLocationStatus.value = '已记录地图坐标'
  }
  patientMapStatus.value = '已同步到输入框'
}

const initPatientLocationMap = () => {
  const container = document.getElementById('patient-location-map')
  if (!container) return

  const start = () => {
    const BMapGL = window.BMapGL
    if (!BMapGL || typeof BMapGL.Map !== 'function') {
      patientMapStatus.value = '地图暂未加载，可先输入地点'
      return
    }
    if (patientMap) return

    try {
      patientMap = new BMapGL.Map('patient-location-map')
      patientGeocoder = typeof BMapGL.Geocoder === 'function' ? new BMapGL.Geocoder() : null
      const point = getPatientMapPoint()
      patientMap.centerAndZoom(point, form.latitude && form.longitude ? 16 : 12)
      patientMap.enableScrollWheelZoom(false)

      patientMarker = new BMapGL.Marker(point)
      patientMap.addOverlay(patientMarker)
      if (typeof patientMarker.enableDragging === 'function') {
        patientMarker.enableDragging()
      }
      patientMarker.addEventListener('dragend', (event) => {
        const point = event?.latLng || event?.point || patientMarker.getPosition()
        syncPatientLocationFromPoint(point, true)
      })

      patientMap.addEventListener('dragend', () => {
        if (isSyncingPatientMap) return
        const center = patientMap.getCenter()
        syncPatientLocationFromPoint(center, true)
      })

      patientMapStatus.value = '可拖动地图调整位置'
    } catch (e) {
      patientMapStatus.value = '地图初始化失败，可先输入地点'
    }
  }

  if (window.BMapGL) {
    start()
  } else {
    window.addEventListener('baidu-map-ready', start, { once: true })
    setTimeout(() => {
      if (!patientMap) patientMapStatus.value = '地图暂未加载，可先输入地点'
    }, 5000)
  }
}

const geocodePatientLocation = async (address, silent = false) => {
  const location = String(address || '').trim()
  if (!location) {
    form.latitude = null
    form.longitude = null
    patientLocationStatus.value = ''
    return false
  }

  isLocatingPatientLocation.value = true
  patientLocationStatus.value = '正在定位...'

  try {
    const res = await request.get('/location/geocode', {
      params: { address: location }
    })
    if (res.code === 0 && res.data?.lat && res.data?.lng) {
      form.latitude = res.data.lat
      form.longitude = res.data.lng
      patientLocationStatus.value = '已定位'
      setPatientMapPoint(res.data.lat, res.data.lng, '已按输入地点定位')
      return true
    }
    throw new Error(res.message || '定位失败')
  } catch (e) {
    form.latitude = null
    form.longitude = null
    patientLocationStatus.value = silent ? '' : '定位失败，请补充更详细地址'
    return false
  } finally {
    isLocatingPatientLocation.value = false
  }
}

const geocodeTargetHospital = async (address) => {
  const hospital = String(address || '').trim()
  if (!hospital) {
    form.target_hospital_lat = null
    form.target_hospital_lng = null
    return false
  }

  try {
    const res = await request.get('/location/geocode', {
      params: { address: hospital }
    })
    if (res.code === 0 && res.data?.lat && res.data?.lng) {
      form.target_hospital_lat = res.data.lat
      form.target_hospital_lng = res.data.lng
      return true
    }
  } catch (e) {
    form.target_hospital_lat = null
    form.target_hospital_lng = null
  }
  return false
}

const debouncedGeocodePatientLocation = (address) => {
  clearTimeout(patientLocationGeocodeTimer)
  patientLocationGeocodeTimer = setTimeout(() => geocodePatientLocation(address, true), 800)
}

const onPatientLocationInput = (val) => {
  form.patient_location = val
  form.latitude = null
  form.longitude = null
  patientLocationStatus.value = ''
  highlightedPatientLocationIndex.value = -1

  if (val.length === 0) {
    showPatientLocationSuggestions.value = false
    filteredPatientLocations.value = []
    return
  }

  debouncedSearchPatientLocations(val)
  debouncedGeocodePatientLocation(val)
}

const onPatientLocationFocus = () => {
  if (form.patient_location.length > 0 && filteredPatientLocations.value.length > 0) {
    showPatientLocationSuggestions.value = true
  }
}

const onPatientLocationBlur = () => {
  setTimeout(() => {
    showPatientLocationSuggestions.value = false
    if (form.patient_location && (!form.latitude || !form.longitude)) {
      geocodePatientLocation(form.patient_location, true)
    }
  }, 200)
}

const navigatePatientLocationSuggestion = (direction) => {
  if (filteredPatientLocations.value.length === 0) return
  const newIndex = highlightedPatientLocationIndex.value + direction
  if (newIndex >= -1 && newIndex < filteredPatientLocations.value.length) {
    highlightedPatientLocationIndex.value = newIndex
  }
}

const selectHighlightedPatientLocation = () => {
  if (highlightedPatientLocationIndex.value >= 0 && highlightedPatientLocationIndex.value < filteredPatientLocations.value.length) {
    selectPatientLocation(filteredPatientLocations.value[highlightedPatientLocationIndex.value])
  }
}

const selectPatientLocation = (location) => {
  form.patient_location = location.name
  showPatientLocationSuggestions.value = false
  highlightedPatientLocationIndex.value = -1
  geocodePatientLocation(location.name)
}

const searchHospitals = (keyword) => {
  if (!keyword || keyword.length === 0) {
    filteredHospitals.value = []
    showSuggestions.value = false
    return
  }

  isSearching.value = true

  const kw = keyword.toLowerCase()
  const matched = hospitals.value.filter(h => {
    const nameMatch = h.name.toLowerCase().includes(kw)
    const cityMatch = h.city.toLowerCase().includes(kw)
    return nameMatch || cityMatch
  })

  const startsWith = matched.filter(h => h.name.startsWith(keyword))
  const contains = matched.filter(h => !h.name.startsWith(keyword))

  const levelOrder = { '三甲': 1, '三乙': 2, '二甲': 3, '二乙': 4, '社区': 5 }

  const sortByLevel = (arr) => {
    return arr.sort((a, b) => {
      const levelDiff = (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99)
      if (levelDiff !== 0) return levelDiff
      return a.name.localeCompare(b.name)
    })
  }

  filteredHospitals.value = [...sortByLevel(startsWith), ...sortByLevel(contains)].slice(0, 8)
  isSearching.value = false
  showSuggestions.value = true
  highlightedIndex.value = -1
}

const debouncedSearch = debounce(searchHospitals, 300)

const onHospitalInput = (val) => {
  form.address = val
  form.target_hospital_lat = null
  form.target_hospital_lng = null
  highlightedIndex.value = -1
  if (val.length === 0) {
    showSuggestions.value = false
    filteredHospitals.value = []
  } else {
    debouncedSearch(val)
  }
}

const onHospitalFocus = (val) => {
  if (form.address.length > 0 && filteredHospitals.value.length > 0) {
    showSuggestions.value = true
  }
}

const onHospitalBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const navigateSuggestion = (direction) => {
  if (filteredHospitals.value.length === 0) return

  const newIndex = highlightedIndex.value + direction
  if (newIndex >= -1 && newIndex < filteredHospitals.value.length) {
    highlightedIndex.value = newIndex
  }
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredHospitals.value.length) {
    selectHospital(filteredHospitals.value[highlightedIndex.value])
  }
}

const selectHospital = (hospital) => {
  form.address = hospital.name
  showSuggestions.value = false
  highlightedIndex.value = -1
  geocodeTargetHospital(hospital.name)
}

const deptInputRef = ref()
const departments = ref([])
const filteredDepts = ref([])
const showDeptSuggestions = ref(false)
const isSearchingDept = ref(false)
const highlightedDeptIndex = ref(-1)
let deptDebounceTimer = null

const loadDepartments = async () => {
  try {
    const res = await fetch(publicUrl('/data/departments.json'))
    const data = await res.json()
    departments.value = data.departments || []
  } catch (e) {
    console.error('加载科室数据失败:', e)
  }
}

const searchDepts = (keyword) => {
  if (!keyword || keyword.length === 0) {
    filteredDepts.value = []
    showDeptSuggestions.value = false
    return
  }

  isSearchingDept.value = true

  const matched = departments.value.filter(d => d.includes(keyword))

  const startsWith = matched.filter(d => d.startsWith(keyword))
  const contains = matched.filter(d => !d.startsWith(keyword))

  filteredDepts.value = [...startsWith, ...contains].slice(0, 8)
  isSearchingDept.value = false
  showDeptSuggestions.value = true
  highlightedDeptIndex.value = -1
}

const debouncedDeptSearch = (keyword) => {
  clearTimeout(deptDebounceTimer)
  deptDebounceTimer = setTimeout(() => searchDepts(keyword), 300)
}

const onDeptInput = (val) => {
  form.department = val
  highlightedDeptIndex.value = -1
  if (val.length === 0) {
    showDeptSuggestions.value = false
    filteredDepts.value = []
  } else {
    debouncedDeptSearch(val)
  }
}

const onDeptFocus = () => {
  if (form.department.length > 0 && filteredDepts.value.length > 0) {
    showDeptSuggestions.value = true
  }
}

const onDeptBlur = () => {
  setTimeout(() => {
    showDeptSuggestions.value = false
  }, 200)
}

const navigateDeptSuggestion = (direction) => {
  if (filteredDepts.value.length === 0) return

  const newIndex = highlightedDeptIndex.value + direction
  if (newIndex >= -1 && newIndex < filteredDepts.value.length) {
    highlightedDeptIndex.value = newIndex
  }
}

const selectHighlightedDept = () => {
  if (highlightedDeptIndex.value >= 0 && highlightedDeptIndex.value < filteredDepts.value.length) {
    selectDept(filteredDepts.value[highlightedDeptIndex.value])
  }
}

const selectDept = (dept) => {
  form.department = dept
  showDeptSuggestions.value = false
  highlightedDeptIndex.value = -1
}

onMounted(async () => {
  await loadHospitals()
  loadDepartments()
})

const escortSubTypes = [
  {
    id: 1,
    name: '全程陪同',
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M16 31c2.2-5.4 5-8 8.5-8s6.3 2.6 8.5 8" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="24.5" cy="16" r="6" stroke="currentColor" stroke-width="3.4"/><path d="M11 36h26" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M14 39h4M30 39h4" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
    desc: '从出发到返家，全程陪伴完成就诊所有环节',
    priceRange: '80-120元/半天'
  },
  {
    id: 2,
    name: '挂号取药',
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="13" y="11" width="22" height="28" rx="6" stroke="currentColor" stroke-width="3.4"/><path d="M19 20h10M19 27h8" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><path d="M32 32c3.3 0 5.8 2.5 5.8 5.8M32 32c0 3.3 2.5 5.8 5.8 5.8" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
    desc: '仅代为排队挂号、缴费、取药',
    priceRange: '30-50元/次'
  },
  {
    id: 3,
    name: '门诊陪护',
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M15 16c0-4.2 3.3-7.5 7.5-7.5S30 11.8 30 16v4H15v-4Z" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M13 22h20v13H13V22Z" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M10 39h26M17 35v4M29 35v4" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
    desc: '诊室外候诊、检查、缴费环节提供陪伴',
    priceRange: '50-80元/次'
  },
  {
    id: 4,
    name: '代为问诊',
    icon: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M12 13h24v20H22l-7 6v-6h-3V13Z" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/><path d="M20 22h8M20 28h5" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
    desc: '代替向医生描述病情、记录医嘱、取药',
    priceRange: '60-100元/次'
  }
]

const form = reactive({
  type: 1,
  sub_type: null,
  patient_location: '',
  latitude: null,
  longitude: null,
  address: '',
  target_hospital_lat: null,
  target_hospital_lng: null,
  department: '',
  patient_info: '',
  service_time_range: [],
  start_time: '',
  end_time: '',
  physical_level: 1,
  budget: null,
  special_requirements: '',
  special_assist: [],
  is_charity: false
})

const currentSubType = computed(() => {
  return escortSubTypes.find(sub => sub.id === form.sub_type)
})

const selectSubType = (id) => {
  form.sub_type = id
}

const rules = {
  sub_type: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  patient_location: [{ required: true, message: '请输入就诊人地点', trigger: 'blur' }],
  address: [{ required: true, message: '请输入医院名称', trigger: 'blur' }],
  service_time_range: [{
    validator: (_rule, value, callback) => {
      if (!Array.isArray(value) || !value[0] || !value[1]) {
        callback(new Error('请选择完整服务时间段'))
        return
      }
      callback()
    },
    trigger: 'change'
  }],
  budget: [{ required: true, message: '请输入预算', trigger: 'change' }]
}

const setServiceTimePart = (index, value) => {
  const next = [
    form.service_time_range?.[0] || null,
    form.service_time_range?.[1] || null
  ]
  next[index] = value || null
  form.service_time_range = next
}

const serviceStartTime = computed({
  get: () => form.service_time_range?.[0] || null,
  set: (value) => setServiceTimePart(0, value)
})

const serviceEndTime = computed({
  get: () => form.service_time_range?.[1] || null,
  set: (value) => setServiceTimePart(1, value)
})

const duration = computed(() => {
  if (!form.service_time_range || form.service_time_range.length !== 2) return 0
  const start = new Date(form.service_time_range[0]).getTime()
  const end = new Date(form.service_time_range[1]).getTime()
  return Math.round((end - start) / 60000)
})

const durationText = computed(() => {
  const total = duration.value
  if (total <= 0) return '未选择'
  if (total < 60) return `${total}分钟`
  const hours = total / 60
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}小时`
})

const suggestedPrice = computed(() => {
  const total = duration.value
  if (total <= 0) return 0
  return Math.round((total / 60) * 10)
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toISOString()
}

const handlePublish = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (duration.value <= 0) {
        ElMessage.warning('服务时间段的结束时间必须晚于开始时间')
        return
      }
      if (!form.latitude || !form.longitude) {
        const located = await geocodePatientLocation(form.patient_location)
        if (!located) {
          ElMessage.warning('请补充更详细的就诊人地点，方便陪诊师定位')
          return
        }
      }
      if (!form.target_hospital_lat || !form.target_hospital_lng) {
        await geocodeTargetHospital(form.address)
      }
      // V1.4: 先检查是否已签署协议
      try {
        const checkRes = await request.get('/v1/agreement/check/publish')
        if (checkRes.code === 0 && checkRes.data.signed) {
          doPublish()
        } else {
          showAgreement.value = true
        }
      } catch (e) {
        showAgreement.value = true
      }
    }
  })
}

const doPublish = async () => {
  loading.value = true
  try {
    const res = await request.post('/employer/tasks', {
      type: 1,
      sub_type: form.sub_type,
      address: form.patient_location,
      latitude: form.latitude,
      longitude: form.longitude,
      target_hospital: form.address,
      target_hospital_lat: form.target_hospital_lat,
      target_hospital_lng: form.target_hospital_lng,
      department: form.department,
      patient_info: form.patient_info,
      start_time: formatTime(form.service_time_range[0]),
      end_time: formatTime(form.service_time_range[1]),
      duration_minutes: duration.value,
      physical_level: form.physical_level,
      budget: form.budget,
      special_requirements: form.special_requirements,
      special_assist: form.special_assist,
      is_charity: form.is_charity
    })
    if (res.code === 0) {
      ElMessage.success('任务发布成功，已进入任务大厅')
      router.push({
        path: '/',
        query: {
          publishedTaskId: res.data?.task_id || '',
          service: currentSubType.value?.name || '',
          targetHospital: form.address
        }
      })
    }
  } catch (e) {
    console.error('发布失败:', e);
    ElMessage.error(e.response?.data?.message || e.message || '发布失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.publish {
  padding: 20px 16px;
  background-color: #ffffff;
}

.detail-header {
  display: flex;
  align-items: center;
  padding: 0;
  margin-bottom: 0;
}

.back-btn {
  width: 40px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 18px !important;
  background: #FFF9F2 !important;
  color: #4F3A32 !important;
  border: 1.5px solid transparent !important;
  border-radius: 12px !important;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 !important;
  min-height: 40px !important;
}

.back-btn:hover {
  background: #FFF0EC !important;
  color: #E94F3D !important;
  border-color: #E94F3D !important;
}

.back-btn:active {
  background: #FFF0EC !important;
}

.header {
  text-align: center;
  margin-bottom: 28px;
  padding: 16px 0;
}

.header h2 {
  font-size: 26px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #4F3A32;
}

.header p {
  color: #6D5146;
  font-size: 16px;
}

.sub-type-section {
  margin-bottom: 24px;
}

.service-notice {
  margin-top: 12px;
  padding: 10px 14px;
  background: #fff7e6;
  border-radius: 8px;
  font-size: 13px;
  color: #C98216;
  line-height: 1.5;
}

.service-notice strong {
  color: #d46b08;
}

.section-title {
  font-size: 17px;
  color: #4F3A32;
  margin-bottom: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title .required {
  color: #B84545;
  font-size: 18px;
}

.sub-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.sub-type-card {
  position: relative;
  padding: 20px 16px;
  border: 2px solid #EBD8CF;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 140px;
  justify-content: center;
}

.sub-type-card:hover {
  border-color: #E94F3D;
}

.sub-type-card.selected {
  border-color: #E94F3D;
  background: linear-gradient(135deg, #E94F3D 0%, #F6A21A 100%);
  color: white;
}

.sub-icon {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #FFF0EC;
  color: #E94F3D;
  line-height: 1;
  box-shadow: inset 0 0 0 1px rgba(233, 79, 61, 0.12);
}

.sub-icon :deep(svg) {
  width: 32px;
  height: 32px;
  display: block;
}

.sub-name {
  font-size: 18px;
  font-weight: 600;
}

.sub-price {
  font-size: 15px;
  font-weight: 500;
  opacity: 0.95;
}

.sub-desc {
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.4;
}

.check-mark {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  background: white;
  color: #E94F3D;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.sub-type-card.selected .check-mark {
  background: rgba(255,255,255,0.3);
  color: white;
}

:deep(.el-form-item__label) {
  font-size: 16px !important;
  font-weight: 500;
  color: #4F3A32;
  padding-top: 9px !important;
  padding-bottom: 9px !important;
  height: 44px !important;
  margin-top: 1px !important;
  margin-bottom: 1px !important;
  min-height: 24px;
}

:deep(.form-item--tight-bottom .el-form-item__label) {
  margin-bottom: 0 !important;
}

/* ===== Form 整体规范 ===== */
:deep(.el-form) {
  display: flex;
  flex-direction: column;
  gap: 0;
}

:deep(.el-form-item) {
  margin-bottom: 20px !important;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0 !important;
}

:deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  padding-left: 0 !important;
  position: relative;
}

:deep(.el-form-item__error) {
  padding-top: 4px;
  font-size: 13px;
  color: #B84545;
  line-height: 1.4;
  position: relative;
  top: auto;
  left: auto;
}

.sub-type-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
}

.sub-type-section .section-title {
  margin-bottom: 14px;
}

.sub-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* ===== 表单控件统一样式 ===== */
:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper),
:deep(.el-select__wrapper),
:deep(.el-date-editor.el-input__wrapper) {
  height: 48px !important;
  padding: 0 !important;
  padding-left: 16px !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 1px #E8D8CF inset !important;
  transition: box-shadow 0.2s;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.el-textarea__wrapper) {
  height: auto !important;
  min-height: 80px !important;
  align-items: flex-start !important;
  padding: 0 !important;
  background: #ffffff !important;
  border: 1px solid #E8D8CF !important;
  box-shadow: 0 0 0 1px #E8D8CF inset !important;
  border-radius: 12px !important;
  box-sizing: border-box !important;
  display: flex !important;
  transition: box-shadow 0.2s, border-color 0.2s;
}

:deep(.el-textarea__wrapper:hover) {
  border-color: #E94F3D !important;
  box-shadow: 0 0 0 1px #E94F3D inset !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-date-editor.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #E94F3D inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-date-editor.el-input__wrapper.is-active) {
  box-shadow: 0 0 0 1.5px #E94F3D inset !important;
}

:deep(.el-input__inner),
:deep(.el-input__inner[style*="padding-left"]) {
  height: 100% !important;
  line-height: 48px !important;
  font-size: 16px !important;
  color: #4F3A32 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  border-radius: 0 !important;
}

:deep(.el-textarea__inner) {
  height: auto !important;
  min-height: 80px !important;
  font-size: 16px !important;
  color: #4F3A32 !important;
  background: #ffffff !important;
  border: none !important;
  box-shadow: 0 0 0 1px #E8D8CF inset !important;
  padding: 14px 16px !important;
  line-height: 1.5 !important;
  resize: vertical;
  border-radius: 12px !important;
  transition: box-shadow 0.2s;
}

:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #E94F3D inset !important;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #E94F3D inset !important;
  outline: none !important;
}

:deep(.el-input.is-disabled .el-input__wrapper),
:deep(.el-textarea.is-disabled .el-textarea__wrapper),
:deep(.el-select.is-disabled .el-select__wrapper) {
  background: #FFF9F2 !important;
  box-shadow: 0 0 0 1px #EBD8CF inset !important;
  cursor: not-allowed;
}

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  height: 100%;
  color: #8A6C60;
}

:deep(.el-input__prefix .el-icon),
:deep(.el-input__suffix .el-icon) {
  font-size: 16px;
}

:deep(.el-input-group__prepend) {
  background: #FFF9F2 !important;
  color: #4F3A32 !important;
  border: none !important;
  border-right: none !important;
  border-radius: 12px 0 0 12px !important;
  padding: 0 16px !important;
  font-size: 16px !important;
  font-weight: 600;
}

:deep(.el-input-group .el-input__wrapper) {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

/* ===== 时间选择器面板响应式 ===== */
:deep(.el-time-panel) {
  width: auto !important;
  min-width: 120px;
  max-width: 300px;
}

:deep(.el-time-spinner) {
  width: auto !important;
}

:deep(.el-time-spinner__wrapper) {
  width: auto !important;
  min-width: 64px;
}

:deep(.el-time-panel__content) {
  display: flex;
  justify-content: center;
}

:deep(.el-picker-panel) {
  max-width: calc(100vw - 32px) !important;
  min-width: 0 !important;
  width: auto !important;
  box-sizing: border-box !important;
}

:deep(.el-picker-panel__body) {
  flex-wrap: wrap !important;
  flex-direction: column !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.el-picker-panel__body-wrapper) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.el-picker-panel__content) {
  flex: none !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:deep(.el-picker-panel__footer) {
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.el-popper) {
  max-width: calc(100vw - 16px) !important;
  width: auto !important;
}

:deep(.el-date-picker) {
  max-width: calc(100vw - 32px) !important;
  width: auto !important;
  min-width: 0 !important;
}

:deep(.el-date-picker .el-picker-panel__body) {
  flex-wrap: wrap !important;
  flex-direction: column !important;
}

:deep(.el-date-picker .el-picker-panel__content) {
  width: 100% !important;
}

/* 父容器确保宽度继承 */
.time-picker-container {
  width: 100%;
  box-sizing: border-box;
  padding: 0 16px;
}

/* picker 触发按钮（若是自定义按钮） */
.time-trigger {
  width: 100%;
  display: block;
  background: #FFF9F2;
  border-radius: 8px;
  padding: 12px 16px;
  box-sizing: border-box;
  font-size: 16px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 单选 / 多选控件 ===== */
:deep(.el-radio-group) {
  width: 300px;
  padding-left: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  min-height: 48px;
  line-height: 48px;
}

:deep(.el-checkbox-group) {
  width: 300px;
  padding-left: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  min-height: 48px;
  line-height: 48px;
}

:deep(.el-radio),
:deep(.el-checkbox) {
  margin-right: 24px;
  height: 48px;
  display: inline-flex;
  align-items: center;
}

:deep(.el-radio__label),
:deep(.el-checkbox__label) {
  font-size: 16px !important;
  color: #4F3A32;
  padding-left: 8px;
}

:deep(.el-radio__inner),
:deep(.el-checkbox__inner) {
  width: 20px !important;
  height: 20px !important;
  border: 1.5px solid #EBD8CF;
  background: #ffffff;
  transition: all 0.2s;
}

:deep(.el-radio__inner) {
  border-radius: 50%;
}

:deep(.el-checkbox__inner) {
  border-radius: 4px;
}

:deep(.el-radio__input.is-checked .el-radio__inner),
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #E94F3D !important;
  border-color: #E94F3D !important;
}

:deep(.el-radio__input.is-checked + .el-radio__label),
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #E94F3D;
  font-weight: 500;
}

.price-hint {
  font-size: 14px;
  color: #8A6C60;
  margin-top: 8px;
  margin-left: 1px;
  margin-right: 1px;
  width: 295px;
  font-weight: 500;
}

/* ===== 预算步进器（滑块输入部分） ===== */
.budget-slider-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.budget-slider-input {
  width: 180px;
}

.budget-unit {
  font-size: 16px;
  font-weight: 500;
  color: #4F3A32;
  flex-shrink: 0;
}

/* 隐藏滑块轨道，只保留输入框部分 */
:deep(.budget-slider-input .el-slider__runway) {
  display: none !important;
}

:deep(.budget-slider-input .el-slider__input) {
  width: 100%;
  margin-left: 0;
}

:deep(.budget-slider-input .el-slider__input .el-input__wrapper) {
  height: 48px !important;
  padding: 0 !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  box-shadow: 0 0 0 1px #E8D8CF inset !important;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.budget-slider-input .el-input-number__decrease),
:deep(.budget-slider-input .el-input-number__increase) {
  width: 36px !important;
  height: 36px !important;
  top: 6px !important;
  background: #FFF9F2 !important;
  border: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #4F3A32 !important;
}

:deep(.budget-slider-input .el-input-number__decrease) {
  left: 6px !important;
  right: auto !important;
  border-radius: 8px !important;
}

:deep(.budget-slider-input .el-input-number__increase) {
  right: 6px !important;
  border-radius: 8px !important;
}

:deep(.budget-slider-input .el-input-number__decrease:hover),
:deep(.budget-slider-input .el-input-number__increase:hover) {
  background: #FFF0EC !important;
}

:deep(.budget-slider-input .el-input__inner) {
  height: 100% !important;
  line-height: 48px !important;
  font-size: 16px !important;
  color: #4F3A32 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 40px !important;
  border-radius: 0 !important;
  text-align: center !important;
}

.insurance-badge {
  position: relative;
  height: 52px;
  padding: 0 16px 0 24px;
  background: linear-gradient(135deg, #FFF7E3 0%, #FFF3D8 100%);
  color: #654318;
  border-radius: 12px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #ead9ba;
}

.insurance-badge__text {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.insurance-badge__free {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #E94F3D, #F6A21A);
  padding: 2px 10px;
  border-radius: 10px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.insurance-badge__text::before {
  content: '🛡️';
  font-size: 20px;
  flex-shrink: 0;
}

.insurance-badge__detail {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #E94F3D;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.insurance-badge__detail:hover {
  background: rgba(67, 160, 71, 0.1);
}

.insurance-badge__detail .arrow {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.duration-display {
  display: inline-flex;
  align-items: center;
  height: 48px;
  width: 300px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #E94F3D;
  background: #FFF9F2;
  border-radius: 12px;
  line-height: 1;
}

.actions {
  margin-top: 64px;
  padding: 20px 0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, #FFF9F2 0%, rgba(245, 247, 250, 0.85) 60%, transparent 100%);
  position: sticky;
  bottom: 70px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions .el-button {
  width: 100%;
  height: 52px !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  letter-spacing: 2px;
}

.form-hint {
  font-size: 13px;
  color: #8A6C60;
  margin-top: 6px;
  line-height: 1.4;
}

.location-input-wrapper,
.hospital-input-wrapper {
  position: relative;
  width: 100%;
}

.location-input-wrapper {
  display: grid;
  gap: 8px;
}

.location-field-shell {
  position: relative;
  width: 100%;
  z-index: 5;
}

.location-suggestions,
.hospital-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #E9D4CA;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 2400;
  max-height: 320px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-loading,
.suggestion-empty {
  padding: 16px 20px;
  font-size: 15px;
  color: #8A6C60;
  text-align: center;
}

.suggestion-empty {
  color: #8A6C60;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #F2E6DE;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: #FFF9F2;
}

.suggestion-item.highlighted {
  background-color: #FFF0EC;
}

.hospital-name {
  flex: 1;
  font-size: 15px;
  color: #4F3A32;
  font-weight: 500;
}

.suggestion-name {
  flex: 1;
  min-width: 0;
  color: #4F3A32;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
}

.suggestion-district {
  flex: 0 0 auto;
  margin-left: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #E94F3D;
  font-size: 13px;
  font-weight: 900;
}

.location-status {
  margin-top: 0;
  padding: 8px 10px;
  border-radius: 12px;
  background: #FFF9F2;
  color: #E94F3D;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.35;
}

.location-status.locating {
  color: #8a6a24;
}

.patient-map-card {
  margin-top: 2px;
  padding: 10px;
  border: 1px solid #EBD8CF;
  border-radius: 16px;
  background: #fff;
}

.patient-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.patient-map-head strong {
  color: #4F3A32;
  font-size: 16px;
  line-height: 1.3;
  font-weight: 900;
}

.patient-map-head span {
  min-width: 0;
  color: #E94F3D;
  font-size: 13px;
  line-height: 1.3;
  font-weight: 900;
  text-align: right;
}

.patient-map {
  width: 100%;
  height: 132px;
  border-radius: 14px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(233, 79, 61, 0.08), rgba(246, 162, 26, 0.12)),
    #FFF9F2;
}

.patient-map-tip {
  margin: 8px 0 0;
  color: #8A6C60;
  font-size: 13px;
  line-height: 1.45;
  font-weight: 800;
}

.hospital-level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 12px;
  font-weight: 500;
}

.hospital-level.三甲 {
  background: #F9E7E3;
  color: #B84545;
}

.hospital-level.三乙 {
  background: #FFF3D8;
  color: #C98216;
}

.hospital-level.二甲 {
  background: #FFF0EC;
  color: #E94F3D;
}

.hospital-level.二乙 {
  background: #FFF3D8;
  color: #B66A25;
}

.hospital-level.社区 {
  background: #FFF9F2;
  color: #8A6C60;
}

.hospital-city {
  font-size: 13px;
  color: #8A6C60;
  min-width: 50px;
  text-align: right;
}

.dept-input-wrapper {
  position: relative;
  width: 100%;
}

.dept-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #E9D4CA;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1800;
  max-height: 240px;
  overflow-y: auto;
  margin-top: 4px;
}

.dept-suggestion-loading,
.dept-suggestion-empty {
  padding: 16px 20px;
  font-size: 15px;
  color: #8A6C60;
  text-align: center;
}

.dept-suggestion-empty {
  color: #8A6C60;
}

.dept-suggestion-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #F2E6DE;
}

.dept-suggestion-item:last-child {
  border-bottom: none;
}

.dept-suggestion-item:hover,
.dept-suggestion-item.highlighted {
  background-color: #FFF9F2;
}

.dept-suggestion-item.highlighted {
  background-color: #FFF0EC;
}

.dept-name {
  flex: 1;
  font-size: 15px;
  color: #4F3A32;
  font-weight: 500;
}

/* ===== 保险详情弹窗 ===== */
:deep(.el-dialog__body) {
  padding: 20px;
}

.insurance-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  font-size: 17px;
  font-weight: 700;
  color: #4F3A32;
  padding-bottom: 12px;
  border-bottom: 1px solid #EFE2DC;
  margin-bottom: 4px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.detail-label {
  font-size: 15px;
  color: #7D6257;
  font-weight: 400;
}

.detail-value {
  font-size: 15px;
  color: #4F3A32;
  font-weight: 600;
}

.publish > .detail-header {
  border-bottom: none !important;
}

/* 适老化统一风格：发布任务 */
.publish {
  min-height: 100vh;
  padding: 0 16px calc(360px + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
  color: #4F3A32;
}

.detail-header {
  padding: 14px 0 8px;
}

.back-btn {
  width: 46px !important;
  height: 46px !important;
  min-height: 46px !important;
  border-radius: 14px !important;
  background: #fff !important;
  color: #E94F3D !important;
  border-color: #E9D4CA !important;
  box-shadow: 0 8px 20px rgba(23, 35, 49, 0.08);
}

.header {
  margin: 0 0 18px;
  padding: 18px;
  border-radius: 20px;
  background: #E94F3D;
  text-align: left;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.12);
}

.header h2 {
  margin: 0 0 8px;
  font-size: 29px;
  line-height: 1.25;
  font-weight: 900;
  color: #fff;
}

.header p {
  margin: 0;
  font-size: 16px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

.sub-type-section,
:deep(.el-form-item) {
  margin-bottom: 16px !important;
  padding: 18px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 10px 24px rgba(23, 35, 49, 0.06);
  overflow: visible;
}

.section-title {
  margin-bottom: 14px;
  font-size: 21px;
  line-height: 1.3;
  font-weight: 900;
  color: #4F3A32;
}

.sub-type-grid {
  grid-template-columns: 1fr;
  gap: 10px;
}

.sub-type-card {
  min-height: 118px;
  padding: 16px;
  border: 1.5px solid #E9D4CA;
  border-radius: 18px;
  background: #fff;
}

.sub-type-card.selected {
  border-color: #E94F3D;
  background: #E94F3D;
  color: #fff;
}

.sub-type-card.selected .sub-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.sub-name {
  font-size: 20px;
  font-weight: 900;
}

.sub-price {
  font-size: 16px;
  font-weight: 800;
}

.sub-desc {
  font-size: 15px;
  line-height: 1.5;
}

.service-notice {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8e1bd;
  color: #654318;
  font-size: 15px;
}

:deep(.el-form-item) {
  display: block !important;
}

:deep(.el-form-item__label) {
  width: 100% !important;
  height: auto !important;
  justify-content: flex-start !important;
  padding: 0 0 10px !important;
  color: #4F3A32;
  font-size: 17px !important;
  font-weight: 900;
  line-height: 1.35 !important;
}

:deep(.el-form-item__content) {
  width: 100%;
  min-width: 0;
  margin-left: 0 !important;
  padding-top: 0;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__wrapper),
:deep(.el-select__wrapper),
:deep(.el-date-editor.el-input__wrapper) {
  min-height: 56px !important;
  height: auto !important;
  border-radius: 16px !important;
  background: #fff !important;
  box-shadow: 0 0 0 1.5px #EBD8CF inset !important;
}

:deep(.el-input__inner) {
  min-height: 56px !important;
  line-height: 56px !important;
  font-size: 17px !important;
}

.time-picker-shell {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 58px;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 16px;
  box-sizing: border-box;
}

:deep(.time-form-item .el-form-item__content) {
  overflow: hidden;
}

:deep(.time-picker.el-input),
:deep(.time-picker.el-date-editor) {
  width: 100% !important;
  max-width: 100% !important;
  height: 58px !important;
  min-height: 58px !important;
  min-width: 0 !important;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  box-sizing: border-box !important;
  overflow: hidden;
}

:deep(.time-picker .el-input__wrapper) {
  width: 100% !important;
  max-width: 100% !important;
  height: 56px !important;
  min-height: 56px !important;
  min-width: 0 !important;
  flex: 1 1 auto;
  box-sizing: border-box !important;
  padding: 0 12px !important;
  overflow: hidden;
}

:deep(.time-picker .el-input__inner) {
  min-width: 0 !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.time-range-picker) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: 64px !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  padding: 8px 10px !important;
  box-sizing: border-box !important;
  overflow: hidden;
}

:deep(.time-range-picker .el-range-input) {
  width: 100% !important;
  min-width: 0 !important;
  font-size: 15px !important;
  font-weight: 800;
  text-align: center;
}

:deep(.time-range-picker .el-range-separator) {
  width: auto !important;
  min-width: 20px;
  padding: 0 !important;
  color: #8A6C60 !important;
  font-weight: 900;
}

:deep(.time-range-picker .el-range__icon),
:deep(.time-range-picker .el-range__close-icon) {
  display: none !important;
}

:deep(.el-textarea__inner) {
  min-height: 96px !important;
  font-size: 17px !important;
  line-height: 1.55 !important;
}

:deep(.el-radio),
:deep(.el-checkbox) {
  min-height: 44px;
  align-items: center;
  margin-right: 18px;
}

:deep(.el-radio__label),
:deep(.el-checkbox__label) {
  font-size: 17px;
  font-weight: 800;
  color: #4F3A32;
}

.duration-display {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 14px;
  background: #FFF9F2;
  color: #E94F3D;
  font-size: 18px;
  font-weight: 900;
}

.budget-slider-input-wrap {
  gap: 10px;
  width: 100%;
  min-height: 58px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.budget-slider-input {
  width: 100%;
  height: 58px !important;
  min-height: 58px;
  min-width: 0;
  display: flex;
  align-items: center;
}

:deep(.budget-slider-input .el-slider__input) {
  width: 100% !important;
  margin-left: 0 !important;
}

:deep(.budget-slider-input .el-input-number) {
  width: 100% !important;
}

:deep(.budget-slider-input .el-slider__input .el-input__wrapper) {
  min-height: 56px !important;
  height: 56px !important;
  border-radius: 16px !important;
  box-shadow: 0 0 0 1.5px #EBD8CF inset !important;
}

:deep(.budget-slider-input .el-input-number__decrease),
:deep(.budget-slider-input .el-input-number__increase) {
  width: 42px !important;
  height: 42px !important;
  top: 7px !important;
  border-radius: 12px !important;
  background: #FFF0EC !important;
  color: #E94F3D !important;
}

:deep(.budget-slider-input .el-input__inner) {
  height: 56px !important;
  line-height: 56px !important;
  padding: 0 48px !important;
  font-size: 18px !important;
  font-weight: 900 !important;
  color: #4F3A32 !important;
}

.budget-unit {
  color: #E94F3D;
  font-size: 18px;
  font-weight: 900;
}

.price-hint {
  margin-top: 8px;
  color: #8A6C60;
  font-size: 15px;
  font-weight: 800;
}

.actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--global-tab-bar-height);
  z-index: 900;
  margin: 0;
  padding: 9px 12px 10px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #EBD8CF;
  box-shadow: 0 -8px 24px rgba(23, 35, 49, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 10px;
}

.insurance-badge {
  min-height: 58px;
  height: auto;
  padding: 8px 10px;
  border-radius: 14px;
  background: #f8e1bd;
  border-color: #ead9ba;
  color: #654318;
  flex-wrap: nowrap;
  align-items: center;
  margin: 0;
}

.insurance-badge__text {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 1.25;
  flex-wrap: wrap;
}

.insurance-badge__free {
  background: #E94F3D;
  color: #fff;
  white-space: nowrap;
}

.insurance-badge__detail {
  flex: 0 0 auto;
  color: #E94F3D;
  font-weight: 900;
}

:deep(.actions .el-button) {
  width: 100%;
  min-height: 58px;
  border-radius: 16px;
  background: #E94F3D;
  border-color: #E94F3D;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
}

.location-suggestions,
.hospital-suggestions,
.dept-suggestions {
  border-radius: 16px;
  border-color: #E9D4CA;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.12);
}

.suggestion-item,
.dept-suggestion-item {
  min-height: 52px;
  font-size: 16px;
}

.sub-type-card:hover {
  border-color: #E94F3D;
}

.check-mark {
  color: #E94F3D;
}

:deep(.el-button--primary),
:deep(.el-radio__input.is-checked .el-radio__inner),
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #E94F3D !important;
  border-color: #E94F3D !important;
}

:deep(.el-radio__input.is-checked + .el-radio__label),
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #E94F3D !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover),
:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #E94F3D inset !important;
}

.suggestion-item.highlighted,
.dept-suggestion-item.highlighted,
.suggestion-item:hover,
.dept-suggestion-item:hover {
  background: #FFF0EC;
}

.hospital-level.二甲,
.hospital-level.二乙,
.hospital-level.社区 {
  background: #FFF0EC;
  color: #E94F3D;
}

@media (max-width: 380px) {
  .insurance-badge__detail {
    margin-left: 0;
  }
}

@media (min-width: 560px) {
  .sub-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 全面精修：发布页 */
.publish {
  min-height: 100vh;
  padding: 14px 14px calc(300px + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, #F7F3EE 0%, #FBF8F4 46%, #F8F1EB 100%);
  color: var(--text-primary);
}

.detail-header {
  min-height: 44px;
  margin-bottom: 12px;
  background: transparent;
  border-bottom: none;
}

.back-btn {
  width: 42px !important;
  height: 42px !important;
  min-height: 42px !important;
  border-radius: 13px !important;
  background: rgba(255, 253, 251, 0.92) !important;
  border: 1px solid var(--line) !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

.sub-type-section,
:deep(.el-form-item) {
  margin-bottom: 12px !important;
  padding: 16px !important;
  border: 1px solid var(--line-soft) !important;
  border-radius: 16px !important;
  background: var(--bg-panel) !important;
  box-shadow: 0 8px 22px rgba(64, 48, 40, 0.055) !important;
}

.sub-type-section .section-title,
.section-title {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 800;
}

.sub-type-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sub-type-card {
  min-height: 154px;
  padding: 16px 14px;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #FFFCF8;
  box-shadow: none;
}

.sub-type-card.selected {
  background:
    linear-gradient(180deg, #D94A37 0%, #C94131 100%);
  box-shadow: 0 10px 22px rgba(217, 74, 55, 0.16);
}

.sub-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: var(--accent-light);
  color: var(--accent);
  box-shadow: none;
}

.sub-icon :deep(svg) {
  width: 28px;
  height: 28px;
}

.sub-name {
  font-size: 17px;
  font-weight: 800;
}

.sub-price {
  font-size: 14px;
  font-weight: 800;
}

.sub-desc {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.42;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.service-notice {
  border: 1px solid #EDDFC3;
  background: #FBF0DA;
  color: #805A25;
  box-shadow: none;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
  font-size: 15px !important;
  font-weight: 800 !important;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-date-editor) {
  border-radius: 13px !important;
  background: #FFFCF8 !important;
  box-shadow: 0 0 0 1px var(--line) inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__wrapper.is-focus),
:deep(.el-date-editor.is-active) {
  box-shadow: 0 0 0 1px var(--accent-soft) inset, 0 0 0 4px rgba(217, 74, 55, 0.08) !important;
}

.patient-map-card {
  border-color: var(--line-soft);
  border-radius: 15px;
  background: #FFFCF8;
  box-shadow: none;
}

.patient-map {
  border-radius: 12px;
}

.location-suggestions,
.hospital-suggestions,
.dept-suggestions {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg-panel);
  box-shadow: 0 14px 34px rgba(64, 48, 40, 0.10);
}

.suggestion-item,
.dept-suggestion-item {
  min-height: 48px;
}

.duration-display,
.budget-unit,
.price-hint,
.insurance-badge__detail {
  color: var(--accent);
}

.actions {
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(255, 253, 251, 0.96);
  border-top: 1px solid var(--line-soft);
  box-shadow: 0 -8px 22px rgba(64, 48, 40, 0.06);
}

.insurance-badge {
  min-height: 54px;
  border: 1px solid #EDDFC3;
  border-radius: 13px;
  background: #FBF0DA;
  color: #745322;
}

.insurance-badge__free {
  background: rgba(217, 74, 55, 0.12);
  color: var(--accent);
}

:deep(.actions .el-button) {
  min-height: 56px;
  border-radius: 14px;
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  box-shadow: none;
}

/* 边框核查：布局外壳不画线，真正可输入控件只保留一条边框 */
.location-input-wrapper,
.hospital-input-wrapper,
.dept-input-wrapper,
.location-field-shell,
.time-picker-shell,
.budget-slider-input-wrap,
:deep(.budget-slider-input .el-slider__input),
:deep(.budget-slider-input .el-input-number) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-date-editor.el-input__wrapper),
:deep(.time-range-picker),
:deep(.budget-slider-input .el-slider__input .el-input__wrapper) {
  border: 1px solid var(--line) !important;
  border-radius: 13px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__inner:hover),
:deep(.el-date-editor.el-input__wrapper:hover),
:deep(.time-range-picker:hover),
:deep(.budget-slider-input .el-slider__input .el-input__wrapper:hover) {
  border-color: var(--accent-soft) !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__inner:focus),
:deep(.el-date-editor.el-input__wrapper.is-active),
:deep(.time-range-picker.is-active),
:deep(.budget-slider-input .el-slider__input .el-input__wrapper.is-focus) {
  border-color: var(--accent) !important;
  box-shadow: none !important;
}

:deep(.time-range-picker .el-range-input),
:deep(.time-range-picker .el-range-separator),
:deep(.time-range-picker .el-range__icon),
:deep(.time-range-picker .el-range__close-icon) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.budget-slider-input .el-input-number__decrease),
:deep(.budget-slider-input .el-input-number__increase) {
  border: none !important;
  box-shadow: none !important;
}

/* 控件内部原生输入不画边框，避免圆角控件内出现直角内框 */
:deep(.el-input__inner),
:deep(.el-date-editor .el-input__inner),
:deep(.service-time-picker .el-input__inner),
:deep(.budget-slider-input .el-input__inner),
:deep(.el-range-input) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}
</style>

<style>
.el-time-panel {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}
.el-time-panel__footer{
  height: auto;
  .el-time-panel__btn{
    padding: 2px 12px;
  }
}
</style>
