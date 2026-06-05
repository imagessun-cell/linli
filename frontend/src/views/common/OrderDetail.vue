<template>
  <div class="order-detail" v-if="order">
    <div class="section">
      <h3>订单信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">订单号</span>
          <span class="value">{{ order.order_no }}</span>
        </div>
        <div class="info-item">
          <span class="label">订单状态</span>
          <span class="value status" :class="statusClass(order.status)">{{ statusNames[order.status] }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务类型</span>
          <span class="value">{{ taskTypes[order.task_type] }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务地址</span>
          <span class="value">{{ order.address }}</span>
        </div>
        <div class="info-item">
          <span class="label">开始时间</span>
          <span class="value">{{ formatDateTime(order.start_time) }}</span>
        </div>
        <div class="info-item">
          <span class="label">结束时间</span>
          <span class="value">{{ formatDateTime(order.end_time) }}</span>
        </div>
      </div>
    </div>

    <div class="section" v-if="order.special_requirements">
      <h3>特殊要求</h3>
      <p>{{ order.special_requirements }}</p>
    </div>

    <div class="section">
      <h3>就诊人信息</h3>
      <div class="user-info">
        <span>{{ order.employer_nickname }}</span>
        <el-button size="small" @click="$router.push(`/common/chat/${order.employer_id}`)">咨询</el-button>
      </div>
    </div>

    <div class="section" v-if="order.worker_nickname">
      <h3>陪诊师信息</h3>
      <div class="user-info">
        <span>{{ order.worker_nickname }}</span>
        <el-button size="small" @click="$router.push(`/common/chat/${order.worker_id}`)">咨询</el-button>
      </div>
    </div>

    <div class="section">
      <h3>费用信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">订单金额</span>
          <span class="value primary">¥{{ order.total_amount }}</span>
        </div>
        <div class="info-item">
          <span class="label">平台佣金</span>
          <span class="value">¥{{ order.platform_commission }}</span>
        </div>
        <div class="info-item">
          <span class="label">陪诊师收入</span>
          <span class="value">¥{{ order.worker_income }}</span>
        </div>
      </div>
    </div>

    <div class="actions" v-if="showActions">
      <el-button v-if="order.status === 3 && isEmployer" type="primary" @click="confirmOrder">
        确认完成
      </el-button>
      <el-button v-if="order.status === 2 && isWorker" type="success" @click="completeOrder">
        完成服务
      </el-button>
      <el-button v-if="order.status < 3" type="danger" @click="cancelOrder">
        取消订单
      </el-button>
    </div>
  </div>
  <el-loading v-else />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const userStore = useUserStore()

const order = ref(null)

const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊']
const statusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中' }

const statusClass = (status) => {
  const classes = { 1: 'warning', 2: 'primary', 3: 'info', 4: 'success', 5: 'danger', 6: 'danger' }
  return classes[status] || ''
}

const isEmployer = computed(() => order.value?.employer_id === userStore.userInfo?.id)
const isWorker = computed(() => order.value?.worker_id === userStore.userInfo?.id)
const showActions = computed(() => order.value?.status < 4 && (isEmployer.value || isWorker.value))

const formatDateTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const confirmOrder = async () => {
  try {
    const res = await request.put(`/employer/orders/${route.params.id}/confirm`)
    if (res.code === 0) {
      ElMessage.success('已确认完成')
      fetchOrder()
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const completeOrder = async () => {
  try {
    const res = await request.put(`/worker/orders/${route.params.id}/complete`)
    if (res.code === 0) {
      ElMessage.success('已完成，等待确认')
      fetchOrder()
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const cancelOrder = async () => {
  try {
    const res = await request.put(`/task/${order.value.task_id}/cancel`)
    if (res.code === 0) {
      ElMessage.success('订单已取消')
      fetchOrder()
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const fetchOrder = async () => {
  try {
    const res = await request.get(`/order/${route.params.id}`)
    if (res.code === 0) {
      order.value = res.data
    }
  } catch (e) {
    ElMessage.error('获取订单详情失败')
  }
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.order-detail {
  padding-bottom: 20px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section h3 {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
}

.section p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
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
  color: #999;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 14px;
  color: #333;
}

.info-item .value.primary {
  color: #667eea;
  font-weight: bold;
}

.info-item .value.status {
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.info-item .value.warning { background: #fff3e0; color: #ff9800; }
.info-item .value.primary { background: #e3f2fd; color: #2196f3; }
.info-item .value.success { background: #e8f5e9; color: #4caf50; }
.info-item .value.danger { background: #ffebee; color: #f44336; }
.info-item .value.info { background: #f5f5f5; color: #999; }

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info span {
  font-size: 14px;
  color: #333;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.actions .el-button {
  flex: 1;
}
</style>