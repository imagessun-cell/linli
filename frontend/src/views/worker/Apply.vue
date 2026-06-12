<template>
  <div class="apply">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">✕</button>
    </header>
    <div class="header">
      <h2>陪诊师认证</h2>
      <p>完成认证后即可开始接单服务</p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="年龄" prop="age">
        <div class="budget-slider-input-wrap">
          <el-slider v-model="form.age" :min="18" :max="65" :step="1" show-input class="budget-slider-input" />
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
          <el-checkbox label="陪诊师培训">🎓 陪诊师培训</el-checkbox>
        </el-checkbox-group>
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

// 社区自动补全
const allCommunities = ref([])
const filteredCommunities = ref([])
const showSuggestions = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-1)
let debounceTimer = null

const loadCommunities = async () => {
  try {
    const res = await fetch('/data/communities.json')
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
  emergency_contact_name: '',
  emergency_contact_phone: ''
})

const rules = {
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  community: [{ required: true, message: '请输入所属社区', trigger: 'blur' }],
  skills: [{ required: true, message: '请选择至少一个技能', trigger: 'change' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.age < 18 || form.age > 65) {
        ElMessage.warning('年龄必须在18-65岁之间')
        return
      }
      loading.value = true
      try {
        const payload = { ...form, service_radius: form.service_radius * 1000 }
        const res = await request.post('/worker/apply', payload)
        if (res.code === 0) {
          ElMessage.success('认证申请已提交，请等待审核')
          router.push('/worker/dashboard')
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
  color: #303133;
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
  color: #f56c6c;
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
  box-shadow: 0 0 0 1px #E2E6EC inset !important;
  transition: box-shadow 0.2s;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #2c7a9e inset !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1.5px #2c7a9e inset !important;
}

:deep(.el-input__inner) {
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

:deep(.el-input__prefix),
:deep(.el-input__suffix) {
  display: flex;
  align-items: center;
  height: 100%;
  color: #909399;
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
  color: #1E2A3A !important;
}

:deep(.el-checkbox__inner) {
  width: 20px !important;
  height: 20px !important;
  border-radius: 5px !important;
  border-color: #C0C4CC !important;
}

:deep(.el-checkbox.is-checked .el-checkbox__inner) {
  background-color: #2c7a9e !important;
  border-color: #2c7a9e !important;
}

:deep(.el-checkbox.is-checked .el-checkbox__label) {
  color: #2c7a9e !important;
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
  color: #1E2A3A;
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
  border: 1px solid #E2E6EC !important;
  outline: none !important;
  box-shadow: none !important;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.budget-slider-input .el-slider__input > .el-input__wrapper:hover) {
  border-color: #2c7a9e !important;
}

:deep(.budget-slider-input .el-slider__input .el-input-number__decrease),
:deep(.budget-slider-input .el-slider__input .el-input-number__increase) {
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
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestion-loading,
.suggestion-empty {
  padding: 14px 16px;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f0f2f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background: #f5f7fa;
}

.suggestion-name {
  font-size: 15px;
  color: #1E2A3A;
  flex: 1;
}

.suggestion-district {
  font-size: 12px;
  color: #909399;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  flex-shrink: 0;
}

/* ===== 操作按钮区域（与发布任务统一） ===== */
.actions {
  margin-top: 48px;
  padding: 20px 0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, #f5f7fa 0%, rgba(245, 247, 250, 0.85) 60%, transparent 100%);
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
</style>