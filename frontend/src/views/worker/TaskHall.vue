<template>
  <div class="task-hall">
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="服务类型" size="small" clearable @change="fetchTasks">
        <el-option v-for="(name, index) in taskTypes" :key="index" :label="name" :value="index" />
      </el-select>
    </div>

    <div class="task-list">
      <div v-for="task in tasks" :key="task.id" class="task-card" @click="$router.push(`/worker/task/${task.id}`)">
        <div class="task-header">
          <span class="task-type">{{ taskTypes[task.type] || '未知' }}</span>
          <span class="task-budget">¥{{ task.budget }}</span>
        </div>
        <div class="task-content">
          <p class="address">{{ task.address }}</p>
          <p class="time">{{ formatDateTime(task.start_time) }} - {{ formatTime(task.end_time) }}</p>
          <p class="duration">服务时长: {{ task.duration_minutes }}分钟</p>
        </div>
        <div class="task-footer">
          <span class="employer">雇主: {{ task.employer_nickname || '匿名' }}</span>
          <div class="tags">
            <el-tag v-if="task.is_charity" size="small" type="danger">公益</el-tag>
            <el-tag size="small" :type="task.physical_level === 1 ? 'success' : task.physical_level === 2 ? 'warning' : 'danger'">
              {{ ['', '轻度', '中度', '重度'][task.physical_level] }}体力
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="tasks.length === 0 && !loading" description="暂无任务" />
    <el-loading v-if="loading" />

    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="page"
        :page-size="20"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchTasks"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const tasks = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const filterType = ref('')

const taskTypes = ['', '陪诊', '陪聊', '小时保洁', '做饭', '接送', '看护', '跑腿', '助教', '其他']

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await request.get('/worker/tasks/hall', { page: page.value, limit: 20 })
    if (res.code === 0) {
      tasks.value = res.data.tasks
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.task-hall {
  padding: 16px;
}

.filter-bar {
  margin-bottom: 16px;
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
  font-size: 18px;
  font-weight: bold;
}

.task-content .address {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.task-content .time {
  font-size: 13px;
  color: #999;
  margin-bottom: 2px;
}

.task-content .duration {
  font-size: 12px;
  color: #999;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.employer {
  font-size: 12px;
  color: #999;
}

.tags {
  display: flex;
  gap: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>