<template>
  <div class="dashboard">
    <div class="header">
      <div class="user-info">
        <LinliAvatar class="avatar" :name="userInfo?.nickname || '就诊人'" :src="userInfo?.avatar_url" variant="patient" :size="56" />
        <div class="info">
          <h3>{{ userInfo?.nickname || '就诊人' }}</h3>
          <p>信用积分: {{ employerInfo?.credit_score || 100 }}</p>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <div class="action-item" @click="$router.push('/employer/publish')">
        <span class="icon">📝</span>
        <span>发布任务</span>
      </div>
      <div class="action-item" @click="$router.push('/employer/workers')">
        <span class="icon">👴</span>
        <span>陪诊师广场</span>
      </div>
      <div class="action-item" @click="$router.push('/common/training')">
        <span class="icon">📚</span>
        <span>培训课程</span>
      </div>
      <div class="action-item" @click="$router.push('/common/community')">
        <span class="icon">👥</span>
        <span>银发圈</span>
      </div>
    </div>

    <div class="section">
      <h3>我的订单</h3>
      <div class="order-list">
        <div v-for="order in recentOrders" :key="order.id" class="order-item" @click="$router.push(`/common/order/${order.id}`)">
          <div class="order-info">
            <span class="task-type">{{ taskTypes[order.task_type] }}</span>
            <span class="order-status" :class="statusClass(order.status)">{{ statusNames[order.status] }}</span>
          </div>
          <div class="order-meta">
            <span>{{ order.address }}</span>
            <span class="amount">¥{{ order.total_amount }}</span>
          </div>
        </div>
      </div>
      <el-empty v-if="recentOrders.length === 0" description="暂无订单" />
      <el-button text type="primary" @click="$router.push('/employer/orders')" v-if="recentOrders.length > 0">
        查看全部订单
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import LinliAvatar from '@/components/LinliAvatar.vue'

const userStore = useUserStore()
const userInfo = ref(userStore.userInfo)
const employerInfo = ref(null)
const recentOrders = ref([])

const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊', '陪诊师培训']
const statusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中' }

const statusClass = (status) => {
  const classes = { 1: 'warning', 2: 'primary', 3: 'info', 4: 'success', 5: 'danger', 6: 'danger' }
  return classes[status] || ''
}

onMounted(async () => {
  await userStore.fetchProfile()
  userInfo.value = userStore.userInfo
  employerInfo.value = userStore.userInfo?.employer

  try {
    const res = await request.get('/employer/orders')
    if (res.code === 0) {
      recentOrders.value = res.data.orders?.slice(0, 3) || []
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
  padding: 20px;
  background: linear-gradient(135deg, #E94F3D 0%, #F6A21A 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 20px;
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
  background: #EBD8CF;
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

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
}

.action-item .icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.action-item span:last-child {
  font-size: 12px;
  color: #7D6257;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.section h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.order-item {
  padding: 12px;
  background: #FFF9F2;
  border-radius: 8px;
  cursor: pointer;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-type {
  font-weight: bold;
}

.order-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.order-status.warning { background: #FFF3D8; color: #C98216; }
.order-status.primary { background: #FFF0EC; color: #E94F3D; }
.order-status.success { background: #FFF3D8; color: #B66A25; }
.order-status.danger { background: #F9E7E3; color: #B84545; }
.order-status.info { background: #FFF9F2; color: #8A6C60; }

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #7D6257;
}

.order-meta .amount {
  color: #E94F3D;
  font-weight: bold;
}
</style>
