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
      <span class="tab-icon" aria-hidden="true" v-html="icons[tab.iconKey]"></span>
      <span class="tab-label">{{ tab.label }}</span>
    </span>
  </nav>

  <div
    v-if="showPublishDialog"
    class="publish-overlay"
    @click.self="showPublishDialog = false"
  >
    <div class="publish-dialog">
      <h2 class="publish-title">选择发布类型</h2>
      <div class="publish-options">
        <div class="publish-option" @click="goToPublishTask">
          <span class="publish-option-icon">📋</span>
          <span class="publish-option-label">发布任务</span>
          <span class="publish-option-desc">我是就诊人，需要找人帮忙</span>
        </div>
        <div class="publish-option" @click="goToApplyWorker">
          <span class="publish-option-icon">👤</span>
          <span class="publish-option-label">我是陪诊师</span>
          <span class="publish-option-desc">我能提供陪诊服务</span>
        </div>
      </div>
      <button class="publish-cancel" @click="showPublishDialog = false">取消</button>
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

const icons = {
  find: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  workers: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  messages: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  publish: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>`,
  profile: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
}

const tabItems = [
  { name: 'find', label: '任务大厅', iconKey: 'find', path: '/' },
  { name: 'workers', label: '陪诊师', iconKey: 'workers', path: '/employer/workers' },
  { name: 'messages', label: '消息', iconKey: 'messages', path: '/common/messages', requiresAuth: true },
  { name: 'publish', label: '发布', iconKey: 'publish', path: '/employer/publish', requiresAuth: true, isPublish: true },
  { name: 'profile', label: '我的', iconKey: 'profile', path: '/profile', requiresAuth: false }
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
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -1px 8px rgba(30, 42, 58, 0.04);
  z-index: 1000;
  padding: 4px 0 env(safe-area-inset-bottom, 8px);
  height: var(--global-tab-bar-height);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  color: var(--text-muted);
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.tab-item:active {
  transform: scale(0.95);
}

.tab-item:focus-visible {
  outline: 3px solid var(--accent-light);
  outline-offset: -3px;
  border-radius: var(--border-radius-sm);
}

.tab-item.active {
  color: var(--accent);
}

.tab-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

/* 发布弹窗 */
.publish-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 42, 58, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  padding: var(--spacing-md);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.publish-dialog {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  padding: var(--spacing-xl) var(--spacing-lg) calc(var(--spacing-lg) + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.35s var(--transition-smooth);
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.publish-title {
  text-align: center;
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-lg);
  color: var(--text-primary);
}

.publish-options {
  display: flex;
  gap: var(--spacing-md);
}

.publish-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  border: 1.5px solid transparent;
}

.publish-option:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.publish-option-icon {
  font-size: 28px;
}

.publish-option-label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.publish-option-desc {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  text-align: center;
  line-height: 1.3;
}

.publish-cancel {
  width: 100%;
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  background: #2c7a9e !important;
  color: #FFFFFF !important;
  border: 1.5px solid #2c7a9e !important;
  border-radius: var(--border-radius) !important;
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  min-height: var(--touch-target-min);
}

.publish-cancel:hover {
  background: #256a8a !important;
  color: #FFFFFF !important;
  border-color: #256a8a !important;
}

@media (prefers-reduced-motion: reduce) {
  .publish-dialog { animation: none; }
}
</style>
