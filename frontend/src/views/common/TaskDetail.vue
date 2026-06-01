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
  background: var(--bg-secondary);
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.task-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--bg-primary);
  gap: var(--spacing-md);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.task-icon {
  font-size: 40px;
}

.task-title-area {
  flex: 1;
}

.task-title-area h2 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.task-address {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-muted);
  line-height: 1.4;
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-full);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.section {
  background: var(--bg-primary);
  margin-top: var(--spacing-md);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.section h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: 700;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.info-item {
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm);
}

.info-item .label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--spacing-xs);
}

.info-item .value {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: 600;
}

.special-req {
  margin: 0;
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.6;
  border-left: 4px solid var(--accent-warm);
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
}

.publisher-info .avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 3px solid var(--accent-light);
}

.publisher-info .name {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.publisher-info .rating {
  font-size: var(--font-size-base);
  color: var(--accent-warm);
}

.budget-section {
  margin-top: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-item .label {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
}

.budget-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--accent);
}

.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  box-shadow: 0 -4px 20px rgba(74, 55, 40, 0.1);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}

.actions :deep(.el-button) {
  width: 100%;
  min-height: var(--touch-target-min);
  font-size: var(--font-size-lg);
  font-weight: 700;
  border-radius: var(--border-radius) !important;
}

.back-btn {
  position: fixed;
  top: calc(16px + env(safe-area-inset-top));
  left: var(--spacing-md);
}

.back-btn :deep(.el-button) {
  width: 44px;
  height: 44px;
  font-size: 20px;
  background: var(--bg-primary);
  border: none;
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
}
</style>
</style>