<template>
  <div class="sos-button-wrapper">
    <button class="sos-button" @click="triggerSOS">
      <span class="sos-icon">SOS</span>
      <span class="sos-label">紧急求助</span>
    </button>

    <el-dialog v-model="showConfirm" title="紧急求助" width="85%" top="30vh">
      <div style="text-align: center; padding: 12px 0;">
        <div style="font-size: 48px; margin-bottom: 12px;">🆘</div>
        <p style="font-size: 15px; color: #4F3A32; margin-bottom: 8px;">确认发出紧急求助？</p>
        <p style="font-size: 13px; color: #8A6C60;">平台应急小组将立即联系您并同步您的紧急联系人</p>
      </div>
      <template #footer>
        <el-button @click="showConfirm = false">取消</el-button>
        <el-button type="danger" @click="confirmSOS" :loading="sending">
          确认求助
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showResult" title="求助已发出" width="85%" top="30vh" :close-on-click-modal="false">
      <div style="text-align: center; padding: 12px 0;">
        <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
        <p style="font-size: 15px; color: #4F3A32; margin-bottom: 8px;">紧急求助已发出！</p>
        <p style="font-size: 13px; color: #8A6C60;">平台应急小组将在3分钟内与您联系</p>
        <div style="margin-top: 16px; background: #FFF9F2; border-radius: 8px; padding: 12px;">
          <p style="font-size: 14px; color: #7D6257;">急救电话：<strong style="color: #B84545;">120</strong></p>
          <p style="font-size: 14px; color: #7D6257; margin-top: 4px;">平台热线：<strong>400-000-0000</strong></p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showResult = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['sosTriggered'])

const showConfirm = ref(false)
const showResult = ref(false)
const sending = ref(false)

const triggerSOS = () => {
  showConfirm.value = true
}

const confirmSOS = async () => {
  sending.value = true
  try {
    const res = await request.post('/v1/sos', {
      latitude: null,
      longitude: null
    })
    if (res.code === 0) {
      showConfirm.value = false
      showResult.value = true
      emit('sosTriggered', res.data)
    } else {
      ElMessage.warning(res.message || '发送失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '网络错误')
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.sos-button-wrapper {
  position: fixed;
  right: 16px;
  bottom: 100px;
  z-index: 999;
}

.sos-button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E94F3D, #B84545);
  border: 3px solid #F4B5A6;
  box-shadow: 0 4px 16px rgba(233, 79, 61, 0.34);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  animation: sos-pulse 2s infinite;
}

@keyframes sos-pulse {
  0% { box-shadow: 0 4px 16px rgba(233, 79, 61, 0.34); }
  50% { box-shadow: 0 4px 24px rgba(233, 79, 61, 0.58); }
  100% { box-shadow: 0 4px 16px rgba(233, 79, 61, 0.34); }
}

.sos-icon {
  font-size: 18px;
  font-weight: 900;
  color: white;
  letter-spacing: 2px;
}

.sos-label {
  font-size: 9px;
  color: white;
  font-weight: 600;
}
</style>
