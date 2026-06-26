<template>
  <div class="service-report">
    <div class="form-header">
      <h3>📄 陪诊服务报告</h3>
      <p class="form-desc">服务结束后请在 24 小时内提交陪诊报告</p>
    </div>

    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="医嘱摘要" prop="doctor_advice">
        <el-input
          v-model="form.doctor_advice"
          type="textarea"
          :rows="3"
          placeholder="医生诊断意见和治疗方案摘要（可语音转文字）"
        />
      </el-form-item>

      <el-form-item label="用药提醒" prop="medication_reminder">
        <el-input
          v-model="form.medication_reminder"
          type="textarea"
          :rows="2"
          placeholder="用药方式、剂量、时间等提醒"
        />
      </el-form-item>

      <el-form-item label="复诊时间">
        <el-date-picker
          v-model="form.next_visit_date"
          type="date"
          placeholder="选择下次复诊时间（选填）"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注说明">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="其他需要记录的信息（选填）"
        />
      </el-form-item>

      <el-form-item label="上传凭证">
        <el-upload
          action="/api/upload/file"
          :headers="uploadHeaders"
          :on-success="handleUploadSuccess"
          :before-upload="beforeUpload"
          multiple
          :limit="5"
          :on-exceed="() => ElMessage.warning('最多上传5张照片')"
          list-type="picture-card"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <div class="uploaded-list" v-if="uploadedUrls.length > 0">
        <span class="uploaded-label">已上传：{{ uploadedUrls.length }} 张</span>
      </div>
    </el-form>

    <div class="form-actions">
      <el-button type="primary" :loading="submitting" @click="submitReport">
        提交服务报告
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  orderId: { type: [Number, String], required: true }
})

const emit = defineEmits(['submitted'])

const userStore = useUserStore()
const formRef = ref(null)
const submitting = ref(false)
const uploadedUrls = ref([])

const form = reactive({
  doctor_advice: '',
  medication_reminder: '',
  next_visit_date: '',
  notes: ''
})

const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

const handleUploadSuccess = (res) => {
  if (res.code === 0) {
    const url = res.data?.url || res.url || ''
    if (url) {
      uploadedUrls.value.push(url)
      ElMessage.success('上传成功')
    }
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}

const submitReport = async () => {
  submitting.value = true
  try {
    const res = await request.post(`/v1/orders/${props.orderId}/service-report`, {
      ...form,
      next_visit_date: form.next_visit_date ? new Date(form.next_visit_date).toISOString() : null,
      photo_urls: uploadedUrls.value.length > 0 ? JSON.stringify(uploadedUrls.value) : null
    })
    if (res.code === 0) {
      ElMessage.success('服务报告已提交')
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
.service-report {
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

.uploaded-list {
  margin-top: 8px;
}

.uploaded-label {
  font-size: 13px;
  color: #B66A25;
}
</style>
