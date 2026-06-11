<template>
  <div class="apply">
    <div class="header">
      <h2>陪诊师认证</h2>
      <p>完成认证后即可开始接单服务</p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="年龄" prop="age">
        <el-input v-model.number="form.age" type="number" placeholder="50-65岁" />
      </el-form-item>

      <el-form-item label="所属社区" prop="community">
        <el-input v-model="form.community" placeholder="请输入您所在的社区" />
      </el-form-item>

      <el-form-item label="服务范围" prop="service_radius">
        <el-select v-model="form.service_radius" placeholder="选择服务范围">
          <el-option label="1公里" :value="1000" />
          <el-option label="2公里" :value="2000" />
          <el-option label="3公里" :value="3000" />
          <el-option label="5公里" :value="5000" />
        </el-select>
      </el-form-item>

      <el-form-item label="技能标签" prop="skills">
        <el-checkbox-group v-model="form.skills">
          <el-checkbox label="全程陪同">👣 全程陪同</el-checkbox>
          <el-checkbox label="挂号取药">💊 挂号取药</el-checkbox>
          <el-checkbox label="门诊陪护">🪑 门诊陪护</el-checkbox>
          <el-checkbox label="代为问诊">📝 代为问诊</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="紧急联系人" prop="emergency_contact_name">
        <el-input v-model="form.emergency_contact_name" placeholder="联系人姓名" />
      </el-form-item>

      <el-form-item label="紧急联系电话" prop="emergency_contact_phone">
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

const form = reactive({
  age: '',
  community: '',
  service_radius: 3000,
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
      if (form.age < 50 || form.age > 65) {
        ElMessage.warning('年龄必须在50-65岁之间')
        return
      }
      loading.value = true
      try {
        const res = await request.post('/worker/apply', form)
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
  await userStore.fetchProfile()
  const worker = userStore.userInfo?.worker
  if (worker) {
    form.age = worker.age
    form.community = worker.community
    form.service_radius = worker.service_radius
    form.skills = JSON.parse(worker.skills || '[]')
    form.emergency_contact_name = worker.emergency_contact_name || ''
    form.emergency_contact_phone = worker.emergency_contact_phone || ''
  }
})
</script>

<style scoped>
.apply {
  padding: 20px 16px;
  background-color: #ffffff;
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

/* ===== 操作按钮区域（与发布任务统一） ===== */
.actions {
  margin-top: 28px;
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