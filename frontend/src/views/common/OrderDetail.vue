<template>
  <div class="order-detail" :class="{ 'has-fixed-actions': showActions }" v-if="order">
    <header class="order-detail-nav">
      <button class="back-btn order-back" type="button" aria-label="返回上一页" @click="router.back()">‹</button>
      <span>订单信息</span>
    </header>
    <div class="section">
      <h3>订单概览</h3>
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
          <span class="value">{{ formatOrderRoute(order) }}</span>
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
            :src="order.worker_avatar"
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
    <div class="section" v-if="isWorker && order.status >= 2 && order.status <= 4">
      <ServiceCheckpoints
        :progressData="checkpointProgress"
        :canCheckIn="order.status === 2"
        @checkin="handleCheckin"
      />
    </div>

    <!-- 诊前病史资料上传（仅陪诊师可见，服务中） -->
    <div class="section form-section" v-if="isWorker && order.status >= 2 && order.status <= 3">
      <PreHistoryForm :orderId="route.params.id" @submitted="onPreHistoryDone" />
    </div>

    <!-- 诊后陪诊服务报告（仅陪诊师可见，服务中/待确认） -->
    <div class="section form-section" v-if="isWorker && order.status >= 2 && order.status <= 3">
      <ServiceReportForm :orderId="route.params.id" @submitted="onReportDone" />
    </div>

    <div class="section quote-section" v-if="isWorker && order.status === 7">
      <h3>确认报价</h3>
      <p class="quote-lead">请根据就诊人路线和要求确认最终服务价格，就诊人付款后订单进入待服务。</p>
      <div class="quote-route">
        <span>服务路线</span>
        <strong>{{ formatOrderRoute(order) }}</strong>
      </div>
      <label class="quote-field">
        <span>本次报价</span>
        <input v-model="quoteForm.amount" type="number" min="1" inputmode="decimal" />
      </label>
      <label class="quote-field">
        <span>报价说明</span>
        <textarea v-model="quoteForm.quote_note" rows="3" placeholder="可说明交通、排队时长、是否含取药等"></textarea>
      </label>
      <button class="quote-submit" type="button" :disabled="quoteLoading" @click="submitQuote">
        {{ quoteLoading ? '发送中...' : '发送报价' }}
      </button>
    </div>

    <div class="section pay-section" v-if="isEmployer && isPendingPayment">
      <h3>待支付 · 费用确认</h3>
      <p class="quote-lead">陪诊师已根据路线和要求确认报价，支付后进入待服务。</p>
      <div class="pay-summary">
        <span>本次需支付</span>
        <strong>¥{{ formatMoney(order.total_amount) }}</strong>
        <em>{{ order.quote_note || '含平台保障与订单动态通知' }}</em>
      </div>
      <div class="pay-breakdown" aria-label="支付费用明细">
        <div class="pay-breakdown-row">
          <span>服务费用</span>
          <strong>¥{{ formatMoney(order.total_amount) }}</strong>
        </div>
        <div class="pay-breakdown-row">
          <span>平台服务费</span>
          <strong>¥{{ formatMoney(order.platform_commission) }}</strong>
        </div>
        <div class="pay-breakdown-row">
          <span>陪诊师收入</span>
          <strong>¥{{ formatMoney(order.worker_income) }}</strong>
        </div>
        <div class="pay-breakdown-row subtle">
          <span>陪诊意外险</span>
          <strong>50万保障</strong>
        </div>
      </div>
      <button class="quote-submit" type="button" :disabled="payLoading" @click="payOrder">
        {{ payLoading ? '支付中...' : `确认支付 ¥${formatMoney(order.total_amount)}` }}
      </button>
    </div>

    <div class="section" v-if="showFeeSection">
      <h3>费用信息（透明公示）</h3>
      <div class="fee-list" aria-label="费用明细">
        <div class="fee-row">
          <span>服务费用</span>
          <strong>¥{{ formatMoney(order.total_amount) }}</strong>
        </div>
        <div class="fee-row">
          <span>平台服务费</span>
          <strong>¥{{ formatMoney(order.platform_commission) }}</strong>
        </div>
        <div class="fee-row">
          <span>{{ isWorker ? '预计到账' : '陪诊师收入' }}</span>
          <strong>¥{{ formatMoney(order.worker_income) }}</strong>
        </div>
        <div class="fee-row">
          <span>陪诊意外险</span>
          <strong class="success">50万保障 · 平台赠送</strong>
        </div>
        <div class="fee-row total">
          <span>合计</span>
          <strong>¥{{ formatMoney(order.total_amount) }}</strong>
        </div>
      </div>
    </div>

    <div class="section review-section" v-if="canReview">
      <h3>服务评价</h3>
      <p class="review-lead">评价会同步影响陪诊师列表中的综合评分。</p>
      <div v-if="reviewSubmitted" class="review-done-card">
        <strong>评价已提交</strong>
        <span>感谢您的反馈，评分将同步到陪诊师服务表现中。</span>
      </div>
      <div v-else class="review-score-list">
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
      <template v-if="!reviewSubmitted">
        <textarea v-model="reviewForm.comment" class="review-textarea" placeholder="可补充陪诊过程中的感受（选填）"></textarea>
        <button class="review-submit" type="button" @click="submitReview">提交评价</button>
      </template>
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
    <div class="section action-links" v-if="canComplain">
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
import { useRoute, useRouter } from 'vue-router'
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
const router = useRouter()
const userStore = useUserStore()

const order = ref(null)
const checkpointProgress = ref([])
const showComplaint = ref(false)
const preHistoryDone = ref(false)
const reportDone = ref(false)
const reviewSubmitted = ref(false)
const quoteLoading = ref(false)
const payLoading = ref(false)
const quoteForm = reactive({
  amount: '',
  quote_note: ''
})
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
const statusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中', 7: '待报价', 8: '待支付' }

const statusClass = (status) => {
  const classes = { 1: 'warning', 2: 'primary', 3: 'info', 4: 'success', 5: 'danger', 6: 'danger', 7: 'info', 8: 'warning' }
  return classes[status] || ''
}

const isEmployer = computed(() => order.value?.employer_id === userStore.userInfo?.id)
const isWorker = computed(() => order.value?.worker_id === userStore.userInfo?.id)
const isPendingPayment = computed(() => Number(order.value?.status) === 8)
const showFeeSection = computed(() => !isPendingPayment.value)
const showActions = computed(() => order.value?.status < 4 && order.value?.status !== 8 && (isEmployer.value || isWorker.value))
const canReview = computed(() => {
  const status = Number(order.value?.status)
  return isEmployer.value && order.value?.worker_id && status >= 3 && status <= 4
})
const canComplain = computed(() => {
  const status = Number(order.value?.status)
  return status >= 3 && status <= 6
})

const formatMoney = (value) => Number(value || 0).toFixed(2)

const formatOrderRoute = (item) => {
  const start = item?.address || '就诊人地点'
  const end = item?.target_hospital || item?.targetHospital || '目标医院'
  return `${start} → ${end}`
}

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

const submitQuote = async () => {
  const amount = Number(quoteForm.amount)
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入正确的报价金额')
    return
  }
  quoteLoading.value = true
  try {
    const res = await request.post(`/worker/orders/${route.params.id}/quote`, {
      amount,
      quote_note: quoteForm.quote_note
    })
    if (res.code === 0) {
      ElMessage.success('报价已发送，等待就诊人支付')
      fetchOrder()
    }
  } catch (e) {
    ElMessage.error(e.message || '报价失败')
  } finally {
    quoteLoading.value = false
  }
}

const payOrder = async () => {
  payLoading.value = true
  try {
    const res = await request.post(`/employer/orders/${route.params.id}/pay`)
    if (res.code === 0) {
      ElMessage.success('支付成功，订单进入待服务')
      fetchOrder()
    }
  } catch (e) {
    ElMessage.error(e.message || '支付失败')
  } finally {
    payLoading.value = false
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
      quoteForm.amount = String(res.data.total_amount || '')
      quoteForm.quote_note = res.data.quote_note || ''
      reviewSubmitted.value = Boolean(res.data.review)
      if (isWorker.value) {
        fetchCheckpoints()
      }
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
  min-height: 100vh;
  padding: 14px 14px 24px;
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
  color: #4F3A32;
}

.order-detail.has-fixed-actions {
  padding-bottom: calc(110px + env(safe-area-inset-bottom));
}

.order-detail-nav {
  min-height: 48px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.order-detail-nav span {
  text-align: center;
  color: #4F3A32;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 900;
}

.order-back {
  font-size: 30px !important;
  line-height: 1 !important;
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

.quote-lead {
  margin: -4px 0 14px;
  color: #8A6C60 !important;
}

.quote-route,
.pay-summary {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid #F2E6DE;
  border-radius: 16px;
  background: #FFF9F2;
}

.quote-route span,
.pay-summary span,
.quote-field span {
  color: #8A6C60;
  font-size: 13px;
  font-weight: 900;
}

.quote-route strong {
  color: #4F3A32;
  font-size: 16px;
  line-height: 1.45;
}

.pay-summary strong {
  color: #D94A37;
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
}

.pay-summary em {
  color: #8A6C60;
  font-size: 14px;
  line-height: 1.45;
  font-style: normal;
  font-weight: 800;
}

.pay-breakdown {
  display: grid;
  gap: 0;
  margin-bottom: 14px;
  border: 1px solid #F2E6DE;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}

.pay-breakdown-row {
  min-height: 48px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border-bottom: 1px solid #F5E9E3;
}

.pay-breakdown-row:last-child {
  border-bottom: none;
}

.pay-breakdown-row span {
  color: #7D6257;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 900;
}

.pay-breakdown-row strong {
  color: #4F3A32;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 900;
  text-align: right;
  white-space: nowrap;
}

.pay-breakdown-row.subtle {
  background: #FFF9F2;
}

.pay-breakdown-row.subtle strong {
  color: #9A6A2D;
}

.quote-field {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
}

.quote-field input,
.quote-field textarea {
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border: 1px solid #EBD8CF;
  border-radius: 14px;
  background: #fff;
  color: #4F3A32;
  font: inherit;
  box-shadow: none;
  outline: none;
}

.quote-field textarea {
  resize: vertical;
}

.quote-field input:focus,
.quote-field textarea:focus {
  border-color: #D94A37;
  box-shadow: 0 0 0 3px rgba(217, 74, 55, 0.1);
}

.quote-submit {
  width: 100%;
  min-height: 54px;
  border: 1px solid #D94A37 !important;
  border-radius: 14px !important;
  background: #D94A37 !important;
  color: #fff !important;
  font-size: 17px;
  font-weight: 900;
}

.review-done-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid #F2E6DE;
  border-radius: 16px;
  background: #FFF9F2;
}

.review-done-card strong {
  color: #D94A37;
  font-size: 18px;
}

.review-done-card span {
  color: #7D6257;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 800;
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
