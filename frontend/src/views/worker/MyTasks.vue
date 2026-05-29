<template>
  <div class="my-tasks">
    <el-tabs v-model="activeTab" @tab-change="fetchOrders">
      <el-tab-pane label="进行中" name="1" />
      <el-tab-pane label="待确认" name="3" />
      <el-tab-pane label="已完成" name="4" />
    </el-tabs>

    <div class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-card" @click="$router.push(`/common/order/${order.id}`)">
        <div class="order-header">
          <span class="order-no">{{ order.order_no }}</span>
          <span class="order-status" :class="statusClass(order.status)">{{ statusNames[order.status] }}</span>
        </div>
        <div class="order-content">
          <h4>{{ taskTypes[order.task_type] || '未知服务' }}</h4>
          <p>{{ order.address }}</p>
          <p class="time">{{ formatDateTime(order.start_time) }}</p>
        </div>
        <div class="order-footer">
          <span class="amount">¥{{ order.worker_income }}</span>
          <span class="date">{{ formatDate(order.created_at) }}</span>
        </div>

        <div class="order-actions" v-if="order.status === 2" @click.stop>
          <el-button type="primary" size="small" @click="startService(order.id)">开始服务</el-button>
          <el-button type="success" size="small" @click="completeService(order.id)">完成服务</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="orders.length === 0 && !loading" description="暂无订单" />
    <el-loading v-if="loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const activeTab = ref('1')
const orders = ref([])
const loading = ref(false)

const taskTypes = ['', '陪诊', '陪聊', '小时保洁', '做饭', '接送', '看护', '跑腿', '助教', '其他']
const statusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中' }

const statusClass = (status) => {
  const classes = {
    1: 'warning',
    2: 'primary',
    3: 'info',
    4: 'success',
    5: 'danger',
    6: 'danger'
  }
  return classes[status] || ''
}

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatDate = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await request.get('/worker/orders', { status: activeTab.value })
    if (res.code === 0) {
      orders.value = res.data.orders || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const startService = async (orderId) => {
  try {
    const res = await request.put(`/worker/orders/${orderId}/start`)
    if (res.code === 0) {
      ElMessage.success('服务已开始')
      fetchOrders()
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const completeService = async (orderId) => {
  try {
    const res = await request.put(`/worker/orders/${orderId}/complete`)
    if (res.code === 0) {
      ElMessage.success('已完成，等待雇主确认')
      fetchOrders()
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.my-tasks {
  padding: 16px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-no {
  font-size: 12px;
  color: #999;
}

.order-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.order-status.warning { background: #fff3e0; color: #ff9800; }
.order-status.primary { background: #e3f2fd; color: #2196f3; }
.order-status.info { background: #f5f5f5; color: #999; }
.order-status.success { background: #e8f5e9; color: #4caf50; }
.order-status.danger { background: #ffebee; color: #f44336; }

.order-content h4 {
  font-size: 16px;
  margin-bottom: 4px;
}

.order-content p {
  font-size: 13px;
  color: #666;
}

.order-content .time {
  font-size: 12px;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-footer .amount {
  font-size: 16px;
  color: #667eea;
  font-weight: bold;
}

.order-footer .date {
  font-size: 12px;
  color: #999;
}

.order-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>