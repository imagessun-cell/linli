<template>
  <div class="task-detail-container" v-if="task">
    <div class="task-header">
      <span class="task-icon">{{ task.typeIcon }}</span>
      <div class="task-title-area">
        <h2>{{ task.typeName }}</h2>
        <p class="task-address">{{ task.address }}</p>
      </div>
      <span class="status-badge" :style="{ background: task.physicalLevelColor }">
        {{ task.physicalLevelName }}
      </span>
    </div>

    <div class="section">
      <h3>服务信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">服务时间</span>
          <span class="value">{{ formatDateTime(task.startTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">预计时长</span>
          <span class="value">{{ task.duration }}分钟</span>
        </div>
        <div class="info-item">
          <span class="label">体力要求</span>
          <span class="value" :style="{ color: task.physicalLevelColor }">
            {{ task.physicalLevelName }}
          </span>
        </div>
      </div>
    </div>

    <div class="section" v-if="task.specialRequirements">
      <h3>特殊要求</h3>
      <p class="special-req">{{ task.specialRequirements }}</p>
    </div>

    <div class="section">
      <h3>发布者信息</h3>
      <div class="publisher-info">
        <img :src="task.employerAvatar || '/default-avatar.png'" class="avatar" />
        <div class="publisher-detail">
          <span class="name">{{ task.employerNickname }}</span>
          <span class="rating">⭐ {{ task.employerRating || 5.0 }}</span>
        </div>
      </div>
    </div>

    <div class="section budget-section">
      <div class="budget-item">
        <span class="label">服务报酬</span>
        <span class="budget-value">¥{{ task.budget }}</span>
      </div>
    </div>

    <div class="actions" v-if="showActions">
      <el-button
        v-if="userStore.isLoggedIn && userStore.userInfo?.role === 1"
        type="primary"
        size="large"
        @click="grabTask"
        :loading="loading"
      >
        立即接单
      </el-button>
      <el-button
        v-else-if="!userStore.isLoggedIn"
        type="primary"
        size="large"
        @click="$router.push('/login')"
      >
        登录后接单
      </el-button>
      <el-button
        v-else-if="userStore.userInfo?.role === 2"
        size="large"
        @click="$router.push('/role-select')"
      >
        切换为陪诊师身份接单
      </el-button>
    </div>

    <div class="back-btn">
      <el-button @click="$router.back()" circle>←</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const task = ref(null)
const loading = ref(false)

const showActions = computed(() => {
  return task.value && task.value.status === 0
})

const formatDateTime = (str) => {
  if (!str) return ''
  const d = new Date(str)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadTask = async () => {
  try {
    const res = await request.get(`/task/public/${route.params.id}`)
    if (res.code === 0) {
      task.value = res.data
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const grabTask = async () => {
  loading.value = true
  try {
    const res = await request.post(`/task/${route.params.id}/grab`)
    if (res.code === 0) {
      ElMessage.success('接单成功')
      router.push('/worker/my-tasks')
    } else {
      ElMessage.error(res.message || '接单失败')
    }
  } catch (e) {
    ElMessage.error('接单失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTask()
})
</script>

<style scoped>
.task-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.task-header {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: #fff;
  gap: 12px;
}

.task-icon {
  font-size: 36px;
}

.task-title-area {
  flex: 1;
}

.task-title-area h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.task-address {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
}

.section {
  background: #fff;
  margin-top: 10px;
  padding: 16px;
}

.section h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item .label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 15px;
  color: #333;
}

.special-req {
  margin: 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publisher-info .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eee;
}

.publisher-info .name {
  display: block;
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.publisher-info .rating {
  font-size: 13px;
  color: #ff9800;
}

.budget-section {
  margin-top: 10px;
  padding: 20px 16px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-item .label {
  font-size: 14px;
  color: #666;
}

.budget-value {
  font-size: 28px;
  font-weight: bold;
  color: #ff6b00;
}

.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.actions :deep(.el-button) {
  width: 100%;
}

.back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
}

.back-btn :deep(.el-button) {
  width: 40px;
  height: 40px;
  font-size: 18px;
}
</style>