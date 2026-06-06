<template>
  <nav class="global-tab-bar" role="navigation" aria-label="主导航">
    <span
      v-for="tab in tabItems"
      :key="tab.name"
      role="tab"
      :aria-selected="isActive(tab)"
      :aria-label="tab.label"
      :class="['tab-item', { active: isActive(tab) }]"
      @click="handleTabClick(tab)"
    >
      <span class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
    </span>
  </nav>

  <div
    v-if="showPublishDialog"
    class="publish-dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="publish-dialog-title"
    @click.self="showPublishDialog = false"
  >
    <div class="publish-dialog">
      <h2 id="publish-dialog-title" class="dialog-title">请选择发布类型</h2>
      <div class="dialog-options">
        <button
          class="dialog-option"
          @click="goToPublishTask"
        >
          <span class="option-icon">📋</span>
          <span class="option-label">发布任务</span>
          <span class="option-desc">我是就诊人，需要找人帮忙</span>
        </button>
        <button
          class="dialog-option"
          @click="goToApplyWorker"
        >
          <span class="option-icon">👤</span>
          <span class="option-label">我是陪诊师</span>
          <span class="option-desc">我能提供陪诊服务，赚取报酬</span>
        </button>
      </div>
      <button class="dialog-close" @click="showPublishDialog = false">取消</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const showPublishDialog = ref(false)

const tabItems = [
  { name: 'find', label: '任务大厅', icon: '◇', path: '/' },
  { name: 'workers', label: '陪诊师', icon: '⬡', path: '/employer/workers' },
  { name: 'messages', label: '消息', icon: '💬', path: '/common/messages', requiresAuth: true },
  { name: 'publish', label: '发布', icon: '＋', path: '/employer/publish', requiresAuth: true, isPublish: true },
  { name: 'profile', label: '我的', icon: '○', path: '/profile', requiresAuth: false }
]

const isActive = (tab) => {
  if (tab.path === '/') {
    return route.path === '/' || route.path.startsWith('/task')
  }
  if (tab.name === 'messages') {
    return route.path.startsWith('/common/messages') || route.path.startsWith('/common/chat')
  }
  return route.path.startsWith(tab.path)
}

const handleTabClick = (tab) => {
  if (tab.requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (tab.isPublish) {
    showPublishDialog.value = true
    return
  }

  router.push(tab.path)
}

const goToPublishTask = () => {
  showPublishDialog.value = false
  router.push('/employer/publish')
}

const goToApplyWorker = () => {
  showPublishDialog.value = false
  router.push('/worker/apply')
}
</script>

<style scoped>
.global-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--bg-primary);
  border-top: var(--border-light);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);
  z-index: 1000;
  padding:0 0 1rem 0;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-xs);
  min-height: 64px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s var(--transition-soft);
  color: var(--text-muted);
  position: relative;
}

.tab-item:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: -3px;
}

.tab-item.active {
  color: var(--accent);
}

.tab-item.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: var(--accent);
  border-radius: 0 0 3px 3px;
}

.tab-icon {
  font-size: var(--font-size-xl);
  margin-bottom: 2px;
  line-height: 1;
}

.tab-label {
  font-size: var(--font-size-base);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.publish-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 45, 45, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-md);
  backdrop-filter: blur(2px);
}

.publish-dialog {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 500px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.06);
  animation: slideUp 0.4s var(--transition-smooth);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-title {
  font-size: var(--font-size-lg);
  text-align: center;
  margin: 0 0 var(--spacing-lg);
  color: var(--text-primary);
  font-weight: 600;
}

.dialog-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.dialog-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s var(--transition-soft);
  min-height: 100px;
}

.dialog-option:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.dialog-option:hover {
  background: var(--accent-light);
  border-color: var(--accent-soft);
}

.option-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.option-label {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.option-desc {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.dialog-close {
  width: 100%;
  padding: var(--spacing-md);
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--bg-primary);
  color: var(--text-muted);
  border: var(--border-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s var(--transition-soft);
  min-height: var(--touch-target-min);
}

.dialog-close:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.dialog-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

@media (prefers-reduced-motion: reduce) {
  .publish-dialog {
    animation: none;
  }
}
</style>
