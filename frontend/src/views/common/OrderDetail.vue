<template>
  <div class="order-detail" :class="{ 'has-fixed-actions': showActions }" v-if="order">
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

    <div class="section" v-if="isWorker">
      <h3>就诊人信息</h3>
      <div class="user-info">
        <span>{{ maskName(order.employer_nickname) }}</span>
        <span style="font-size: 12px; color: #8A6C60;">{{ maskPhone(order.employer_phone) }}</span>
        <el-button size="small" @click="$router.push(`/common/chat/${order.employer_id}`)">发消息</el-button>
      </div>
    </div>

    <div class="section" v-if="isEmployer && order.worker_nickname">
      <h3>陪诊师信息</h3>
      <div class="user-info">
        <div class="worker-info-card">
          <LinliAvatar
            :name="order.worker_nickname || '陪诊师'"
            :src="order.worker_avatar || workerCert?.avatar_url"
            variant="worker"
            :size="52"
          />
          <div class="worker-info">
            <span>{{ maskName(order.worker_nickname) }}</span>
            <span class="muted-phone">{{ maskPhone(order.worker_phone) }}</span>
            <em>已完成身份认证</em>
          </div>
        </div>
        <el-button size="small" @click="$router.push(`/common/chat/${order.worker_id}`)">发消息</el-button>
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
      <div class="fee-list" aria-label="费用明细">
        <div class="fee-row">
          <span>服务费用</span>
          <strong>¥{{ order.total_amount }}</strong>
        </div>
        <div class="fee-row">
          <span>平台服务费</span>
          <strong>¥{{ order.platform_commission }}</strong>
        </div>
        <div class="fee-row">
          <span>{{ isWorker ? '预计到账' : '陪诊师收入' }}</span>
          <strong>¥{{ order.worker_income }}</strong>
        </div>
        <div class="fee-row">
          <span>陪诊意外险</span>
          <strong class="success">50万保障 · 平台赠送</strong>
        </div>
        <div class="fee-row total">
          <span>合计</span>
          <strong>¥{{ order.total_amount }}</strong>
        </div>
      </div>
    </div>

    <div class="section review-section" v-if="canReview">
      <h3>服务评价</h3>
      <p class="review-lead">评价会同步影响陪诊师列表中的综合评分。</p>
      <div class="review-score-list">
        <div v-for="item in reviewFields" :key="item.key" class="review-score-row">
          <span>{{ item.label }}</span>
          <div class="score-buttons" role="group" :aria-label="item.label">
            <button
              v-for="score in [1, 2, 3, 4, 5]"
              :key="score"
              type="button"
              :class="{ active: reviewForm[item.key] === score }"
              @click="reviewForm[item.key] = score"
            >
              {{ score }}
            </button>
          </div>
        </div>
      </div>
      <textarea v-model="reviewForm.comment" class="review-textarea" placeholder="可补充陪诊过程中的感受（选填）"></textarea>
      <button class="review-submit" type="button" :disabled="reviewSubmitted" @click="submitReview">
        {{ reviewSubmitted ? '已提交评价' : '提交评价' }}
      </button>
    </div>

    <div class="actions" v-if="showActions">
      <el-button v-if="order.status < 3" type="danger" @click="cancelOrder">
        取消订单
      </el-button>
      <el-button v-if="order.status === 2 && isWorker" type="success" @click="completeOrder">
        完成服务
      </el-button>
      <el-button v-if="order.status === 3 && isEmployer" type="primary" @click="confirmOrder">
        确认完成
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
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import { maskName, maskPhone } from '@/utils/privacy'
import ServiceCheckpoints from '@/components/v1_4/ServiceCheckpoints.vue'
import ComplaintDialog from '@/components/v1_4/ComplaintDialog.vue'
import PreHistoryForm from '@/components/v1_4/PreHistoryForm.vue'
import ServiceReportForm from '@/components/v1_4/ServiceReportForm.vue'
import LinliAvatar from '@/components/LinliAvatar.vue'

const route = useRoute()
const userStore = useUserStore()

const order = ref(null)
const workerCert = ref(null)
const checkpointProgress = ref([])
const showComplaint = ref(false)
const preHistoryDone = ref(false)
const reportDone = ref(false)
const reviewSubmitted = ref(false)
const reviewFields = [
  { key: 'punctuality', label: '准时到达' },
  { key: 'communication', label: '沟通耐心' },
  { key: 'process', label: '流程熟悉' }
]
const reviewForm = reactive({
  punctuality: 5,
  communication: 5,
  process: 5,
  comment: ''
})

const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊', '陪诊师培训']
const statusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中' }

const statusClass = (status) => {
  const classes = { 1: 'warning', 2: 'primary', 3: 'info', 4: 'success', 5: 'danger', 6: 'danger' }
  return classes[status] || ''
}

const isEmployer = computed(() => order.value?.employer_id === userStore.userInfo?.id)
const isWorker = computed(() => order.value?.worker_id === userStore.userInfo?.id)
const showActions = computed(() => order.value?.status < 4 && (isEmployer.value || isWorker.value))
const canReview = computed(() => isEmployer.value && order.value?.worker_id && order.value?.status >= 3)

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

const submitReview = async () => {
  if (reviewSubmitted.value) return
  try {
    const res = await request.post(`/order/${route.params.id}/review`, {
      worker_id: order.value.worker_id,
      punctuality: reviewForm.punctuality,
      communication: reviewForm.communication,
      process: reviewForm.process,
      comment: reviewForm.comment
    })
    if (res.code === 0) {
      reviewSubmitted.value = true
      ElMessage.success('评价已提交')
    }
  } catch (e) {
    ElMessage.error(e.message || '评价提交失败')
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
  min-height: 100vh;
  padding: 14px 14px 24px;
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
  color: #4F3A32;
}

.order-detail.has-fixed-actions {
  padding-bottom: calc(110px + env(safe-area-inset-bottom));
}

.section {
  background: #fffdf8;
  border: 1px solid #EBD8CF;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 22px rgba(64, 48, 40, 0.055);
}

.section h3 {
  font-size: 18px;
  color: #4F3A32;
  margin-bottom: 12px;
  font-weight: 900;
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

.worker-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-info span {
  font-size: 16px;
  color: #4F3A32;
}

.muted-phone,
.worker-info em {
  font-size: 13px !important;
  color: #8A6C60 !important;
  font-style: normal;
}

.fee-list {
  display: grid;
  gap: 0;
  border: 1px solid #EFE2DC;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.fee-row {
  min-height: 54px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #F2E6DE;
}

.fee-row:last-child {
  border-bottom: none;
}

.fee-row span {
  font-size: 15px;
  font-weight: 800;
  color: #6F5C53;
}

.fee-row strong {
  font-size: 17px;
  font-weight: 900;
  color: #4F3A32;
  text-align: right;
}

.fee-row strong.success {
  color: #9A6A2D;
}

.fee-row.total {
  background: #FFF0EC;
}

.fee-row.total span,
.fee-row.total strong {
  color: #D94A37;
  font-size: 18px;
}

.review-lead {
  margin: -4px 0 14px;
  color: #8A6C60 !important;
}

.review-score-list {
  display: grid;
  gap: 12px;
}

.review-score-row {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.review-score-row > span {
  font-size: 15px;
  font-weight: 900;
  color: #4F3A32;
}

.score-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.score-buttons button {
  min-height: 40px !important;
  padding: 0 !important;
  border-radius: 12px !important;
  background: #fff !important;
  border: 1px solid #EBD8CF !important;
  color: #6F5C53 !important;
  font-size: 15px !important;
}

.score-buttons button.active {
  background: #FFF0EC !important;
  border-color: #D94A37 !important;
  color: #D94A37 !important;
}

.review-textarea {
  width: 100%;
  min-height: 86px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid #EBD8CF;
  border-radius: 14px;
  resize: vertical;
  background: #fff;
  color: #4F3A32;
  font: inherit;
  font-size: 15px;
  outline: none;
}

.review-textarea:focus {
  border-color: #D94A37;
}

.review-submit {
  width: 100%;
  margin-top: 12px;
  background: #D94A37 !important;
  border-color: #D94A37 !important;
  color: #fff !important;
}

.actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 80;
  display: flex;
  gap: 12px;
  margin-top: 0;
  padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #EBD8CF;
  background: rgba(255, 253, 248, 0.96);
  box-shadow: 0 -8px 22px rgba(64, 48, 40, 0.08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.actions .el-button {
  flex: 1;
  min-height: 56px;
}

.action-links {
  text-align: center;
}
</style>
