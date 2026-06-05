<template>
  <div class="admin-dashboard">
    <h1 class="page-title">仪表盘</h1>
    <div v-if="loading" class="loading">加载中...</div>
    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.totalUsers }}</span>
            <span class="stat-label">总用户数</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🛠️</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.totalWorkers }}</span>
            <span class="stat-label">认证服务者</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📝</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.totalTasks }}</span>
            <span class="stat-label">总任务数</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📦</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.totalOrders }}</span>
            <span class="stat-label">总订单数</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">💰</span>
          <div class="stat-body">
            <span class="stat-value">¥{{ stats.totalAmount }}</span>
            <span class="stat-label">总交易额</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📅</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.todayTasks }}</span>
            <span class="stat-label">今日任务</span>
          </div>
        </div>
      </div>
      <div class="quick-actions">
        <h2 class="section-title">快捷操作</h2>
        <div class="action-list">
          <router-link to="/admin/users" class="action-card">👥 用户管理</router-link>
          <router-link to="/admin/tasks" class="action-card">📋 任务审核</router-link>
          <router-link to="/admin/types" class="action-card">🏷️ 分类管理</router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const loading = ref(true)
const stats = ref({
  totalUsers: 0,
  totalWorkers: 0,
  totalTasks: 0,
  totalOrders: 0,
  totalAmount: 0,
  todayTasks: 0,
  todayOrders: 0
})

onMounted(async () => {
  try {
    const res = await request.get('/admin/stats')
    if (res.code === 0) stats.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-xl);
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 36px;
}

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-md);
}

.action-list {
  display: flex;
  gap: var(--spacing-md);
}

.action-card {
  flex: 1;
  padding: var(--spacing-xl);
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  font-weight: 500;
  text-align: center;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.action-card:hover {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
  font-size: var(--font-size-lg);
}
</style>
