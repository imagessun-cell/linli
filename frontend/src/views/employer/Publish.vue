<template>
  <div class="publish">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">✕</button>
    </header>
    <div class="header">
      <h2>发布陪诊任务</h2>
      <p>选择子服务，精准匹配陪诊师</p>
    </div>

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
            <span class="sub-icon">{{ sub.icon }}</span>
            <span class="sub-name">{{ sub.name }}</span>
            <span class="sub-price">{{ sub.priceRange }}</span>
            <span class="sub-desc">{{ sub.desc }}</span>
            <span v-if="form.sub_type === sub.id" class="check-mark">✓</span>
          </div>
        </div>
      </div>

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

      <el-form-item label="期望时间" prop="start_time">
        <el-date-picker v-model="form.start_time" type="datetime" placeholder="选择开始时间" style="width: 100%" />
      </el-form-item>

      <el-form-item label="结束时间" prop="end_time">
        <el-date-picker v-model="form.end_time" type="datetime" placeholder="选择结束时间" style="width: 100%" />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const hospitalInputRef = ref()

const hospitals = ref([])
const filteredHospitals = ref([])
const showSuggestions = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-1)
const showInsuranceDetail = ref(false)
let debounceTimer = null

onMounted(async () => {
  try {
    const res = await fetch('/data/hospitals.json')
    const data = await res.json()
    hospitals.value = data.hospitals || []
  } catch (e) {
    console.error('加载医院数据失败:', e)
  }
})

const debounce = (fn, delay) => {
  return (...args) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fn(...args), delay)
  }
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
    const res = await fetch('/data/departments.json')
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
  try {
    const res = await fetch('/data/hospitals.json')
    const data = await res.json()
    hospitals.value = data.hospitals || []
  } catch (e) {
    console.error('加载医院数据失败:', e)
  }
  loadDepartments()
})

const escortSubTypes = [
  { id: 1, name: '全程陪同', icon: '👣', desc: '从出发到返家，全程陪伴完成就诊所有环节', priceRange: '80-120元/半天' },
  { id: 2, name: '挂号取药', icon: '💊', desc: '仅代为排队挂号、缴费、取药', priceRange: '30-50元/次' },
  { id: 3, name: '门诊陪护', icon: '🪑', desc: '诊室外候诊、检查、缴费环节提供陪伴', priceRange: '50-80元/次' },
  { id: 4, name: '代为问诊', icon: '📝', desc: '代替向医生描述病情、记录医嘱、取药', priceRange: '60-100元/次' },
  { id: 5, name: '陪诊师培训', icon: '🎓', desc: '为新陪诊师提供专业培训，涵盖服务流程、沟通技巧等', priceRange: '免费/公益' }
]

const form = reactive({
  type: 1,
  sub_type: null,
  address: '',
  department: '',
  patient_info: '',
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
  address: [{ required: true, message: '请输入医院名称', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'change' }]
}

const duration = computed(() => {
  if (!form.start_time || !form.end_time) return 0
  const start = new Date(form.start_time).getTime()
  const end = new Date(form.end_time).getTime()
  return Math.round((end - start) / 60000)
})

const durationText = computed(() => {
  const total = duration.value
  if (total <= 0) return '未选择'
  const days = Math.floor(total / 1440)
  const hours = Math.floor((total % 1440) / 60)
  const mins = total % 60
  const parts = []
  if (days > 0) parts.push(`${days} 天`)
  if (hours > 0) parts.push(`${hours} 小时`)
  if (mins > 0) parts.push(`${mins} 分钟`)
  if (parts.length === 0) return '不足 1 分钟'
  return `约 ${parts.join(' ')}`
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

watch(() => form.special_assist, (val) => {
  if (val.length > 0) {
    form.special_requirements = form.special_requirements
      ? form.special_requirements + ' | 需要：' + val.join('、')
      : '需要：' + val.join('、')
  }
})

const handlePublish = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (duration.value <= 0) {
        ElMessage.warning('结束时间必须晚于开始时间')
        return
      }
      loading.value = true
      try {
        const res = await request.post('/employer/tasks', {
          type: 1,
          sub_type: form.sub_type,
          address: form.address,
          department: form.department,
          patient_info: form.patient_info,
          start_time: formatTime(form.start_time),
          end_time: formatTime(form.end_time),
          duration_minutes: duration.value,
          physical_level: form.physical_level,
          budget: form.budget,
          special_requirements: form.special_requirements,
          is_charity: form.is_charity
        })
        if (res.code === 0) {
          ElMessage.success('任务发布成功')
          router.push('/employer/orders')
        }
      } catch (e) {
        console.error('发布失败:', e);
        ElMessage.error(e.response?.data?.message || e.message || '发布失败，请重试')
      } finally {
        loading.value = false
      }
    }
  })
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

.header {
  text-align: center;
  margin-bottom: 28px;
  padding: 16px 0;
}

.header h2 {
  font-size: 26px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #303133;
}

.header p {
  color: #606266;
  font-size: 16px;
}

.sub-type-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 17px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title .required {
  color: #f56c6c;
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
  border: 2px solid #dcdfe6;
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
  border-color: #409eff;
}

.sub-type-card.selected {
  border-color: #409eff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sub-icon {
  font-size: 32px;
  line-height: 1;
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
  color: #409eff;
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
  color: #303133;
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
  color: #f56c6c;
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
  box-shadow: 0 0 0 1px #E2E6EC inset !important;
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
  border: 1px solid #E2E6EC !important;
  box-shadow: 0 0 0 1px #E2E6EC inset !important;
  border-radius: 12px !important;
  box-sizing: border-box !important;
  display: flex !important;
  transition: box-shadow 0.2s, border-color 0.2s;
}

:deep(.el-textarea__wrapper:hover) {
  border-color: #2c7a9e !important;
  box-shadow: 0 0 0 1px #2c7a9e inset !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-textarea__wrapper:hover),
:deep(.el-select__wrapper:hover),
:deep(.el-date-editor.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #2c7a9e inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-textarea__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-date-editor.el-input__wrapper.is-active) {
  box-shadow: 0 0 0 1.5px #2c7a9e inset !important;
}

:deep(.el-input__inner),
:deep(.el-input__inner[style*="padding-left"]) {
  height: 100% !important;
  line-height: 48px !important;
  font-size: 16px !important;
  color: #1E2A3A !important;
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
  color: #1E2A3A !important;
  background: #ffffff !important;
  border: none !important;
  box-shadow: 0 0 0 1px #E2E6EC inset !important;
  padding: 14px 16px !important;
  line-height: 1.5 !important;
  resize: vertical;
  border-radius: 12px !important;
  transition: box-shadow 0.2s;
}

:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #2c7a9e inset !important;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #2c7a9e inset !important;
  outline: none !important;
}

:deep(.el-input.is-disabled .el-input__wrapper),
:deep(.el-textarea.is-disabled .el-textarea__wrapper),
:deep(.el-select.is-disabled .el-select__wrapper) {
  background: #f5f7fa !important;
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
  cursor: not-allowed;
}

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  height: 100%;
  color: #909399;
}

:deep(.el-input__prefix .el-icon),
:deep(.el-input__suffix .el-icon) {
  font-size: 16px;
}

:deep(.el-input-group__prepend) {
  background: #f5f7fa !important;
  color: #1E2A3A !important;
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
  background: #f5f5f5;
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
  color: #303133;
  padding-left: 8px;
}

:deep(.el-radio__inner),
:deep(.el-checkbox__inner) {
  width: 20px !important;
  height: 20px !important;
  border: 1.5px solid #dcdfe6;
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
  background: #2c7a9e !important;
  border-color: #2c7a9e !important;
}

:deep(.el-radio__input.is-checked + .el-radio__label),
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #2c7a9e;
  font-weight: 500;
}

.price-hint {
  font-size: 14px;
  color: #909399;
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
  color: #1E2A3A;
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
  box-shadow: 0 0 0 1px #E2E6EC inset !important;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.budget-slider-input .el-input-number__decrease),
:deep(.budget-slider-input .el-input-number__increase) {
  width: 36px !important;
  height: 36px !important;
  top: 6px !important;
  background: #f5f7fa !important;
  border: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #1E2A3A !important;
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
  background: #e8ecf2 !important;
}

:deep(.budget-slider-input .el-input__inner) {
  height: 100% !important;
  line-height: 48px !important;
  font-size: 16px !important;
  color: #1E2A3A !important;
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
  background: linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%);
  color: #2e7d32;
  border-radius: 12px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #c8e6c9;
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
  background: linear-gradient(135deg, #66bb6a, #43a047);
  padding: 2px 10px;
  border-radius: 10px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.insurance-badge__text::before {
  content: '🛡️';
  font-size: 24px;
  flex-shrink: 0;
}

.insurance-badge__detail {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #43a047;
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
  color: #2c7a9e;
  background: #f5f7fa;
  border-radius: 12px;
  line-height: 1;
}

.actions {
  margin-top: 64px;
  padding: 20px 0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, #f5f7fa 0%, rgba(245, 247, 250, 0.85) 60%, transparent 100%);
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
  color: #909399;
  margin-top: 6px;
  line-height: 1.4;
}

.hospital-input-wrapper {
  position: relative;
  width: 100%;
}

.hospital-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-height: 320px;
  overflow-y: auto;
  margin-top: 4px;
}

.suggestion-loading,
.suggestion-empty {
  padding: 16px 20px;
  font-size: 15px;
  color: #909399;
  text-align: center;
}

.suggestion-empty {
  color: #c0c4cc;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: #f5f7fa;
}

.suggestion-item.highlighted {
  background-color: #ecf5ff;
}

.hospital-name {
  flex: 1;
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.hospital-level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 12px;
  font-weight: 500;
}

.hospital-level.三甲 {
  background: #fef0f0;
  color: #f56c6c;
}

.hospital-level.三乙 {
  background: #fdf6ec;
  color: #e6a23c;
}

.hospital-level.二甲 {
  background: #ecf5ff;
  color: #409eff;
}

.hospital-level.二乙 {
  background: #f0f9eb;
  color: #67c23a;
}

.hospital-level.社区 {
  background: #f4f4f5;
  color: #909399;
}

.hospital-city {
  font-size: 13px;
  color: #909399;
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
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  margin-top: 4px;
}

.dept-suggestion-loading,
.dept-suggestion-empty {
  padding: 16px 20px;
  font-size: 15px;
  color: #909399;
  text-align: center;
}

.dept-suggestion-empty {
  color: #c0c4cc;
}

.dept-suggestion-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.dept-suggestion-item:last-child {
  border-bottom: none;
}

.dept-suggestion-item:hover,
.dept-suggestion-item.highlighted {
  background-color: #f5f7fa;
}

.dept-suggestion-item.highlighted {
  background-color: #ecf5ff;
}

.dept-name {
  flex: 1;
  font-size: 15px;
  color: #303133;
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
  color: #1E2A3A;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef0f4;
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
  color: #666;
  font-weight: 400;
}

.detail-value {
  font-size: 15px;
  color: #1E2A3A;
  font-weight: 600;
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