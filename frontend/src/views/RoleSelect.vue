<template>
  <div class="role-container">
    <header class="role-header">
      <h2>选择身份</h2>
      <p>您想以什么身份使用邻里服务？</p>
    </header>

    <main class="role-grid" role="radiogroup" aria-label="选择身份">
      <div
        class="role-card"
        role="radio"
        :aria-checked="selectedRole === 1"
        @click="selectedRole = 1"
        @keydown.enter="selectedRole = 1"
        @keydown.space.prevent="selectedRole = 1"
        :class="{ active: selectedRole === 1 }"
        tabindex="0"
      >
        <div class="role-icon" aria-hidden="true">01</div>
        <div class="role-content">
          <h3>陪诊师</h3>
          <p>50-65岁老年人，为社区提供陪诊、陪聊、保洁等服务</p>
        </div>
        <div class="role-check" v-if="selectedRole === 1" aria-hidden="true">✓</div>
      </div>

      <div
        class="role-card"
        role="radio"
        :aria-checked="selectedRole === 2"
        @click="selectedRole = 2"
        @keydown.enter="selectedRole = 2"
        @keydown.space.prevent="selectedRole = 2"
        :class="{ active: selectedRole === 2 }"
        tabindex="0"
      >
        <div class="role-icon" aria-hidden="true">02</div>
        <div class="role-content">
          <h3>就诊人</h3>
          <p>需要养老服务的用户，发布任务邀请陪诊师</p>
        </div>
        <div class="role-check" v-if="selectedRole === 2" aria-hidden="true">✓</div>
      </div>
    </main>

    <div class="role-actions">
      <button class="confirm-btn" @click="confirmRole" :disabled="loading" aria-busy="loading">
        {{ loading ? '确认中，请稍候...' : '确认身份' }}
      </button>
      <button class="logout-btn" @click="handleLogout">
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const selectedRole = ref(1)
const loading = ref(false)

onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.userInfo?.role) {
    selectedRole.value = userStore.userInfo.role
  }
})

const confirmRole = async () => {
  loading.value = true
  try {
    if (userStore.role !== selectedRole.value) {
      const res = await userStore.switchRole(selectedRole.value)
      if (res.code !== 0) {
        ElMessage.error(res.message || '切换失败')
        loading.value = false
        return
      }
    }

    const roleRoutes = { 1: '/worker/dashboard', 2: '/employer/dashboard' }
    router.push(roleRoutes[selectedRole.value])
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.role-container {
  min-height: 100vh;
  padding: var(--spacing-xl) var(--spacing-lg);
  background: var(--bg-primary);
}

.role-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.role-header h2 {
  font-size: var(--font-size-3xl);
  font-weight: 900;
  letter-spacing: -0.03em;
  margin-bottom: var(--spacing-sm);
}

.role-header p {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin: 0;
}

.role-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 500px;
  margin: 0 auto var(--spacing-2xl);
}

.role-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  border: var(--border);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-height: 100px;
}

.role-card:hover {
  border-color: var(--accent);
}

.role-card:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.role-card.active {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--bg-primary);
}

.role-icon {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: inherit;
  opacity: 0.3;
}

.role-content {
  flex: 1;
}

.role-content h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin: 0 0 var(--spacing-xs);
  color: inherit;
}

.role-content p {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.role-card.active .role-content p {
  color: rgba(255, 255, 255, 0.85);
}

.role-check {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 28px;
  height: 28px;
  background: var(--text-primary);
  color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  font-weight: 700;
}

.role-card.active .role-check {
  background: var(--bg-primary);
  color: var(--accent);
}

.role-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 500px;
  margin: 0 auto;
}

.confirm-btn {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--text-primary);
  color: var(--bg-primary);
  border: var(--border) !important;
  cursor: pointer;
  transition: all 0.2s;
  min-height: var(--touch-target-min);
}

.confirm-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent) !important;
}

.confirm-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-btn {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--bg-primary);
  color: var(--danger);
  border: 2px solid var(--danger) !important;
  cursor: pointer;
  transition: all 0.2s;
  min-height: var(--touch-target-min);
}

.logout-btn:hover {
  background: var(--danger);
  color: var(--bg-primary);
}

.logout-btn:focus-visible {
  outline: 3px solid var(--danger);
  outline-offset: 2px;
}
</style>
