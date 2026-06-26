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
      <div class="publish-heading">
        <h2 class="publish-title">选择发布类型</h2>
        <p class="publish-subtitle">按当前身份进入对应流程</p>
      </div>
      <div class="publish-options">
        <button type="button" class="publish-option" @click="goToPublishTask">
          <span class="publish-option-person publish-option-person--patient" aria-hidden="true">
            <span class="person-face">
              <span class="person-hair"></span>
              <span class="person-eye person-eye-left"></span>
              <span class="person-eye person-eye-right"></span>
              <span class="person-smile"></span>
            </span>
            <span class="person-body"></span>
          </span>
          <span class="publish-option-label">我是就诊人</span>
        </button>
        <button type="button" class="publish-option" @click="goToApplyWorker">
          <span class="publish-option-person publish-option-person--worker" aria-hidden="true">
            <span class="person-face">
              <span class="person-hair"></span>
              <span class="person-eye person-eye-left"></span>
              <span class="person-eye person-eye-right"></span>
              <span class="person-smile"></span>
            </span>
            <span class="person-body"></span>
            <span class="person-badge"></span>
          </span>
          <span class="publish-option-label">我是陪诊师</span>
        </button>
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

  if (tab.name === 'workers' && route.query.service) {
    router.push({
      path: tab.path,
      query: {
        service: route.query.service
      }
    })
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
  border-top: 1.5px solid var(--border-light);
  box-shadow: 0 -4px 14px rgba(30, 42, 58, 0.08);
  z-index: 1000;
  padding: 6px 0 env(safe-area-inset-bottom, 8px);
  height: var(--global-tab-bar-height);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  color: var(--text-muted);
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.tab-item:active {
  transform: scale(0.98);
}

.tab-item:focus-visible {
  outline: 3px solid var(--accent-light);
  outline-offset: -3px;
  border-radius: var(--border-radius-sm);
}

.tab-item.active {
  color: var(--accent);
  font-weight: 800;
}

.tab-item.active::before {
  display: none;
}

.tab-icon {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
}

/* 发布弹窗 */
.publish-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(233, 79, 61, 0.22);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 2000;
  padding: 14px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.publish-dialog {
  background: #fffdf8;
  border: 1px solid #EBD8CF;
  border-radius: 22px 22px 0 0;
  padding: 22px 16px calc(18px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.35s var(--transition-smooth);
  box-shadow: 0 -16px 38px rgba(23, 35, 49, 0.18);
}

.publish-heading {
  margin: 0 0 16px;
  text-align: center;
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.publish-title {
  text-align: center;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 900;
  margin: 0;
  color: #4F3A32;
}

.publish-subtitle {
  margin: 6px 0 0;
  color: #8A6C60;
  font-size: 14px;
  line-height: 1.35;
  font-weight: 800;
}

.publish-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.publish-option {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  justify-items: center;
  gap: 8px;
  padding: 16px 10px 14px !important;
  background: #fff !important;
  border-radius: 18px !important;
  cursor: pointer;
  transition: background 0.2s var(--transition-soft), border-color 0.2s var(--transition-soft), box-shadow 0.2s var(--transition-soft), transform 0.2s var(--transition-soft);
  border: 1.5px solid #EBD8CF !important;
  box-shadow: 0 10px 22px rgba(23, 35, 49, 0.06);
  text-align: center;
  min-height: 164px;
}

.publish-option:hover {
  border-color: #E2B5A8 !important;
  background: #FFF9F2 !important;
  color: #4F3A32 !important;
  box-shadow: 0 12px 24px rgba(23, 35, 49, 0.08);
  transform: translateY(-1px);
}

.publish-option:active {
  transform: translateY(0);
  background: #FFF0EC !important;
  border-color: #E94F3D !important;
}

.publish-option:focus-visible {
  outline: 3px solid rgba(233, 79, 61, 0.18);
  outline-offset: 2px;
}

.publish-option-person {
  width: 72px;
  height: 72px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 24px;
  overflow: visible;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    0 12px 24px rgba(79, 58, 50, 0.12);
}

.publish-option-person--patient {
  color: #8E4B34;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.96) 0 12%, transparent 13%),
    linear-gradient(145deg, #FFF3D8 0%, #FFDDA6 100%);
}

.publish-option-person--worker {
  color: #E94F3D;
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.92) 0 12%, transparent 13%),
    linear-gradient(145deg, #FFF0EC 0%, #FFD8D0 100%);
}

.person-face {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 28px;
  height: 28px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: #FFE3C7;
  border: none;
  box-shadow: inset 0 -2px 0 rgba(79, 58, 50, 0.08);
}

.person-hair {
  display: block;
  position: absolute;
  left: 3px;
  top: -3px;
  width: 22px;
  height: 12px;
  border-radius: 14px 14px 8px 8px;
  background: #6D5146;
}

.person-eye {
  display: block;
  position: absolute;
  top: 13px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #4F3A32;
}

.person-eye-left { left: 8px; }
.person-eye-right { right: 8px; }

.person-smile {
  display: block;
  position: absolute;
  left: 50%;
  top: 18px;
  width: 10px;
  height: 5px;
  border-bottom: 2px solid rgba(79, 58, 50, 0.72);
  border-radius: 0 0 999px 999px;
  transform: translateX(-50%);
}

.person-body {
  position: absolute;
  left: 50%;
  bottom: 9px;
  width: 46px;
  height: 27px;
  transform: translateX(-50%);
  border: none;
  border-radius: 22px 22px 14px 14px;
  background: currentColor;
  opacity: 0.92;
}

.publish-option-person--patient .person-body {
  background: linear-gradient(135deg, #F6A21A 0%, #E94F3D 100%);
}

.publish-option-person--worker .person-body {
  background: linear-gradient(135deg, #E94F3D 0%, #C94131 100%);
}

.person-badge {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 18px;
  height: 18px;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(79, 58, 50, 0.12);
}

.person-badge::before,
.person-badge::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 999px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.person-badge::before {
  width: 10px;
  height: 2px;
}

.person-badge::after {
  width: 2px;
  height: 10px;
}

.publish-option-label {
  font-size: 20px;
  line-height: 1.28;
  font-weight: 900;
  color: #4F3A32;
}

.publish-option-desc {
  margin-top: 0;
  font-size: 15px;
  color: #7D6257;
  line-height: 1.5;
  font-weight: 800;
}

.publish-cancel {
  width: 100%;
  padding: 14px;
  margin-top: 14px;
  font-size: 18px;
  font-weight: 900;
  background: #E94F3D !important;
  color: #fff !important;
  border: 1.5px solid #E94F3D !important;
  border-radius: 16px !important;
  cursor: pointer;
  transition: all 0.2s var(--transition-soft);
  min-height: 56px;
}

.publish-cancel:hover {
  background: #C94131 !important;
  color: #fff !important;
  border-color: #C94131 !important;
}

.publish-cancel:active {
  transform: scale(0.99);
}

.publish-cancel:focus-visible {
  outline: 3px solid rgba(233, 79, 61, 0.18);
  outline-offset: 2px;
}

@media (min-width: 420px) {
  .publish-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 340px) {
  .publish-options {
    grid-template-columns: 1fr;
  }

  .publish-option {
    min-height: 118px;
    grid-template-columns: 58px minmax(0, 1fr);
    justify-items: start;
    text-align: left;
    padding: 14px !important;
  }

  .publish-option-person {
    grid-row: span 2;
    width: 58px;
    height: 58px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .publish-dialog { animation: none; }
}
</style>
