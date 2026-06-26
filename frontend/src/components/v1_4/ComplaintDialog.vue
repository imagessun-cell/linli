<template>
  <el-dialog v-model="visible" title="投诉" width="90%" top="15vh">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
      <el-form-item prop="complaint_type">
        <el-select v-model="form.complaint_type" placeholder="选择投诉类型" style="width: 100%">
          <el-option label="服务违规（建议用药/代诊等）" value="service_violation" />
          <el-option label="态度恶劣" value="bad_attitude" />
          <el-option label="未按时到达" value="late_arrival" />
          <el-option label="私下加价" value="price_issue" />
          <el-option label="隐私泄露" value="privacy_issue" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请详细描述投诉内容..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="danger" @click="submitComplaint" :loading="submitting">
        提交投诉
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  orderId: { type: [Number, String], required: true },
  respondentId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  complaint_type: '',
  description: ''
})

const rules = {
  complaint_type: [{ required: true, message: '请选择投诉类型', trigger: 'change' }],
  description: [{ required: true, message: '请描述投诉内容', trigger: 'blur' }]
}

watch(() => props.modelValue, (v) => { visible.value = v })
watch(() => visible.value, (v) => {
  if (!v) {
    form.complaint_type = ''
    form.description = ''
  }
  emit('update:modelValue', v)
})

const submitComplaint = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res = await request.post('/v1/complaint', {
      order_id: props.orderId,
      complaint_type: form.complaint_type,
      description: form.description,
      respondent_id: props.respondentId
    })
    if (res.code === 0) {
      ElMessage.success('投诉已提交，平台将在24小时内响应')
      visible.value = false
      emit('submitted')
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
