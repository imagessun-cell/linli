<template>
  <div class="profile-container">
    <header class="profile-header">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <LinliAvatar
            :name="displayName"
            :src="isLoggedIn ? userInfo?.avatar_url : ''"
            :variant="currentRole === 'worker' ? 'worker' : 'patient'"
            :size="76"
          />
        </div>
        <p class="nickname" role="heading" aria-level="2">
          {{ displayName }}
        </p>
        <div class="profile-meta" :aria-label="isLoggedIn ? '个人信息' : '登录提示'">
          <span v-if="isLoggedIn" class="meta-chip"><em>年龄</em>{{ displayAgeText }}</span>
          <span v-if="isLoggedIn" class="meta-chip community"><em>社区</em>{{ displayCommunity }}</span>
          <span v-else class="meta-chip community">登录后查看更多信息</span>
        </div>
      </div>
    </header>

    <nav class="role-tabs" role="tablist" aria-label="角色选择">
      <div
        role="tab"
        :aria-selected="currentRole === 'worker'"
        :class="['role-tab', { active: currentRole === 'worker' }]"
        @click="currentRole = 'worker'"
        @keydown="handleTabKeydown($event, 'worker')"
      >
        陪诊师
      </div>
      <div
        role="tab"
        :aria-selected="currentRole === 'employer'"
        :class="['role-tab', { active: currentRole === 'employer' }]"
        @click="currentRole = 'employer'"
        @keydown="handleTabKeydown($event, 'employer')"
      >
        就诊人
      </div>
    </nav>

    <main class="profile-content" role="tabpanel">
      <div v-if="!isLoggedIn" class="login-prompt">
        <p class="prompt-text">登录后可查看完整信息</p>
        <button class="login-btn" @click="$router.push('/login')">立即登录</button>
      </div>

      <div v-else-if="currentRole === 'worker'" class="role-content worker-content">
        <button class="profile-entry task-entry" type="button" @click="$router.push('/worker/my-tasks')">
          <span class="entry-copy">
            <strong>我的任务</strong>
            <span>查看已接、进行中、待确认服务</span>
          </span>
          <span class="entry-metric">
            <strong>{{ workerInfo?.completed_tasks || 0 }}</strong>
            <span>已完成</span>
          </span>
          <span class="entry-arrow" aria-hidden="true">›</span>
        </button>

        <button class="profile-entry training-entry" type="button" @click="$router.push('/common/training')">
          <span class="entry-copy">
            <strong>线上培训 <i class="entry-inline-tag">3套课程</i></strong>
            <span>陪诊流程、医院动线、沟通要点</span>
          </span>
          <span class="entry-metric training-metric">
            <strong>3</strong>
            <span>课程</span>
          </span>
          <span class="entry-arrow" aria-hidden="true">›</span>
        </button>

        <section v-if="latestWorkerOrder" class="info-section order-progress-section" aria-labelledby="worker-order-progress-title">
          <h3 id="worker-order-progress-title" class="section-title">最近任务动态</h3>
          <button class="order-progress-card" type="button" @click="$router.push(`/common/order/${latestWorkerOrder.id}`)">
            <span class="order-progress-status">{{ orderStatusText(latestWorkerOrder.status) }}</span>
            <strong>{{ formatOrderService(latestWorkerOrder) }}</strong>
            <p>{{ latestWorkerOrder.address || '服务地点待确认' }}</p>
            <span class="order-progress-foot">
              <span>{{ formatDate(latestWorkerOrder.created_at) }}</span>
              <em>收入 ¥{{ formatMoney(latestWorkerOrder.worker_income) }}</em>
            </span>
          </button>
        </section>

        
        <section class="info-section" aria-labelledby="worker-basic-title">
          <h3 id="worker-basic-title" class="section-title">基本信息</h3>
          <dl class="info-list">
            <div class="info-item">
              <dt class="label">真实姓名</dt>
              <dd class="value">{{ userInfo?.real_name || '未填写' }}</dd>
            </div>
            <div class="info-item">
              <dt class="label">实名认证</dt>
              <dd class="value">
                <button
                  type="button"
                  :class="['verify-entry-btn', userInfo?.face_verified ? 'success' : 'warning']"
                  @click="openRealnameDialog"
                >
                  {{ userInfo?.face_verified ? '已认证 · 重新认证' : '去认证' }}
                </button>
              </dd>
            </div>
            <div class="info-item">
              <dt class="label">陪诊师状态</dt>
              <dd class="value" :class="statusClass">
                {{ statusNames[workerInfo?.status] || '未申请' }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="info-section" aria-labelledby="worker-stats-title">
          <h3 id="worker-stats-title" class="section-title">服务统计</h3>
          <div class="stats-grid">
            <button
              v-for="stat in workerStatCards"
              :key="stat.key"
              class="stat-item stat-action"
              type="button"
              @click="openWorkerStatDetail(stat)"
            >
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </button>
          </div>
        </section>

        <section class="info-section wallet-section" aria-labelledby="wallet-title">
          <h3 id="wallet-title" class="section-title">我的钱包</h3>
          <dl class="info-list">
            <div class="info-item">
              <dt class="label">现金余额</dt>
              <dd class="value highlight">¥{{ formatMoney(walletInfo?.cash_balance) }}</dd>
            </div>
            <div class="info-item">
              <dt class="label">积分余额</dt>
              <dd class="value">{{ walletInfo?.points_balance || 0 }}</dd>
            </div>
          </dl>
          <div class="wallet-actions">
            <button class="wallet-btn primary" type="button" @click="showRecharge = true">充值</button>
            <button class="wallet-btn" type="button" @click="showWithdraw = true">提现</button>
            <button class="wallet-btn ghost" type="button" @click="openWalletDetail">明细</button>
          </div>
        </section>
      </div>

      <div v-else class="role-content employer-content">
        <section class="info-section" aria-labelledby="employer-basic-title">
          <h3 id="employer-basic-title" class="section-title">账户信息</h3>
          <dl class="info-list">
            <div class="info-item">
              <dt class="label">信用积分</dt>
              <dd class="value credit-value">
                {{ employerInfo?.credit_score || 100 }}
                <button class="inline-link-btn" type="button" @click="showCreditDetail = true">查看明细</button>
              </dd>
            </div>
            <div class="info-item">
              <dt class="label">我的角色</dt>
              <dd class="value">就诊人</dd>
            </div>
            <div class="info-item">
              <dt class="label">发布任务</dt>
              <dd class="value">{{ employerInfo?.published_tasks || 0 }}</dd>
            </div>
          </dl>
        </section>

        <button class="profile-entry order-entry" type="button" @click="$router.push('/employer/orders')">
          <span class="entry-copy">
            <strong>我的订单</strong>
            <span>查看陪诊订单、沟通记录和进度</span>
          </span>
          <span class="entry-metric">
            <strong>{{ employerInfo?.published_tasks || 0 }}</strong>
            <span>已发布</span>
          </span>
          <span class="entry-arrow" aria-hidden="true">›</span>
        </button>

        <section v-if="latestEmployerOrder" class="info-section order-progress-section" aria-labelledby="employer-order-progress-title">
          <h3 id="employer-order-progress-title" class="section-title">最近订单动态</h3>
          <button class="order-progress-card" type="button" @click="$router.push(`/common/order/${latestEmployerOrder.id}`)">
            <span class="order-progress-status">{{ orderStatusText(latestEmployerOrder.status) }}</span>
            <strong>{{ formatOrderService(latestEmployerOrder) }}</strong>
            <p>{{ latestEmployerOrder.worker_nickname ? `陪诊师：${latestEmployerOrder.worker_nickname}` : '等待陪诊师确认' }}</p>
            <span class="order-progress-foot">
              <span>{{ formatDate(latestEmployerOrder.created_at) }}</span>
              <em>支付 ¥{{ formatMoney(latestEmployerOrder.total_amount) }}</em>
            </span>
          </button>
        </section>
      </div>
    </main>

    <el-dialog v-model="showRecharge" title="钱包充值" width="90%" align-center>
      <el-form :model="rechargeForm" label-width="86px">
        <el-form-item label="充值金额">
          <el-input v-model="rechargeForm.amount" type="number" placeholder="请输入充值金额" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" :loading="walletActionLoading" @click="handleRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWithdraw" title="钱包提现" width="90%" align-center>
      <el-form :model="withdrawForm" label-width="86px">
        <el-form-item label="提现金额">
          <el-input v-model="withdrawForm.amount" type="number" placeholder="请输入提现金额" />
        </el-form-item>
        <el-form-item label="可提现">
          <span class="dialog-amount">¥{{ formatMoney(walletInfo?.cash_balance) }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWithdraw = false">取消</el-button>
        <el-button type="primary" :loading="walletActionLoading" @click="handleWithdraw">确认提现</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWalletDetail" title="钱包明细" width="92%" align-center>
      <div class="detail-list">
        <div v-for="tx in walletTransactions" :key="tx.id" class="detail-row">
          <div>
            <strong>{{ txTypeNames[tx.type] || '账户变动' }}</strong>
            <span>{{ formatDate(tx.created_at) }}</span>
          </div>
          <em :class="tx.type === 2 ? 'minus' : 'plus'">{{ formatTxAmount(tx) }}</em>
        </div>
        <el-empty v-if="walletTransactions.length === 0" description="暂无交易明细" />
      </div>
    </el-dialog>

    <el-dialog v-model="showCreditDetail" title="积分详情" width="92%" align-center>
      <div class="detail-list">
        <div v-for="item in creditDetails" :key="item.id" class="detail-row">
          <div>
            <strong>{{ item.title }}</strong>
            <span>{{ item.date }}</span>
          </div>
          <em :class="item.points >= 0 ? 'plus' : 'minus'">{{ item.points >= 0 ? '+' : '' }}{{ item.points }}</em>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showWorkerStatDetail" :title="activeWorkerStat?.title || '服务统计详情'" width="92%" align-center>
      <div v-if="activeWorkerStat" class="stat-detail-dialog">
        <div class="stat-detail-hero">
          <strong>{{ activeWorkerStat.value }}</strong>
          <span>{{ activeWorkerStat.label }}</span>
          <p>{{ activeWorkerStat.summary }}</p>
        </div>
        <div class="stat-detail-list">
          <div v-for="item in activeWorkerStat.items" :key="item.label" class="stat-detail-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showRealnameDialog" title="实名认证" width="92%" align-center>
      <div class="realname-dialog">
        <label class="realname-field">
          <span>真实姓名</span>
          <input v-model="realnameForm.real_name" type="text" placeholder="请输入身份证姓名" />
        </label>
        <label class="realname-field">
          <span>身份证号</span>
          <input v-model="realnameForm.id_card" type="text" placeholder="请输入身份证号码" />
        </label>
        <div class="realname-upload-grid">
          <input ref="realnameFrontInputRef" class="hidden-file-input" type="file" accept="image/*" capture="environment" @change="handleRealnameFileChange($event, 'front')" />
          <input ref="realnameBackInputRef" class="hidden-file-input" type="file" accept="image/*" capture="environment" @change="handleRealnameFileChange($event, 'back')" />
          <button class="realname-upload-card" type="button" @click="realnameFrontInputRef?.click()">
            <span>人像面</span>
            <strong>{{ realnameForm.id_card_front ? '已上传正面' : '扫描/拍照上传正面' }}</strong>
            <em>{{ realnameForm.id_card_front || '照片仅用于认证审核' }}</em>
          </button>
          <button class="realname-upload-card" type="button" @click="realnameBackInputRef?.click()">
            <span>国徽面</span>
            <strong>{{ realnameForm.id_card_back ? '已上传反面' : '扫描/拍照上传反面' }}</strong>
            <em>{{ realnameForm.id_card_back || '平台会保护隐私信息' }}</em>
          </button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRealnameDialog = false">取消</el-button>
        <el-button type="primary" :loading="realnameLoading" @click="submitRealname">提交认证</el-button>
      </template>
    </el-dialog>

    <footer v-if="isLoggedIn" class="logout-section">
      <router-link to="/admin" class="admin-link">⚙️ 管理后台</router-link>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import LinliAvatar from '@/components/LinliAvatar.vue'

const router = useRouter()
const userStore = useUserStore()

const currentRole = ref('worker')
const workerInfo = ref(null)
const employerInfo = ref(null)
const walletInfo = ref(null)
const walletTransactions = ref([])
const workerOrders = ref([])
const employerOrders = ref([])
const showRecharge = ref(false)
const showWithdraw = ref(false)
const showWalletDetail = ref(false)
const showCreditDetail = ref(false)
const showRealnameDialog = ref(false)
const showWorkerStatDetail = ref(false)
const activeWorkerStat = ref(null)
const walletActionLoading = ref(false)
const realnameLoading = ref(false)
const rechargeForm = ref({ amount: '' })
const withdrawForm = ref({ amount: '' })
const realnameFrontInputRef = ref()
const realnameBackInputRef = ref()
const realnameForm = ref({
  real_name: '',
  id_card: '',
  id_card_front: '',
  id_card_back: ''
})

const txTypeNames = { 1: '服务收入', 2: '提现申请', 3: '积分兑换', 4: '钱包充值' }
const taskTypes = ['', '全程陪同', '挂号取药', '门诊陪护', '代为问诊', '陪诊师培训']
const orderStatusNames = { 1: '待服务', 2: '服务中', 3: '待确认', 4: '已完成', 5: '已取消', 6: '退款中' }

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)
const statusNames = { 0: '审核中', 1: '已认证', 2: '已驳回' }
const activeRoleInfo = computed(() => {
  if (currentRole.value === 'worker') return workerInfo.value || userInfo.value?.worker || {}
  return employerInfo.value || userInfo.value?.employer || {}
})

const displayName = computed(() => {
  if (!isLoggedIn.value) return '游客'
  return userInfo.value?.nickname || userInfo.value?.real_name || '邻里用户'
})

const displayAgeText = computed(() => {
  const age = userInfo.value?.age ||
    userInfo.value?.worker?.age ||
    workerInfo.value?.age ||
    userInfo.value?.employer?.age ||
    employerInfo.value?.age
  if (!age) return '50+'
  const text = String(age).trim()
  return text.endsWith('岁') ? text : `${text}岁`
})

const displayCommunity = computed(() => {
  return activeRoleInfo.value?.community || userInfo.value?.community || '社区待完善'
})

const latestWorkerOrder = computed(() => workerOrders.value[0] || null)
const latestEmployerOrder = computed(() => employerOrders.value[0] || null)

const statusClass = computed(() => {
  const status = workerInfo.value?.status
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  return 'danger'
})

const creditDetails = computed(() => {
  const score = employerInfo.value?.credit_score || 100
  const publishedTasks = employerInfo.value?.published_tasks || 0
  return [
    { id: 'base', title: '账户基础信用', date: '注册后生效', points: 100 },
    { id: 'profile', title: '完善就诊人信息', date: '已计入', points: 10 },
    { id: 'publish', title: '发布陪诊需求', date: `${publishedTasks} 次发布`, points: publishedTasks * 2 },
    { id: 'current', title: '当前信用积分', date: '实时汇总', points: score }
  ]
})

const workerStatCards = computed(() => {
  const completedTasks = workerInfo.value?.completed_tasks || workerInfo.value?.total_orders || 0
  const rating = workerInfo.value?.rating || workerInfo.value?.avg_rating || '0.0'
  const totalEarnings = Number(workerInfo.value?.total_earnings || walletInfo.value?.cash_balance || 0)
  const serviceHours = workerInfo.value?.service_hours || workerInfo.value?.total_hours || 0
  return [
    {
      key: 'completed',
      label: '完成任务',
      value: completedTasks,
      title: '完成任务详情',
      summary: '统计已确认完成的陪诊服务，帮助您了解近期服务稳定度。',
      items: [
        { label: '已完成服务', value: `${completedTasks} 单` },
        { label: '进行中服务', value: `${workerInfo.value?.ongoing_tasks || 0} 单` },
        { label: '累计服务时长', value: `${Number(serviceHours || 0)} 小时` }
      ]
    },
    {
      key: 'rating',
      label: '用户评分',
      value: rating,
      title: '用户评分详情',
      summary: '评分来自就诊人对准时到达、沟通耐心、流程熟悉等维度的综合反馈。',
      items: [
        { label: '准时到达', value: `${rating} 分` },
        { label: '沟通耐心', value: `${rating} 分` },
        { label: '流程熟悉', value: `${rating} 分` }
      ]
    },
    {
      key: 'earnings',
      label: '累计收入',
      value: `¥${formatMoney(totalEarnings)}`,
      title: '累计收入详情',
      summary: '展示已结算服务收入，提现与充值可在我的钱包中继续查看明细。',
      items: [
        { label: '已结算收入', value: `¥${formatMoney(totalEarnings)}` },
        { label: '钱包余额', value: `¥${formatMoney(walletInfo.value?.cash_balance)}` },
        { label: '交易记录', value: `${walletTransactions.value.length} 条` }
      ]
    }
  ]
})

const formatMoney = (value) => {
  const amount = Number(value || 0)
  return amount.toFixed(2)
}

const formatDate = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const orderStatusText = (status) => orderStatusNames[Number(status)] || '状态更新'

const formatOrderService = (order) => {
  if (!order) return '陪诊服务'
  return order.service_name || taskTypes[Number(order.task_type)] || '陪诊服务'
}

const formatTxAmount = (tx) => {
  const amount = Number(tx.amount || 0).toFixed(2)
  if (tx.type === 2) return `-¥${amount}`
  return `+¥${amount}`
}

const fetchWallet = async () => {
  try {
    const res = await request.get('/worker/wallet')
    if (res.code === 0) {
      walletInfo.value = res.data
    }
  } catch (e) {
    console.error('获取钱包信息失败', e)
  }
}

const fetchWalletTransactions = async () => {
  try {
    const res = await request.get('/worker/wallet/transactions')
    if (res.code === 0) {
      walletTransactions.value = res.data || []
    }
  } catch (e) {
    console.error('获取钱包明细失败', e)
  }
}

const refreshWallet = async () => {
  await Promise.all([fetchWallet(), fetchWalletTransactions()])
}

const normalizeOrderList = (res) => {
  if (Array.isArray(res?.data)) return res.data
  return res?.data?.orders || []
}

const fetchProfileOrders = async () => {
  const [workerResult, employerResult] = await Promise.allSettled([
    request.get('/worker/orders'),
    request.get('/employer/orders')
  ])
  if (workerResult.status === 'fulfilled' && workerResult.value?.code === 0) {
    workerOrders.value = normalizeOrderList(workerResult.value)
  }
  if (employerResult.status === 'fulfilled' && employerResult.value?.code === 0) {
    employerOrders.value = normalizeOrderList(employerResult.value)
  }
}

const openWalletDetail = async () => {
  showWalletDetail.value = true
  await fetchWalletTransactions()
}

const openWorkerStatDetail = (stat) => {
  activeWorkerStat.value = stat
  showWorkerStatDetail.value = true
}

const handleRecharge = async () => {
  const amount = Number(rechargeForm.value.amount)
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入正确的充值金额')
    return
  }
  walletActionLoading.value = true
  try {
    const res = await request.post('/worker/wallet/recharge', { amount })
    if (res.code === 0) {
      ElMessage.success('充值成功')
      showRecharge.value = false
      rechargeForm.value.amount = ''
      await refreshWallet()
    }
  } catch (e) {
    ElMessage.error(e.message || '充值失败')
  } finally {
    walletActionLoading.value = false
  }
}

const handleWithdraw = async () => {
  const amount = Number(withdrawForm.value.amount)
  if (!amount || amount <= 0) {
    ElMessage.warning('请输入正确的提现金额')
    return
  }
  walletActionLoading.value = true
  try {
    const res = await request.post('/worker/wallet/withdraw', { amount })
    if (res.code === 0) {
      ElMessage.success('提现申请已提交')
      showWithdraw.value = false
      withdrawForm.value.amount = ''
      await refreshWallet()
    }
  } catch (e) {
    ElMessage.error(e.message || '提现失败')
  } finally {
    walletActionLoading.value = false
  }
}

const openRealnameDialog = () => {
  realnameForm.value = {
    real_name: userInfo.value?.real_name || '',
    id_card: '',
    id_card_front: '',
    id_card_back: ''
  }
  showRealnameDialog.value = true
}

const handleRealnameFileChange = (event, side) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (side === 'front') {
    realnameForm.value.id_card_front = file.name || '身份证正面'
  } else {
    realnameForm.value.id_card_back = file.name || '身份证反面'
  }
  event.target.value = ''
}

const submitRealname = async () => {
  const payload = realnameForm.value
  if (!payload.real_name.trim() || !payload.id_card.trim()) {
    ElMessage.warning('请填写真实姓名和身份证号')
    return
  }
  if (!payload.id_card_front || !payload.id_card_back) {
    ElMessage.warning('请上传身份证正反面')
    return
  }
  realnameLoading.value = true
  try {
    const res = await request.post('/auth/realname', {
      real_name: payload.real_name.trim(),
      id_card: payload.id_card.trim()
    })
    if (res.code === 0) {
      ElMessage.success('实名认证已提交')
      showRealnameDialog.value = false
      await userStore.fetchProfile()
    }
  } catch (e) {
    ElMessage.error(e.message || '实名认证失败')
  } finally {
    realnameLoading.value = false
  }
}

const handleTabKeydown = (event, role) => {
  const tabs = document.querySelectorAll('.role-tab')
  const currentIndex = Array.from(tabs).findIndex(tab => tab === event.target)
  
  if (event.key === 'ArrowLeft' && currentIndex > 0) {
    tabs[currentIndex - 1].focus()
    currentRole.value = 'worker'
  } else if (event.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
    tabs[currentIndex + 1].focus()
    currentRole.value = 'employer'
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchProfile()
    workerInfo.value = userInfo.value?.worker
    employerInfo.value = userInfo.value?.employer
    await Promise.all([refreshWallet(), fetchProfileOrders()])
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: var(--bg-warm);
  padding-bottom: 100px;
}

.profile-header {
}

.avatar-section {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-lg);
}

.avatar-wrapper {
  width: 96px;
  height: 96px;
  margin: 0 auto var(--spacing-md);
  border: 2px solid var(--accent-soft);
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-md);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
}

.role-tabs {
  display: flex;
  box-sizing: content-box;
  padding: 0 var(--spacing-md);
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
  border-color: var(--border-light);
}

.role-tab {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-md);
  border: var(--border-light);
  background: transparent;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  min-height: var(--touch-target-min);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  transition: all 0.3s var(--transition-soft);
  margin-bottom: -2px;
}

.role-tab:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.role-tab.active {
  color: var(--accent);
  background: var(--bg-primary);
  border-color: var(--border-light);
  border-bottom-color: var(--bg-primary);
  font-weight: 600;
}

.profile-content {
  padding: var(--spacing-lg) var(--spacing-md);
}

.login-prompt {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.prompt-text {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg);
}

.login-btn {
  padding: var(--spacing-md) var(--spacing-2xl);
  background: var(--accent) !important;
  color: #FFFFFF !important;
  border: none !important;
  font-size: var(--font-size-lg);
  font-weight: 600;
  min-width: 200px;
  border-radius: var(--border-radius) !important;
}

.login-btn:hover {
  background: var(--accent-hover) !important;
}

.info-section {
  background: var(--bg-primary);
  border: var(--border-light);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  padding: var(--spacing-md) var(--spacing-lg);
  margin: 0;
  border-bottom: var(--border-light);
}

.info-list {
  padding: 0;
  margin: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin: 0;
}

.value {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.value.success {
  color: var(--success);
}

.value.warning {
  color: var(--warning);
}

.value.danger {
  color: var(--danger);
}

.value.highlight {
  color: var(--success);
  font-size: var(--font-size-xl);
}

.wallet-section {
  background: var(--bg-primary);
  border-color: var(--accent-soft);
}

.wallet-section .section-title {
  color: var(--accent);
}

.wallet-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 0 18px 18px;
}

.wallet-btn,
.inline-link-btn {
  border: 1.5px solid #EBD8CF;
  border-radius: 14px;
  background: #fff;
  color: #E94F3D;
  font-weight: 900;
  cursor: pointer;
}

.wallet-btn {
  min-height: 48px;
  font-size: 16px;
}

.wallet-btn.primary {
  background: #E94F3D;
  border-color: #E94F3D;
  color: #fff;
}

.wallet-btn.ghost {
  background: #FFF0EC;
}

.credit-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.inline-link-btn {
  min-height: 34px;
  padding: 0 10px;
  font-size: 13px;
}

.dialog-amount {
  font-size: 18px;
  font-weight: 900;
  color: #E94F3D;
}

.detail-list {
  display: grid;
  gap: 10px;
  max-height: 55vh;
  overflow-y: auto;
}

.detail-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid #EBD8CF;
  border-radius: 14px;
  background: #fffdf8;
}

.detail-row strong,
.detail-row span {
  display: block;
  min-width: 0;
}

.detail-row strong {
  font-size: 16px;
  color: #4F3A32;
  line-height: 1.35;
}

.detail-row span {
  margin-top: 4px;
  font-size: 13px;
  color: #8A6C60;
}

.detail-row em {
  font-style: normal;
  font-size: 17px;
  font-weight: 900;
  white-space: nowrap;
}

.detail-row em.plus {
  color: #B66A25;
}

.detail-row em.minus {
  color: #b45f32;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--spacing-lg);
  gap: var(--spacing-md);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.actions {
  padding: var(--spacing-md) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.action-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  border: var(--border-light) !important;
  font-size: var(--font-size-base);
  font-weight: 500;
  min-height: 56px;
  text-align: center;
  border-radius: var(--border-radius) !important;
  transition: all 0.3s var(--transition-soft);
}

.action-btn:hover {
  background: var(--bg-primary) !important;
  border: var(--border-light) !important;
  color: var(--text-primary) !important;
}

.logout-section {
  padding: var(--spacing-lg) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.admin-link {
  display: block;
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-primary) !important;
  color: var(--accent) !important;
  border: var(--border-light) !important;
  font-size: var(--font-size-base);
  font-weight: 500;
  min-height: 56px;
  border-radius: var(--border-radius) !important;
  transition: all 0.3s var(--transition-soft);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.admin-link:hover {
  background: var(--accent-light) !important;
  border-color: var(--accent) !important;
}

.logout-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-primary) !important;
  color: var(--danger) !important;
  border: var(--border-light) !important;
  font-size: var(--font-size-base);
  font-weight: 500;
  min-height: 56px;
  border-radius: var(--border-radius) !important;
  transition: all 0.3s var(--transition-soft);
}

.logout-btn:hover {
  background: var(--danger-light) !important;
  border-color: var(--danger) !important;
  color: var(--danger) !important;
}

/* 适老化统一风格：我的 */
.profile-container {
  min-height: 100vh;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
  color: #4F3A32;
}

.profile-header {
  margin: 0;
  padding: 18px 16px 22px;
  background: #E94F3D;
  color: #fff;
}

.avatar-section {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "avatar name"
    "avatar meta";
  gap: 6px 14px;
  align-items: center;
  padding: 0;
  text-align: left;
}

.avatar-wrapper {
  grid-area: avatar;
  width: 76px;
  height: 76px;
  margin: 0;
  border: 3px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 10px 24px rgba(23, 35, 49, 0.18);
}

.nickname {
  grid-area: name;
  margin: 0;
  font-size: 25px;
  line-height: 1.2;
  font-weight: 900;
  color: #fff;
}

.profile-meta {
  grid-area: meta;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chip {
  min-width: 0;
  max-width: 100%;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  line-height: 1.2;
  font-weight: 900;
  word-break: break-word;
}

.meta-chip em {
  font-style: normal;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 900;
}

.meta-chip.community {
  border-radius: 12px;
}

.role-tabs {
  margin: -14px 14px 0;
  padding: 6px;
  gap: 6px;
  border: 1px solid #EBD8CF;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(23, 35, 49, 0.08);
}

.role-tab {
  min-height: 48px;
  margin: 0;
  padding: 12px;
  border: none;
  border-radius: 14px !important;
  font-size: 17px;
  font-weight: 900;
  text-align: center;
  color: #7D6257;
}

.role-tab.active {
  background: #FFF0EC;
  color: #E94F3D;
}

.profile-content {
  padding: 16px 14px;
}

.info-section {
  margin-bottom: 14px;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
  overflow: hidden;
}

.section-title {
  padding: 16px 18px;
  border-bottom: 1px solid #F2E6DE;
  font-size: 21px;
  line-height: 1.3;
  font-weight: 900;
  color: #4F3A32;
}

.info-item {
  padding: 16px 18px;
  border-bottom: 1px solid #F2E6DE;
  gap: 14px;
}

.label {
  font-size: 16px;
  font-weight: 800;
  color: #8A6C60;
}

.value {
  font-size: 18px;
  font-weight: 900;
  color: #4F3A32;
  text-align: right;
}

.stats-grid {
  gap: 10px;
  padding: 16px;
}

.stat-item {
  min-height: 86px;
  padding: 12px 8px;
  border-radius: 16px;
  background: #FFF9F2;
  border: 1px solid #EFE2DC;
}

.stat-value {
  font-size: 25px;
  font-weight: 900;
  color: #E94F3D;
}

.stat-label {
  font-size: 14px;
  font-weight: 800;
  color: #8A6C60;
}

.actions,
.logout-section {
  padding: 0 14px 14px;
}

.action-btn,
.admin-link,
.logout-btn,
.login-btn {
  min-height: 58px;
  border-radius: 16px !important;
  font-size: 18px;
  font-weight: 900;
}

.action-btn {
  background: #E94F3D !important;
  color: #fff !important;
  border-color: #E94F3D !important;
}

.profile-entry,
.training-entry {
  width: 100%;
  min-height: 104px;
  margin: 0 0 14px;
  padding: 16px;
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  border: 1px solid #EBD8CF !important;
  border-radius: 20px !important;
  background: #fffdf8 !important;
  color: #4F3A32 !important;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
  text-align: left;
}

.profile-entry:hover,
.training-entry:hover {
  background: #fffdf8 !important;
  border-color: #F2B5A7 !important;
  color: #4F3A32 !important;
}

.profile-entry {
  min-height: 116px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  padding: 18px;
  border-radius: 20px !important;
  background: #fffdf8 !important;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.entry-visual {
  width: 68px;
  height: 68px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #FFF0EC;
}

.entry-visual svg {
  width: 56px;
  height: 56px;
  fill: none;
  stroke: #E94F3D;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.order-entry .entry-visual {
  background: #FFF7E6;
}

.order-entry .entry-visual svg {
  stroke: #B66A25;
}

.entry-copy {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.entry-kicker {
  justify-self: start;
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #E94F3D;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
}

.entry-copy strong {
  color: #4F3A32;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 900;
}

.entry-inline-tag {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #FFF7E6;
  color: #B66A25;
  font-size: 12px;
  line-height: 1.2;
  font-style: normal;
  font-weight: 900;
}

.entry-copy span {
  color: #8A6C60;
  font-size: 15px;
  line-height: 1.45;
  font-weight: 800;
}

.entry-copy > span:not(.entry-kicker) {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-metric {
  min-width: 56px;
  min-height: 58px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 3px;
  padding: 8px 9px;
  border-radius: 14px;
  background: #FFF9F2;
  border: 1px solid #F2E6DE;
}

.entry-metric strong {
  color: #E94F3D;
  font-size: 23px;
  line-height: 1;
  font-weight: 900;
}

.entry-metric span {
  color: #8A6C60;
  font-size: 11px;
  line-height: 1;
  font-weight: 900;
  white-space: nowrap;
}

.entry-copy em {
  display: none;
}

.order-entry .entry-kicker {
  background: #FFF7E6;
  color: #B66A25;
}

.training-kicker {
  background: #FFF7E6;
  color: #B66A25;
}

.order-entry .entry-metric strong {
  color: #B66A25;
}

.training-metric strong {
  color: #B66A25;
}

.entry-arrow {
  width: 18px;
  align-items: center;
  justify-content: center;
  color: #E94F3D;
  font-size: 32px;
  line-height: 1;
  font-weight: 700;
  opacity: 0.55;
}

.training-visual {
  width: 68px;
  height: 68px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #FFF0EC;
}

.training-visual svg {
  width: 58px;
  height: 58px;
  fill: none;
  stroke: #E94F3D;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.training-visual svg path:nth-of-type(2) {
  stroke: #F6A21A;
}

.training-copy {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.training-copy strong {
  font-size: 21px;
  line-height: 1.25;
  font-weight: 900;
  color: #4F3A32;
}

.training-copy span {
  font-size: 15px;
  line-height: 1.45;
  font-weight: 800;
  color: #8A6C60;
}

.training-arrow {
  color: #E94F3D;
  font-size: 36px;
  line-height: 1;
  font-weight: 700;
}

.admin-link {
  background: #fff !important;
  color: #E94F3D !important;
  border-color: #E2B5A8 !important;
}

.logout-btn {
  background: #fff !important;
  color: #b45f32 !important;
  border-color: #ead9ba !important;
}

.login-prompt {
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.prompt-text {
  font-size: 19px;
}

/* 全面精修：我的页面使用更克制的浅色层级 */
.profile-header {
  padding: 18px 16px 16px;
  background:
    linear-gradient(180deg, #FFFCF8 0%, #F6EEE8 100%);
  border-bottom: 1px solid var(--line-soft);
  color: var(--text-primary);
}

.avatar-wrapper {
  border: none;
  background: #fff;
  box-shadow: 0 8px 18px rgba(64, 48, 40, 0.07);
}

.nickname {
  color: var(--text-primary);
  font-size: 23px;
  font-weight: 800;
}

.profile-meta {
  gap: 7px;
}

.meta-chip {
  min-height: 30px;
  padding: 5px 9px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 253, 251, 0.78);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 800;
}

.meta-chip em {
  color: var(--text-muted);
}

.role-tabs {
  margin: 14px 14px 0;
  padding: 4px;
  border-radius: 14px;
  border-color: var(--line-soft);
  box-shadow: none;
}

.role-tab {
  min-height: 44px;
  border-radius: 11px !important;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 800;
}

.role-tab.active {
  background: var(--accent-light);
  color: var(--accent);
}

.profile-content {
  padding: 14px;
}

.profile-entry,
.training-entry,
.info-section,
.login-prompt {
  border-radius: 16px !important;
  border-color: var(--line-soft) !important;
  background: var(--bg-panel) !important;
  box-shadow: 0 8px 22px rgba(64, 48, 40, 0.055);
}

.profile-entry {
  min-height: 96px;
  padding: 16px;
}

.entry-copy {
  gap: 5px;
}

.entry-copy strong {
  font-size: 18px;
  line-height: 1.25;
  font-weight: 800;
}

.entry-copy > span:not(.entry-kicker) {
  font-size: 14px;
  color: var(--text-muted);
}

.entry-metric {
  min-width: 48px;
  min-height: 50px;
  padding: 7px 8px;
  border-radius: 12px;
  background: var(--bg-secondary);
  border-color: var(--line-soft);
}

.entry-metric strong {
  font-size: 20px;
  color: var(--accent);
}

.entry-metric span {
  font-size: 11px;
}

.entry-arrow {
  color: var(--text-muted);
  font-size: 28px;
  opacity: 0.62;
}

.section-title {
  padding: 14px 16px;
  font-size: 18px;
  font-weight: 800;
}

.info-item {
  padding: 14px 16px;
}

.label {
  color: var(--text-muted);
  font-weight: 700;
}

.value {
  color: var(--text-primary);
  font-weight: 800;
}

.stats-grid {
  gap: 8px;
  padding: 14px;
}

.stat-item {
  min-height: 74px;
  border-radius: 12px;
}

.stat-action {
  width: 100%;
  padding: 12px 8px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--bg-secondary) !important;
  border: 1px solid var(--line-soft) !important;
  color: var(--text-primary) !important;
  box-shadow: none !important;
  text-align: center;
}

.stat-action:hover {
  border-color: var(--accent-soft) !important;
  background: var(--accent-light) !important;
  color: var(--accent) !important;
}

.stat-value {
  font-size: 22px;
  color: var(--accent);
}

.stat-detail-dialog {
  display: grid;
  gap: 12px;
}

.stat-detail-hero {
  padding: 16px;
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  background: #FFFCF8;
}

.stat-detail-hero strong {
  display: block;
  color: var(--accent);
  font-size: 30px;
  line-height: 1.1;
  font-weight: 900;
}

.stat-detail-hero span {
  display: block;
  margin-top: 4px;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 900;
}

.stat-detail-hero p {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.45;
  font-weight: 700;
}

.stat-detail-list {
  display: grid;
  gap: 8px;
}

.stat-detail-row {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: var(--bg-secondary);
}

.stat-detail-row span {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 800;
}

.stat-detail-row strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 900;
  text-align: right;
}

.wallet-actions {
  padding: 0 16px 16px;
}

.wallet-btn {
  border-radius: 12px;
  border-color: var(--line);
  color: var(--accent);
}

.verify-entry-btn {
  min-height: 34px !important;
  padding: 6px 10px !important;
  border-radius: 999px !important;
  font-size: 13px !important;
  font-weight: 900 !important;
  white-space: nowrap;
}

.verify-entry-btn.success {
  background: var(--accent-light) !important;
  border-color: rgba(217, 74, 55, 0.18) !important;
  color: var(--accent) !important;
}

.verify-entry-btn.warning {
  background: #FBF0DA !important;
  border-color: #EDDFC3 !important;
  color: #805A25 !important;
}

.realname-dialog {
  display: grid;
  gap: 12px;
}

.realname-field {
  display: grid;
  gap: 7px;
  margin: 0;
}

.realname-field span {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 900;
}

.realname-field input {
  width: 100%;
  min-height: 52px;
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

.hidden-file-input {
  display: none;
}

.realname-upload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.realname-upload-card {
  min-height: 120px;
  padding: 14px 12px !important;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--line) !important;
  border-radius: 16px !important;
  background: #FFFCF8 !important;
  color: var(--text-primary) !important;
  text-align: left;
}

.realname-upload-card span {
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 12px;
  font-weight: 900;
}

.realname-upload-card strong {
  font-size: 15px;
  line-height: 1.25;
}

.realname-upload-card em {
  max-width: 100%;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.35;
  font-style: normal;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-progress-section .section-title {
  border-bottom: 1px solid var(--line-soft);
}

.order-progress-card {
  width: 100%;
  padding: 15px 16px !important;
  display: grid;
  gap: 8px;
  border: none !important;
  background: transparent !important;
  color: var(--text-primary) !important;
  text-align: left;
  box-shadow: none !important;
}

.order-progress-status {
  justify-self: start;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 13px;
  line-height: 1;
  font-weight: 900;
}

.order-progress-card strong {
  color: var(--text-primary);
  font-size: 18px;
  line-height: 1.3;
  font-weight: 900;
}

.order-progress-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.45;
  font-weight: 800;
}

.order-progress-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--line-soft);
}

.order-progress-foot span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 800;
}

.order-progress-foot em {
  color: var(--accent);
  font-size: 16px;
  line-height: 1;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

@media (max-width: 380px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .value {
    text-align: left;
  }

  .profile-entry {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;
    padding: 14px;
  }

  .training-entry {
    grid-template-columns: 58px minmax(0, 1fr) auto;
    gap: 10px;
    padding: 14px;
  }

  .profile-entry.training-entry {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .training-visual {
    width: 58px;
    height: 58px;
  }

  .entry-metric {
    min-width: 50px;
    min-height: 54px;
    padding: 7px;
  }

  .entry-metric strong {
    font-size: 21px;
  }

  .entry-copy strong,
  .training-copy strong {
    font-size: 19px;
  }
}
</style>
