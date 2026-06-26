<template>
  <div class="pre-history">
    <div class="form-header">
      <h3>📋 诊前病史资料确认</h3>
      <p class="form-desc">请填写就诊人病史信息并上传确认截图，以便陪诊师提前了解情况</p>
    </div>

    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="就诊人姓名" prop="patient_name">
        <el-input v-model="form.patient_name" placeholder="请输入就诊人姓名" />
      </el-form-item>

      <el-form-item label="就诊人年龄" prop="patient_age">
        <el-input-number v-model="form.patient_age" :min="0" :max="120" style="width: 100%" />
      </el-form-item>

      <el-form-item label="病史">
        <el-input v-model="form.medical_history" type="textarea" :rows="2" placeholder="既往病史（如：高血压、糖尿病等）" />
      </el-form-item>

      <el-form-item label="过敏史">
        <el-input v-model="form.allergy_history" type="textarea" :rows="2" placeholder="药物/食物过敏史（如：青霉素过敏）" />
      </el-form-item>

      <el-form-item label="当前症状">
        <el-input v-model="form.current_symptoms" type="textarea" :rows="2" placeholder="本次就诊主要症状描述" />
      </el-form-item>

      <el-form-item label="用药情况">
        <el-input v-model="form.medication_info" type="textarea" :rows="2" placeholder="当前正在服用的药物" />
      </el-form-item>

      <el-form-item label="其他说明">
        <el-input v-model="form.other_info" type="textarea" :rows="2" placeholder="其他需要陪诊师注意的事项" />
      </el-form-item>

      <el-form-item label="确认截图">
        <el-upload
          class="screenshot-upload"
          action="/api/upload/file"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :before-upload="beforeUpload"
          :limit="1"
          :on-exceed="() => ElMessage.warning('只能上传1张截图')"
        >
          <el-button size="small" type="primary">上传截图</el-button>
          <template #tip>
            <span style="font-size: 12px; color: #8A6C60;">上传病史资料确认截图（选填）</span>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>

    <div class="form-actions">
      <el-button type="primary" :loading="submitting" @click="submitForm">
        提交病史资料
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const props = defineProps({
  orderId: { type: [Number, String], required: true }
})

const emit = defineEmits(['submitted'])

const userStore = useUserStore()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  patient_name: '',
  patient_age: 60,
  medical_history: '',
  allergy_history: '',
  current_symptoms: '',
  medication_info: '',
  other_info: '',
  screenshot_url: ''
})

const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

const handleUploadSuccess = (res) => {
  if (res.code === 0) {
    form.screenshot_url = res.data?.url || res.url || ''
    ElMessage.success('截图上传成功')
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  return true
}

const submitForm = async () => {
  submitting.value = true
  try {
    const res = await request.post(`/v1/orders/${props.orderId}/pre-history`, {
      ...form,
      patient_age: form.patient_age ? String(form.patient_age) : ''
    })
    if (res.code === 0) {
      ElMessage.success('病史资料已提交')
      emit('submitted', res.data)
    } else {
      ElMessage.warning(res.message || '提交失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '网络错误')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pre-history {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.form-header {
  margin-bottom: 16px;
}

.form-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #4F3A32;
  margin-bottom: 6px;
}

.form-desc {
  font-size: 13px;
  color: #8A6C60;
  line-height: 1.5;
}

.form-actions {
  margin-top: 20px;
}

.form-actions .el-button {
  width: 100%;
}
</style>
