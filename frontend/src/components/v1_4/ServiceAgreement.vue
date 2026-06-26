<template>
  <el-dialog v-model="visible" title="签署服务协议" width="90%" top="5vh" :close-on-click-modal="false" @close="handleClose">
    <div class="agreement-content">
      <h2>《健康陪诊服务协议》</h2>

      <h3>一、服务边界</h3>
      <p>1. 本平台提供的陪诊服务仅包含就医陪同、挂号取药、门诊陪护、代为问诊四大类。</p>
      <p>2. 陪诊服务<strong>不包含任何医疗行为</strong>，包括但不限于：代替就诊、代替用药、操作医疗设备、出具诊断意见。</p>
      <p>3. 如陪诊师出现以上违规行为，用户有权立即终止服务并向平台举报。</p>

      <h3>二、双方权责</h3>
      <p>1. 用户应如实提供就诊人病史、过敏史等必要信息。</p>
      <p>2. 陪诊师应按时到达指定地点，全程佩戴工牌，文明服务。</p>
      <p>3. 双方均不得私下交易，所有费用必须通过平台结算。</p>

      <h3>三、免责条款</h3>
      <p>1. 平台为信息撮合方，不对医疗结果承担责任。</p>
      <p>2. 因不可抗力导致服务无法进行的，双方互不担责。</p>

      <h3>四、隐私保护</h3>
      <p>1. 平台对用户信息实施加密存储，仅服务当天对陪诊师授权查看。</p>
      <p>2. 任何一方不得泄露对方隐私信息，违者承担法律责任。</p>
    </div>

    <template #footer>
      <el-checkbox v-model="agreed">
        <span style="font-size: 13px;">我已阅读并同意以上协议</span>
      </el-checkbox>
      <div style="margin-top: 12px; display: flex; gap: 12px;">
        <el-button @click="handleClose">拒绝</el-button>
        <el-button type="primary" :disabled="!agreed" @click="handleSign" :loading="signing">
          确认签署
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  agreementType: { type: String, default: 'publish' }
})

const emit = defineEmits(['update:modelValue', 'signed'])

const visible = ref(false)
const agreed = ref(false)
const signing = ref(false)

watch(() => props.modelValue, (v) => { visible.value = v })

const handleClose = () => {
  emit('update:modelValue', false)
  agreed.value = false
}

const handleSign = async () => {
  if (!agreed.value) return
  signing.value = true
  try {
    const res = await request.post('/v1/agreement/sign', { agreement_type: props.agreementType })
    if (res.code === 0) {
      ElMessage.success('签署成功')
      emit('signed')
      handleClose()
    } else {
      ElMessage.warning(res.message || '签署失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '网络错误')
  } finally {
    signing.value = false
  }
}
</script>

<style scoped>
.agreement-content {
  max-height: 55vh;
  overflow-y: auto;
  padding: 0 4px;
}

.agreement-content h2 {
  text-align: center;
  font-size: 18px;
  margin-bottom: 16px;
}

.agreement-content h3 {
  font-size: 15px;
  margin-top: 16px;
  margin-bottom: 8px;
  color: #4F3A32;
}

.agreement-content p {
  font-size: 13px;
  line-height: 1.8;
  color: #7D6257;
  margin-bottom: 6px;
}
</style>
