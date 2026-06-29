<template>
  <div class="apply">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">✕</button>
    </header>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="年龄" prop="age">
        <div class="budget-slider-input-wrap">
          <el-slider v-model="form.age" :min="50" :max="65" :step="1" show-input class="budget-slider-input" />
          <span class="budget-unit">岁</span>
        </div>
      </el-form-item>

      <el-form-item label="所属社区" prop="community">
        <div class="hospital-input-wrapper">
          <el-input
            ref="communityInputRef"
            v-model="form.community"
            placeholder="请输入您所在的社区"
            @input="onCommunityInput"
            @focus="onCommunityFocus"
            @blur="onCommunityBlur"
            @keydown.up.prevent="navigateSuggestion(-1)"
            @keydown.down.prevent="navigateSuggestion(1)"
            @keydown.enter.prevent="selectHighlighted"
          />
          <div v-if="showSuggestions" class="hospital-suggestions">
            <div v-if="isSearching" class="suggestion-loading">
              <span>正在搜索...</span>
            </div>
            <div v-else-if="filteredCommunities.length === 0" class="suggestion-empty">
              无匹配社区，可继续手动输入
            </div>
            <div
              v-else
              v-for="(community, index) in filteredCommunities"
              :key="community.name"
              :class="['suggestion-item', { highlighted: highlightedIndex === index }]"
              @click="selectCommunity(community)"
              @mouseenter="highlightedIndex = index"
            >
              <span class="suggestion-name">{{ community.name }}</span>
              <span class="suggestion-district">{{ community.district }}</span>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="服务范围" prop="service_radius">
        <div class="budget-slider-input-wrap">
          <el-slider v-model="form.service_radius" :min="1" :max="5" :step="1" show-input class="budget-slider-input" />
          <span class="budget-unit">公里</span>
        </div>
      </el-form-item>

      <el-form-item label="技能标签" prop="skills">
        <el-checkbox-group v-model="form.skills">
          <el-checkbox label="全程陪同">👣 全程陪同</el-checkbox>
          <el-checkbox label="挂号取药">💊 挂号取药</el-checkbox>
          <el-checkbox label="门诊陪护">🪑 门诊陪护</el-checkbox>
          <el-checkbox label="代为问诊">📝 代为问诊</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="服务时间段" prop="service_periods">
        <el-checkbox-group v-model="form.service_periods" class="period-group">
          <el-checkbox-button
            v-for="period in servicePeriodOptions"
            :key="period.value"
            :label="period.value"
          >
            <span class="period-label">{{ period.label }}</span>
            <span class="period-time">{{ period.time }}</span>
          </el-checkbox-button>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="实名认证" prop="id_card_front">
        <div class="id-upload-grid">
          <input ref="idFrontInputRef" class="hidden-file-input" type="file" accept="image/*" capture="environment" @change="handleIdFileChange($event, 'front')" />
          <input ref="idBackInputRef" class="hidden-file-input" type="file" accept="image/*" capture="environment" @change="handleIdFileChange($event, 'back')" />
          <button :class="['id-upload-card', { selected: form.id_card_front }]" type="button" @click="idFrontInputRef?.click()">
            <span class="id-upload-icon">人像面</span>
            <strong>{{ form.id_card_front ? '已上传' : '扫描/拍照上传正面' }}</strong>
            <em>{{ form.id_card_front || '用于核验本人身份' }}</em>
          </button>
          <button :class="['id-upload-card', { selected: form.id_card_back }]" type="button" @click="idBackInputRef?.click()">
            <span class="id-upload-icon">国徽面</span>
            <strong>{{ form.id_card_back ? '已上传' : '扫描/拍照上传反面' }}</strong>
            <em>{{ form.id_card_back || '仅用于平台认证' }}</em>
          </button>
        </div>
      </el-form-item>

      <el-form-item label="联系人" prop="emergency_contact_name">
        <el-input v-model="form.emergency_contact_name" placeholder="联系人姓名" />
      </el-form-item>

      <el-form-item label="联系电话" prop="emergency_contact_phone">
        <el-input v-model="form.emergency_contact_phone" placeholder="联系人电话" />
      </el-form-item>
    </el-form>

    <div class="actions">
      <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
        提交认证
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const communityInputRef = ref()
const idFrontInputRef = ref()
const idBackInputRef = ref()

// 社区自动补全
const allCommunities = ref([])
const filteredCommunities = ref([])
const showSuggestions = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-1)
let debounceTimer = null
const publicUrl = (path) => `${import.meta.env.BASE_URL || '/'}${path.replace(/^\//, '')}`

const loadCommunities = async () => {
  try {
    const res = await fetch(publicUrl('/data/communities.json'))
    const data = await res.json()
    allCommunities.value = data.communities
  } catch (e) {
    console.error('加载社区数据失败:', e)
  }
}

const onCommunityInput = () => {
  const keyword = form.community.trim()
  if (!keyword) {
    filteredCommunities.value = []
    showSuggestions.value = false
    return
  }
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const lower = keyword.toLowerCase()
    filteredCommunities.value = allCommunities.value.filter(c =>
      c.name.includes(keyword) || c.name.toLowerCase().includes(lower) || c.district.includes(keyword)
    ).slice(0, 10)
    showSuggestions.value = true
    highlightedIndex.value = -1
  }, 200)
}

const onCommunityFocus = () => {
  if (filteredCommunities.value.length > 0) {
    showSuggestions.value = true
  }
}

const onCommunityBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const navigateSuggestion = (direction) => {
  const len = filteredCommunities.value.length
  if (len === 0) return
  highlightedIndex.value = (highlightedIndex.value + direction + len) % len
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredCommunities.value.length) {
    selectCommunity(filteredCommunities.value[highlightedIndex.value])
  }
}

const selectCommunity = (community) => {
  form.community = community.name
  showSuggestions.value = false
  filteredCommunities.value = []
}

const form = reactive({
  age: 50,
  community: '',
  service_radius: 3,
  skills: [],
  service_periods: [],
  id_card_front: '',
  id_card_back: '',
  emergency_contact_name: '',
  emergency_contact_phone: ''
})

const servicePeriodOptions = [
  { value: 'weekday_morning', label: '工作日上午', time: '08:00-12:00' },
  { value: 'weekday_afternoon', label: '工作日下午', time: '13:00-18:00' },
  { value: 'weekday_evening', label: '工作日晚上', time: '18:00-21:00' },
  { value: 'weekend', label: '周末可服务', time: '08:00-18:00' }
]

const rules = {
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  community: [{ required: true, message: '请输入所属社区', trigger: 'blur' }],
  skills: [{ type: 'array', required: true, min: 1, message: '请选择至少一个技能', trigger: 'change' }],
  service_periods: [{ type: 'array', required: true, min: 1, message: '请选择可服务时间段', trigger: 'change' }],
  id_card_front: [{
    validator: (_rule, _value, callback) => {
      if (!form.id_card_front || !form.id_card_back) {
        callback(new Error('请上传身份证正反面'))
        return
      }
      callback()
    },
    trigger: 'change'
  }],
  emergency_contact_name: [{ required: true, message: '请填写联系人', trigger: 'blur' }],
  emergency_contact_phone: [
    { required: true, message: '请填写联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const handleIdFileChange = (event, side) => {
  const file = event.target.files?.[0]
  if (!file) return
  const name = file.name || (side === 'front' ? '身份证正面' : '身份证反面')
  if (side === 'front') {
    form.id_card_front = name
  } else {
    form.id_card_back = name
  }
  formRef.value?.validateField('id_card_front')
  event.target.value = ''
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.age < 50 || form.age > 65) {
        ElMessage.warning('年龄必须在50-65岁之间')
        return
      }
      loading.value = true
      try {
        const payload = { ...form, service_radius: form.service_radius * 1000 }
        const res = await request.post('/worker/apply', payload)
        if (res.code === 0) {
          ElMessage.success('认证申请已提交，已进入我的任务')
          router.push('/worker/my-tasks')
        }
      } catch (e) {
        ElMessage.error(e.message || '提交失败')
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(async () => {
  loadCommunities()
  await userStore.fetchProfile()
  const worker = userStore.userInfo?.worker
  if (worker) {
    form.age = worker.age
    form.community = worker.community
    form.service_radius = Math.round((worker.service_radius || 3000) / 1000)
    form.skills = JSON.parse(worker.skills || '[]')
    form.service_periods = JSON.parse(worker.service_periods || '[]')
    form.id_card_front = worker.id_card_front || ''
    form.id_card_back = worker.id_card_back || ''
    form.emergency_contact_name = worker.emergency_contact_name || ''
    form.emergency_contact_phone = worker.emergency_contact_phone || ''
  }
})
</script>

<style scoped>
.apply {
  min-height: 100vh;
  min-height: calc(100vh - 70px); /* 减去底部导航 */
  padding: 20px 16px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.apply .el-form {
  flex: 1;
  overflow-y: auto;
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

/* ===== Form 整体规范（与发布任务统一） ===== */
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

:deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  padding-left: 0 !important;
  position: relative;
  overflow: visible;
}

:deep(.el-form-item__error) {
  padding-top: 4px;
  font-size: 13px;
  color: #B84545;
  line-height: 1.4;
  position: relative;
  top: auto;
  left: auto;
  text-align: left;
}

/* ===== 表单控件统一样式（与发布任务统一） ===== */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
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

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #E94F3D inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1.5px #E94F3D inset !important;
}

:deep(.el-input__inner) {
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

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  height: 100%;
  color: #8A6C60;
}

/* ===== 下拉选择器（与发布任务统一） ===== */
:deep(.el-select__wrapper) {
  min-height: 48px !important;
}

:deep(.el-select__placeholder) {
  font-size: 16px !important;
}

:deep(.el-select__caret) {
  font-size: 16px !important;
}

/* ===== 复选框（与发布任务统一） ===== */
:deep(.el-checkbox-group) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  min-height: 48px;
  line-height: 48px;
}

:deep(.el-checkbox) {
  margin-right: 24px;
  height: 48px !important;
  display: inline-flex !important;
  align-items: center !important;
}

:deep(.el-checkbox__label) {
  font-size: 16px !important;
  color: #4F3A32 !important;
}

:deep(.el-checkbox__inner) {
  width: 20px !important;
  height: 20px !important;
  border-radius: 5px !important;
  border-color: #D7BEB2 !important;
}

:deep(.el-checkbox.is-checked .el-checkbox__inner) {
  background-color: #E94F3D !important;
  border-color: #E94F3D !important;
}

:deep(.el-checkbox.is-checked .el-checkbox__label) {
  color: #E94F3D !important;
}

/* ===== 步进器（与预算控件统一） ===== */
.budget-slider-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  overflow: visible;
}

.budget-slider-input {
  width: 140px;
  overflow: visible;
}

:deep(.budget-slider-input) {
  overflow: visible !important;
}

.budget-unit {
  font-size: 16px;
  font-weight: 500;
  color: #4F3A32;
  flex-shrink: 0;
}

:deep(.budget-slider-input .el-slider__runway) {
  display: none !important;
}

:deep(.budget-slider-input .el-slider__input) {
  width: 100%;
  margin-left: 0;
  overflow: visible !important;
}

:deep(.budget-slider-input .el-input-number) {
  overflow: visible !important;
}

:deep(.budget-slider-input .el-slider__input .el-input-number__decrease),
:deep(.budget-slider-input .el-slider__input .el-input-number__increase) {
  z-index: 1;
}

:deep(.budget-slider-input .el-slider__input > .el-input__wrapper) {
  height: 48px !important;
  padding: 0 !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  border: 1px solid #E8D8CF !important;
  outline: none !important;
  box-shadow: none !important;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.budget-slider-input .el-slider__input > .el-input__wrapper:hover) {
  border-color: #E94F3D !important;
}

:deep(.budget-slider-input .el-slider__input .el-input-number__decrease),
:deep(.budget-slider-input .el-slider__input .el-input-number__increase) {
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

/* ===== 社区搜索建议（与医院搜索统一） ===== */
.hospital-input-wrapper {
  position: relative;
  width: 100%;
}

.hospital-suggestions {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  z-index: 1800;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-loading,
.suggestion-empty {
  padding: 14px 16px;
  font-size: 14px;
  color: #8A6C60;
  text-align: center;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #F2E6DE;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: #FFF9F2;
}

.suggestion-name {
  font-size: 15px;
  color: #4F3A32;
  flex: 1;
}

.suggestion-district {
  font-size: 12px;
  color: #8A6C60;
  padding: 2px 8px;
  background: #F2E6DE;
  border-radius: 4px;
  flex-shrink: 0;
}

/* ===== 操作按钮区域（与发布任务统一） ===== */
.actions {
  margin-top: 48px;
  padding: 20px 0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, #FFF9F2 0%, rgba(245, 247, 250, 0.85) 60%, transparent 100%);
  position: sticky;
  bottom: 70px;
  z-index: 10;
}

.actions .el-button {
  width: 100%;
  height: 52px !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  border-radius: 12px !important;
  letter-spacing: 2px;
}

/* 适老化统一风格：我是陪诊师 */
.apply {
  min-height: 100vh;
  padding: 0 16px calc(188px + env(safe-area-inset-bottom));
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
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  line-height: 1.55;
}

:deep(.el-form-item) {
  display: block !important;
  margin-bottom: 16px !important;
  padding: 18px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 10px 24px rgba(23, 35, 49, 0.06);
  overflow: visible;
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
:deep(.el-select__wrapper) {
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

:deep(.el-checkbox-group) {
  gap: 8px 12px;
  min-height: 0;
  line-height: 1.4;
}

:deep(.el-checkbox) {
  min-height: 44px;
  height: auto !important;
  margin-right: 0;
  align-items: center;
}

:deep(.el-checkbox__label) {
  font-size: 17px !important;
  font-weight: 800;
  color: #4F3A32 !important;
  white-space: normal;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #E94F3D !important;
  border-color: #E94F3D !important;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #E94F3D !important;
}

.period-group {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

:deep(.period-group .el-checkbox-button) {
  width: 100%;
}

:deep(.period-group .el-checkbox-button__inner) {
  width: 100%;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 5px;
  border: 1.5px solid #EBD8CF !important;
  border-radius: 16px !important;
  background: #fff !important;
  color: #4F3A32 !important;
  box-shadow: none !important;
  white-space: normal;
  text-align: left;
  padding: 12px;
}

:deep(.period-group .el-checkbox-button.is-checked .el-checkbox-button__inner) {
  border-color: #E94F3D !important;
  background: #FFF0EC !important;
  color: #E94F3D !important;
}

.period-label,
.period-time {
  display: block;
  line-height: 1.2;
}

.period-label {
  font-size: 16px;
  font-weight: 900;
}

.period-time {
  font-size: 13px;
  font-weight: 800;
  color: #8A6C60;
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

:deep(.budget-slider-input .el-slider__runway) {
  display: none !important;
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

.hospital-suggestions {
  border-radius: 16px;
  border: 1px solid #E9D4CA;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.12);
}

.suggestion-item {
  min-height: 52px;
  font-size: 16px;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: #FFF0EC;
}

.actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--global-tab-bar-height);
  z-index: 20;
  margin: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #EBD8CF;
  box-shadow: 0 -8px 24px rgba(23, 35, 49, 0.08);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.actions .el-button {
  width: 100%;
  min-height: 58px !important;
  height: auto !important;
  border-radius: 16px !important;
  background: #E94F3D !important;
  border-color: #E94F3D !important;
  color: #fff !important;
  font-size: 18px !important;
  font-weight: 900 !important;
  letter-spacing: 0;
}

.actions .el-button:hover,
.actions .el-button:focus,
.actions .el-button:focus-visible,
:deep(.actions .el-button:hover),
:deep(.actions .el-button:focus),
:deep(.actions .el-button:focus-visible) {
  background: #C94131 !important;
  border-color: #C94131 !important;
  color: #fff !important;
}

.actions .el-button:active,
:deep(.actions .el-button:active) {
  background: #B83A2E !important;
  border-color: #B83A2E !important;
  color: #fff !important;
}

.actions :deep(.el-button > span) {
  color: inherit;
}

/* 全面精修：陪诊师认证页 */
.apply {
  min-height: 100vh;
  padding: 14px 14px calc(160px + env(safe-area-inset-bottom));
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

:deep(.el-form-item) {
  margin-bottom: 12px !important;
  padding: 16px !important;
  border: 1px solid var(--line-soft) !important;
  border-radius: 16px !important;
  background: var(--bg-panel) !important;
  box-shadow: 0 8px 22px rgba(64, 48, 40, 0.055) !important;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary) !important;
  font-size: 15px !important;
  font-weight: 800 !important;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-checkbox-button__inner),
:deep(.budget-slider-input .el-slider__input .el-input__wrapper) {
  border-color: var(--line) !important;
  border-radius: 13px !important;
  background: #FFFCF8 !important;
  box-shadow: 0 0 0 1px var(--line) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--accent-soft) inset, 0 0 0 4px rgba(217, 74, 55, 0.08) !important;
}

:deep(.period-group .el-checkbox-button.is-checked .el-checkbox-button__inner),
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  border-color: var(--accent) !important;
  background: var(--accent-light) !important;
  color: var(--accent) !important;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox) {
  min-height: 42px !important;
  padding: 0 12px;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  background: #FFFCF8;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox.is-checked) {
  border-color: var(--accent) !important;
  background: var(--accent) !important;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox.is-checked .el-checkbox__label) {
  color: #fff !important;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox.is-checked .el-checkbox__inner) {
  background: rgba(255, 255, 255, 0.18) !important;
  border-color: rgba(255, 255, 255, 0.62) !important;
}

.budget-unit,
:deep(.budget-slider-input .el-input-number__decrease),
:deep(.budget-slider-input .el-input-number__increase) {
  color: var(--accent) !important;
}

.hospital-suggestions {
  border-color: var(--line);
  border-radius: 14px;
  background: var(--bg-panel);
  box-shadow: 0 14px 34px rgba(64, 48, 40, 0.10);
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: var(--accent-light);
  color: var(--accent);
}

.actions {
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  bottom: 0;
  background: rgba(255, 253, 251, 0.96);
  border-top: 1px solid var(--line-soft);
  box-shadow: 0 -8px 22px rgba(64, 48, 40, 0.06);
}

.actions .el-button {
  min-height: 56px !important;
  border-radius: 14px !important;
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  box-shadow: none;
}

/* 控件内部原生输入不画边框，避免圆角控件内出现直角内框 */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.budget-slider-input .el-slider__input .el-input__wrapper) {
  border: 1px solid var(--line) !important;
  border-radius: 13px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

:deep(.el-input__inner),
:deep(.budget-slider-input .el-input__inner) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}

.budget-slider-input-wrap,
:deep(.budget-slider-input .el-slider__input),
:deep(.budget-slider-input .el-input-number) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.hidden-file-input {
  display: none;
}

.id-upload-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.id-upload-card {
  min-height: 128px;
  padding: 14px 12px !important;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 9px;
  border: 1px solid var(--line) !important;
  border-radius: 16px !important;
  background: #FFFCF8 !important;
  color: var(--text-primary) !important;
  text-align: left;
}

.id-upload-card:hover {
  border-color: var(--accent-soft) !important;
  background: var(--accent-light) !important;
}

.id-upload-card.selected {
  border-color: var(--accent) !important;
  background: #FFFCF8 !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

:deep(.period-group .el-checkbox-button.is-checked .el-checkbox-button__inner) {
  border-color: var(--accent) !important;
  background: #FFFCF8 !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

:deep(.period-group .el-checkbox-button.is-checked .period-time) {
  color: var(--accent) !important;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox.is-checked) {
  border-color: var(--accent) !important;
  background: #FFFCF8 !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox.is-checked .el-checkbox__label) {
  color: var(--accent) !important;
}

:deep(.el-checkbox-group:not(.period-group) .el-checkbox.is-checked .el-checkbox__inner) {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
}

.id-upload-icon {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px;
  font-weight: 900;
}

.id-upload-card strong {
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.25;
}

.id-upload-card em {
  max-width: 100%;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.35;
  font-style: normal;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
