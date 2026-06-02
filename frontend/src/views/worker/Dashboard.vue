<template>
  <div class="dashboard">
    <div class="header">
      <div class="user-info">
        <img :src="userInfo?.avatar_url || '/default-avatar.png'" class="avatar" />
        <div class="info">
          <h3>{{ userInfo?.nickname || '陪诊师' }}</h3>
          <p v-if="workerInfo?.status === 1">已认证</p>
          <p v-else-if="workerInfo?.status === 0">审核中</p>
          <p v-else class="warning">请先完成认证</p>
        </div>
      </div>
      <el-button size="small" @click="$router.push('/worker/profile')">编辑</el-button>
    </div>

    <div class="stats">
      <div class="stat-item">
        <span class="value">{{ workerInfo?.total_orders || 0 }}</span>
        <span class="label">完成订单</span>
      </div>
      <div class="stat-item">
        <span class="value">{{ workerInfo?.total_hours || 0 }}</span>
        <span class="label">服务时长</span>
      </div>
      <div class="stat-item">
        <span class="value">{{ workerInfo?.avg_rating || 5.0 }}</span>
        <span class="label">评分</span>
      </div>
      <div class="stat-item">
        <span class="value">Lv.{{ workerInfo?.honor_level || 0 }}</span>
        <span class="label">荣誉等级</span>
      </div>
    </div>

    <div class="quick-actions" v-if="workerInfo?.status !== 1">
      <el-alert type="warning" :closable="false">
        <template #title>
          您还没有完成陪诊师认证，
          <el-link type="primary" @click="$router.push('/worker/apply')">立即申请</el-link>
        </template>
      </el-alert>
    </div>

    <div class="section" v-else>
      <h3>推荐任务</h3>
      <div class="task-list">
        <div v-for="task in recommendTasks" :key="task.id" class="task-card" @click="$router.push(`/worker/task/${task.id}`)">
          <div class="task-header">
            <span class="task-type">{{ getTaskTypeName(task.type) }}</span>
            <span class="task-budget">¥{{ task.budget }}</span>
          </div>
          <div class="task-content">
            <p>{{ task.address }}</p>
            <p class="task-time">{{ formatTime(task.start_time) }}</p>
          </div>
          <div class="task-tags">
            <el-tag size="small" v-if="task.is_charity">公益</el-tag>
            <el-tag size="small" type="success">{{ task.physical_level === 1 ? '轻度' : task.physical_level === 2 ? '中度' : '重度' }}</el-tag>
          </div>
        </div>
        <el-empty v-if="recommendTasks.length === 0" description="暂无可接任务" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'

const userStore = useUserStore()
const userInfo = ref(userStore.userInfo)
const workerInfo = ref(null)
const recommendTasks = ref([])

const taskTypes = ['', '陪诊', '陪聊', '小时保洁', '做饭', '接送', '看护', '跑腿', '助教', '其他']

const getTaskTypeName = (type) => taskTypes[type] || '未知'

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await userStore.fetchProfile()
  userInfo.value = userStore.userInfo

  if (userInfo.value?.worker) {
    workerInfo.value = userInfo.value.worker
  }

  try {
    const res = await request.get('/worker/tasks/recommend')
    if (res.code === 0) {
      recommendTasks.value = res.data.slice(0, 5)
    }
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.dashboard {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 12px;
  background: #ddd;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}

.info h3 {
  font-size: 16px;
  margin-bottom: 4px;
}

.info p {
  font-size: 12px;
  opacity: 0.8;
}

.info .warning {
  color: #ff9800;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 20px 0;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
  background: white;
  border-radius: 8px;
}

.stat-item .value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #667eea;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
}

.quick-actions {
  margin: 20px 0;
}

.section h3 {
  font-size: 16px;
  margin-bottom: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.task-card:active {
  transform: scale(0.98);
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-type {
  font-weight: bold;
  color: #333;
}

.task-budget {
  color: #667eea;
  font-weight: bold;
}

.task-content p {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.task-time {
  font-size: 12px !important;
  color: #999 !important;
}

.task-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>