<template>
  <div class="profile-container">
    <header class="profile-header">
      <div class="avatar-section">
        <div class="avatar-wrapper" role="img" :aria-label="isLoggedIn ? '用户头像' : '默认头像'">
          <img :src="avatarUrl" class="avatar" alt="" />
        </div>
        <p class="nickname" role="heading" aria-level="2">
          {{ isLoggedIn ? userInfo?.nickname : '游客' }}
        </p>
        <p class="phone">{{ isLoggedIn ? userInfo?.phone : '登录后查看更多信息' }}</p>
      </div>
    </header>

    <nav class="role-tabs" role="tablist" aria-label="角色选择">
      <button
        role="tab"
        :aria-selected="currentRole === 'worker'"
        :class="['role-tab', { active: currentRole === 'worker' }]"
        @click="currentRole = 'worker'"
        @keydown="handleTabKeydown($event, 'worker')"
      >
        服务者
      </button>
      <button
        role="tab"
        :aria-selected="currentRole === 'employer'"
        :class="['role-tab', { active: currentRole === 'employer' }]"
        @click="currentRole = 'employer'"
        @keydown="handleTabKeydown($event, 'employer')"
      >
        用工方
      </button>
    </nav>

    <main class="profile-content" role="tabpanel">
      <div v-if="!isLoggedIn" class="login-prompt">
        <p class="prompt-text">登录后可查看完整信息</p>
        <button class="login-btn" @click="$router.push('/login')">立即登录</button>
      </div>

      <div v-else-if="currentRole === 'worker'" class="role-content worker-content">
        <section class="info-section" aria-labelledby="worker-basic-title">
          <h3 id="worker-basic-title" class="section-title">基本信息</h3>
          <dl class="info-list">
            <div class="info-item">
              <dt class="label">真实姓名</dt>
              <dd class="value">{{ userInfo?.real_name || '未填写' }}</dd>
            </div>
            <div class="info-item">
              <dt class="label">实名认证</dt>
              <dd class="value" :class="userInfo?.face_verified ? 'success' : 'warning'">
                {{ userInfo?.face_verified ? '已认证' : '未认证' }}
              </dd>
            </div>
            <div class="info-item">
              <dt class="label">服务者状态</dt>
              <dd class="value" :class="statusClass">
                {{ statusNames[workerInfo?.status] || '未申请' }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="info-section" aria-labelledby="worker-stats-title">
          <h3 id="worker-stats-title" class="section-title">服务统计</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ workerInfo?.completed_tasks || 0 }}</span>
              <span class="stat-label">完成任务</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ workerInfo?.rating || '0.0' }}</span>
              <span class="stat-label">用户评分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">¥{{ workerInfo?.total_earnings || 0 }}</span>
              <span class="stat-label">累计收入</span>
            </div>
          </div>
        </section>

        <section class="info-section wallet-section" aria-labelledby="wallet-title">
          <h3 id="wallet-title" class="section-title">我的钱包</h3>
          <dl class="info-list">
            <div class="info-item">
              <dt class="label">现金余额</dt>
              <dd class="value highlight">¥{{ walletInfo?.cash_balance || '0.00' }}</dd>
            </div>
            <div class="info-item">
              <dt class="label">积分余额</dt>
              <dd class="value">{{ walletInfo?.points_balance || 0 }}</dd>
            </div>
          </dl>
        </section>

        <div class="actions">
          <button class="action-btn" @click="$router.push('/worker/my-tasks')">我的任务</button>
        </div>
      </div>

      <div v-else class="role-content employer-content">
        <section class="info-section" aria-labelledby="employer-basic-title">
          <h3 id="employer-basic-title" class="section-title">账户信息</h3>
          <dl class="info-list">
            <div class="info-item">
              <dt class="label">信用积分</dt>
              <dd class="value">{{ employerInfo?.credit_score || 100 }}</dd>
            </div>
            <div class="info-item">
              <dt class="label">我的角色</dt>
              <dd class="value">用工方</dd>
            </div>
            <div class="info-item">
              <dt class="label">发布任务</dt>
              <dd class="value">{{ employerInfo?.published_tasks || 0 }}</dd>
            </div>
          </dl>
        </section>

        <div class="actions">
          <button class="action-btn" @click="$router.push('/employer/orders')">我的订单</button>
        </div>
      </div>
    </main>

    <footer v-if="isLoggedIn" class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()

const currentRole = ref('worker')
const workerInfo = ref(null)
const employerInfo = ref(null)
const walletInfo = ref(null)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo)
const avatarUrl = computed(() => {
  if (userInfo.value?.avatar_url) return userInfo.value.avatar_url
  return '/default-avatar.png'
})

const statusNames = { 0: '审核中', 1: '已认证', 2: '已驳回' }
const statusClass = computed(() => {
  const status = workerInfo.value?.status
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  return 'danger'
})

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
    try {
      const res = await request.get('/worker/wallet')
      if (res.code === 0) {
        walletInfo.value = res.data
      }
    } catch (e) {
      console.error('获取钱包信息失败', e)
    }
  }
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding-bottom: 100px;
}

.profile-header {
  background: var(--bg-primary);
  border-bottom: var(--border);
}

.avatar-section {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-lg);
}

.avatar-wrapper {
  width: 96px;
  height: 96px;
  margin: 0 auto var(--spacing-md);
  border: 3px solid var(--text-primary);
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
  letter-spacing: 0;
}

.phone {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

.role-tabs {
  display: flex;
  background: var(--bg-primary);
  border-bottom: var(--border);
}

.role-tab {
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-md);
  border: none;
  background: transparent;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  min-height: var(--touch-target-min);
}

.role-tab:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.role-tab.active {
  color: var(--text-primary);
}

.role-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent);
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
  color: var(--bg-primary) !important;
  border: 3px solid var(--accent) !important;
  font-size: var(--font-size-lg);
  font-weight: 700;
  min-width: 200px;
}

.login-btn:hover {
  background: var(--accent-hover) !important;
  border-color: var(--accent-hover) !important;
}

.info-section {
  background: var(--bg-primary);
  border: var(--border);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
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
  color: var(--text-secondary);
  margin: 0;
}

.value {
  font-size: var(--font-size-base);
  font-weight: 700;
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
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--success-light) 100%);
}

.wallet-section .section-title {
  color: var(--success);
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
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.actions {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.action-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-primary) !important;
  color: var(--text-primary) !important;
  border: var(--border) !important;
  font-size: var(--font-size-lg);
  font-weight: 600;
  min-height: 56px;
  text-align: center;
}

.action-btn.primary {
  background: var(--accent) !important;
  color: var(--bg-primary) !important;
  border-color: var(--accent) !important;
}

.action-btn:active {
  transform: scale(0.98);
}

.logout-section {
  padding: var(--spacing-lg) var(--spacing-md);
}

.logout-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-primary) !important;
  color: var(--danger) !important;
  border: 2px solid var(--danger) !important;
  font-size: var(--font-size-lg);
  font-weight: 700;
  min-height: 56px;
}

.logout-btn:hover {
  background: var(--danger) !important;
  color: var(--bg-primary) !important;
}
</style>
