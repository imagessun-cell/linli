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
          <span class="label">服务时间</span>
          <span class="value">{{ formatServiceTime(order.start_time, order.end_time) }}</span>
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
        <span>{{ maskName(order.employer_nickname) }}</span>
        <span style="font-size: 12px; color: #8A6C60;">{{ maskPhone(order.employer_phone) }}</span>
        <el-button size="small" @click="$router.push(`/common/chat/${order.employer_id}`)">咨询</el-button>
      </div>
    </div>

    <div class="section" v-if="order.worker_nickname">
      <h3>陪诊师信息</h3>
      <div class="user-info">
        <div class="worker-info">
          <span>{{ maskName(order.worker_nickname) }}</span>
          <span style="font-size: 12px; color: #8A6C60;">{{ maskPhone(order.worker_phone) }}</span>
          <CertificationBadge v-if="workerCert" :level="workerCert.level" :totalOrders="workerCert.total_orders" :avgRating="workerCert.avg_rating" size="small" />
        </div>
        <el-button size="small" @click="$router.push(`/common/chat/${order.worker_id}`)">咨询</el-button>
      </div>
    </div>

    <!-- 服务流程打卡（仅陪诊师可见） -->
    <div class="section" v-if="isWorker && order.status >= 2">
      <ServiceCheckpoints
        :progressData="checkpointProgress"
        :canCheckIn="order.status === 2"
        @checkin="handleCheckin"
      />
    </div>

    <!-- 诊前病史资料上传（仅陪诊师可见，服务中） -->
    <div class="section" v-if="isWorker && order.status === 2 && !preHistoryDone">
      <PreHistoryForm :orderId="route.params.id" @submitted="onPreHistoryDone" />
    </div>

    <!-- 诊后陪诊服务报告（仅陪诊师可见，服务中/待确认） -->
    <div class="section" v-if="isWorker && order.status >= 2 && order.status <= 3 && !reportDone">
      <ServiceReportForm :orderId="route.params.id" @submitted="onReportDone" />
    </div>

    <div class="section">
      <h3>费用信息（透明公示）</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">订单金额</span>
          <span class="value primary">¥{{ order.total_amount }}</span>
        </div>
        <div class="info-item">
          <span class="label">平台服务费</span>
          <span class="value">¥{{ order.platform_commission }}</span>
        </div>
        <div class="info-item">
          <span class="label">陪诊师收入</span>
          <span class="value">¥{{ order.worker_income }}</span>
        </div>
        <div class="info-item">
          <span class="label">保险</span>
          <span class="value success">50万意外险·免费</span>
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

    <!-- 投诉入口 -->
    <div class="section action-links" v-if="order.status >= 3">
      <el-button text type="danger" size="small" @click="showComplaint = true">
        投诉违规行为
      </el-button>
    </div>

    <!-- 组件实例化 -->
    <ComplaintDialog
      v-model="showComplaint"
      :orderId="route.params.id"
      :respondentId="isEmployer ? order.worker_id : order.employer_id"
      @submitted="showComplaint = false"
    />
  </div>
  <el-loading v-else />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import { maskName, maskPhone } from '@/utils/privacy'
import ServiceCheckpoints from '@/components/v1_4/ServiceCheckpoints.vue'
import CertificationBadge from '@/components/v1_4/CertificationBadge.vue'
import ComplaintDialog from '@/components/v1_4/ComplaintDialog.vue'
import PreHistoryForm from '@/components/v1_4/PreHistoryForm.vue'
import ServiceReportForm from '@/components/v1_4/ServiceReportForm.vue'

const route = useRoute()
const userStore = useUserStore()

const order = ref(null)
const workerCert = ref(null)
const checkpointProgress = ref([])
const showComplaint = ref(false)
const preHistoryDone = ref(false)
const reportDone = ref(false)

const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊', '陪诊师培训']
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

const handleCheckin = async (key, name) => {
  try {
    const res = await request.post(`/v1/orders/${route.params.id}/checkpoint`, {
      checkpoint_key: key,
      checkpoint_name: name
    })
    if (res.code === 0) {
      ElMessage.success(`「${name}」打卡成功`)
      fetchCheckpoints()
    }
  } catch (e) {
    ElMessage.error(e.message || '打卡失败')
  }
}

const onPreHistoryDone = () => {
  preHistoryDone.value = true
  ElMessage.success('病史资料已确认')
}

const onReportDone = () => {
  reportDone.value = true
  ElMessage.success('服务报告已提交')
}

const fetchCheckpoints = async () => {
  try {
    const res = await request.get(`/v1/orders/${route.params.id}/checkpoints`)
    if (res.code === 0) {
      checkpointProgress.value = res.data.progress || []
    }
  } catch (e) {
    // silently fail
  }
}

const fetchOrder = async () => {
  try {
    const res = await request.get(`/order/${route.params.id}`)
    if (res.code === 0) {
      order.value = res.data
      // Fetch worker certification
      if (res.data.worker_id) {
        const certRes = await request.get('/v1/certification').catch(() => null)
        if (certRes?.code === 0) {
          workerCert.value = certRes.data
        }
      }
    }
  } catch (e) {
    ElMessage.error('获取订单详情失败')
  }
}

onMounted(() => {
  fetchOrder()
  if (isWorker) {
    fetchCheckpoints()
  }
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
  color: #8A6C60;
  margin-bottom: 12px;
}

.section p {
  font-size: 14px;
  color: #7D6257;
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
  color: #8A6C60;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 14px;
  color: #4F3A32;
}

.info-item .value.primary {
  color: #E94F3D;
  font-weight: bold;
}

.info-item .value.success {
  color: #B66A25;
}

.info-item .value.status {
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.info-item .value.warning { background: #FFF3D8; color: #C98216; }
.info-item .value.primary { background: #FFF0EC; color: #E94F3D; }
.info-item .value.success { background: #FFF3D8; color: #B66A25; }
.info-item .value.danger { background: #F9E7E3; color: #B84545; }
.info-item .value.info { background: #FFF9F2; color: #8A6C60; }

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-info span {
  font-size: 14px;
  color: #4F3A32;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.actions .el-button {
  flex: 1;
}

.action-links {
  text-align: center;
}
</style>
