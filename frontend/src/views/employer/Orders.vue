<template>
  <div class="orders">
    <section class="orders-hero">
      <div class="hero-top">
        <button class="hero-back" type="button" aria-label="返回上一页" @click="$router.back()">‹</button>
        <span>就诊人订单</span>
      </div>
      <h1>我的订单</h1>
      <p>查看陪诊进度，服务结束后及时确认。</p>
    </section>

    <el-tabs v-model="activeTab" @tab-change="fetchOrders">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待服务" name="1" />
      <el-tab-pane label="服务中" name="2" />
      <el-tab-pane label="已完成" name="4" />
    </el-tabs>

    <div class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-card" @click="$router.push(`/common/order/${order.id}`)">
        <div class="order-header">
          <span class="order-no">{{ order.order_no }}</span>
          <span class="order-status" :class="statusClass(order.status)">{{ statusNames[order.status] }}</span>
        </div>
        <div class="order-content">
          <h4>{{ taskTypes[order.task_type] }}</h4>
          <p>{{ order.address }}</p>
          <p class="time">{{ formatDateTime(order.start_time) }} - {{ formatTime(order.end_time) }}</p>
        </div>
        <div class="order-footer">
          <div class="worker-info" v-if="order.worker_nickname">
            <span>陪诊师: {{ order.worker_nickname }}</span>
          </div>
          <span class="amount">¥{{ order.total_amount }}</span>
        </div>

        <div class="order-actions" v-if="order.status === 3" @click.stop>
          <el-button type="primary" size="small" @click="confirmOrder(order.id)">确认完成</el-button>
          <el-button type="danger" size="small" @click="complaintOrder(order.id)">投诉</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="orders.length === 0 && !loading" description="暂无订单" />
    <el-loading v-if="loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const activeTab = ref('')
const orders = ref([])
const loading = ref(false)

const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊', '陪诊师培训']
const statusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中' }

const statusClass = (status) => {
  const classes = { 1: 'warning', 2: 'primary', 3: 'info', 4: 'success', 5: 'danger', 6: 'danger' }
  return classes[status] || ''
}

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

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeTab.value) params.status = activeTab.value
    const res = await request.get('/employer/orders', params)
    if (res.code === 0) {
      orders.value = res.data.orders || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const confirmOrder = async (orderId) => {
  try {
    await ElMessageBox.confirm('确认服务已完成吗？', '提示')
    const res = await request.put(`/employer/orders/${orderId}/confirm`)
    if (res.code === 0) {
      ElMessage.success('已确认完成')
      fetchOrders()
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const complaintOrder = async (orderId) => {
  try {
    await ElMessageBox.prompt('请输入投诉原因', '投诉', {
      confirmButtonText: '提交',
      cancelButtonText: '取消'
    }).then(async ({ value }) => {
      const res = await request.post(`/order/${orderId}/complaint`, { reason: value })
      if (res.code === 0) {
        ElMessage.success('投诉已提交')
        fetchOrders()
      }
    })
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders {
  min-height: 100vh;
  padding: 0 14px calc(104px + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
  color: #4F3A32;
}

.orders-hero {
  margin: 0 -14px 14px;
  padding: 18px 16px 22px;
  background: #E94F3D;
  color: #fff;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-back {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 30px;
  line-height: 1;
  font-weight: 800;
}

.hero-back:active {
  background: rgba(255, 255, 255, 0.2);
}

.orders-hero span {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #f8e1bd;
  color: #5f3b15;
  font-size: 14px;
  font-weight: 900;
}

.orders-hero h1 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 900;
  color: #fff;
}

.orders-hero p {
  margin: 0;
  font-size: 16px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

:deep(.el-tabs) {
  margin-bottom: 14px;
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 6px;
  border: 1px solid #EBD8CF;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 22px rgba(23, 35, 49, 0.06);
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  float: none;
}

:deep(.el-tabs__active-bar) {
  display: none;
}

:deep(.el-tabs__item) {
  min-height: 46px;
  padding: 0 8px !important;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7D6257;
  font-size: 16px;
  font-weight: 900;
}

:deep(.el-tabs__item.is-active) {
  background: #FFF0EC;
  color: #E94F3D;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 0;
}

.order-card {
  background: #fffdf8;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  padding: 18px;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.order-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.order-no {
  font-size: 14px;
  line-height: 1.5;
  font-weight: 800;
  color: #8A6C60;
  word-break: break-all;
}

.order-status {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 900;
  padding: 5px 10px;
  border-radius: 999px;
}

.order-status.warning { background: #f8e1bd; color: #654318; }
.order-status.primary { background: #FFF0EC; color: #E94F3D; }
.order-status.success { background: #FFF3D8; color: #B66A25; }
.order-status.danger { background: #f7e2dc; color: #9c3f24; }
.order-status.info { background: #FFF3EA; color: #7D6257; }

.order-content h4 {
  margin: 0 0 10px;
  font-size: 23px;
  line-height: 1.3;
  font-weight: 900;
  color: #4F3A32;
}

.order-content p {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.5;
  color: #7D6257;
}

.order-content .time {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #FFF9F2;
  color: #E94F3D;
  font-size: 15px;
  font-weight: 900;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F2E6DE;
}

.worker-info {
  font-size: 15px;
  line-height: 1.4;
  font-weight: 800;
  color: #7D6257;
}

.order-footer .amount {
  font-size: 28px;
  line-height: 1;
  color: #b45f32;
  font-weight: 900;
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

:deep(.order-actions .el-button) {
  flex: 1;
  min-height: 50px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 900;
}

@media (max-width: 360px) {
  :deep(.el-tabs__item) {
    font-size: 14px;
  }

  .order-footer,
  .order-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
