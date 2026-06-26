<template>
  <div class="task-detail" v-if="task">
    <div class="header">
      <h2>{{ taskTypes[task.type] }}</h2>
      <span class="budget">¥{{ task.budget }}</span>
    </div>

    <div class="section">
      <h4>服务信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">服务地址</span>
          <span class="value">{{ task.address }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务时间</span>
          <span class="value">{{ formatServiceTime(task.start_time, task.end_time) }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务时长</span>
          <span class="value">{{ formatDuration(task.duration_minutes) }}</span>
        </div>
        <div class="info-item">
          <span class="label">体力要求</span>
          <span class="value">{{ ['', '轻度', '中度', '重度'][task.physical_level] }}</span>
        </div>
        <div class="info-item" v-if="task.is_charity">
          <span class="label">公益任务</span>
          <span class="value tag">公益</span>
        </div>
      </div>
    </div>

    <div class="section" v-if="task.special_requirements">
      <h4>特殊要求</h4>
      <p>{{ task.special_requirements }}</p>
    </div>

    <div class="section">
      <h4>就诊人信息</h4>
      <div class="employer-info">
        <span>{{ task.employer_nickname || '匿名用户' }}</span>
        <span class="phone" v-if="task.employer_phone">{{ task.employer_phone }}</span>
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" size="large" :loading="loading" @click="handleAccept" :disabled="task.status !== 0">
        {{ task.status === 0 ? '立即接单' : taskStatusNames[task.status] }}
      </el-button>
    </div>
  </div>
  <el-loading v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const task = ref(null)
const loading = ref(false)

const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊', '陪诊师培训']
const taskStatusNames = ['', '已接单', '服务中', '已完成', '已取消', '争议中']

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatServiceTime = (start, end) => {
  if (!start) return ''
  if (!end) return formatDateTime(start)
  const startDate = new Date(start)
  const endDate = new Date(end)
  const endText = startDate.toDateString() === endDate.toDateString()
    ? `${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, '0')}`
    : formatDateTime(end)
  return `${formatDateTime(start)} - ${endText}`
}

const formatDuration = (minutes) => {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = minutes / 60
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}小时`
}

const handleAccept = async () => {
  loading.value = true
  try {
    const res = await request.post(`/worker/tasks/${route.params.id}/accept`)
    if (res.code === 0) {
      ElMessage.success('接单成功')
      router.push('/worker/my-tasks')
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error(e.message || '接单失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await request.get(`/task/${route.params.id}`)
    if (res.code === 0) {
      task.value = res.data
    }
  } catch (e) {
    ElMessage.error('获取任务详情失败')
  }
})
</script>

<style scoped>
.task-detail {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
}

.header h2 {
  font-size: 20px;
}

.budget {
  font-size: 24px;
  color: #E94F3D;
  font-weight: bold;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section h4 {
  font-size: 14px;
  color: #8A6C60;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 12px;
  color: #8A6C60;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 14px;
  color: #4F3A32;
}

.info-item .tag {
  color: #B84545;
}

.section p {
  font-size: 14px;
  color: #7D6257;
  line-height: 1.6;
}

.employer-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #4F3A32;
}

.employer-info .phone {
  color: #E94F3D;
}

.actions {
  margin-top: 20px;
}

.actions .el-button {
  width: 100%;
}
</style>
