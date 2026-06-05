<template>
  <div class="worker-square">
    <header class="page-header">
      <h1>陪诊师广场</h1>
      <p class="subtitle">找到身边的可靠陪诊师</p>
    </header>

    <div class="filter-bar" role="search">
      <label for="worker-search" class="sr-only">搜索陪诊师</label>
      <input
        id="worker-search"
        v-model="searchKeyword"
        placeholder="搜索社区或服务类型"
        class="search-input"
        type="search"
        @search="fetchWorkers"
      />
    </div>

    <main class="worker-list" role="list" aria-label="陪诊师列表">
      <article
        v-for="worker in workers"
        :key="worker.id"
        class="worker-card"
        role="listitem"
      >
        <div class="worker-header">
          <div class="avatar-wrapper">
            <img
              v-if="worker.avatar_url"
              :src="worker.avatar_url"
              :alt="worker.nickname + '的头像'"
              class="avatar"
              @error="handleAvatarError($event, worker.nickname)"
            />
            <div v-else class="avatar-placeholder" :aria-label="worker.nickname + '的头像占位符'">
              {{ worker.nickname.charAt(0) }}
            </div>
          </div>
          <div class="info">
            <h2 class="worker-name">{{ worker.nickname }}</h2>
            <p class="worker-location">{{ worker.community }}</p>
          </div>
          <div class="rating" aria-label="评分">
            <span class="score">{{ worker.avg_rating }}</span>
            <span class="label">评分</span>
          </div>
        </div>

        <div class="worker-tags" aria-label="技能标签">
          <span
            v-for="skill in JSON.parse(worker.skills || '[]')"
            :key="skill"
            class="skill-tag"
          >
            {{ skill }}
          </span>
        </div>

        <div class="worker-stats">
          <div class="stat-item">
            <span class="stat-value">{{ worker.total_orders }}</span>
            <span class="stat-label">订单</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ worker.total_hours }}</span>
            <span class="stat-label">服务时长</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">Lv.{{ worker.honor_level }}</span>
            <span class="stat-label">等级</span>
          </div>
        </div>

        <div class="worker-actions">
          <button
            class="action-btn primary"
            @click="handleInvite(worker)"
          >
            邀请服务
          </button>
          <button
            class="action-btn"
            @click="$router.push(`/common/chat/${worker.user_id}`)"
          >
            咨询
          </button>
        </div>
      </article>
    </main>

    <div v-if="loading" class="loading" aria-live="polite">
      <span>加载中，请稍候...</span>
    </div>

    <div v-if="!loading && workers.length === 0" class="empty" role="status">
      <span class="empty-icon" aria-hidden="true">—</span>
      <p>暂无陪诊师</p>
      <p class="tip">试试扩大搜索范围</p>
    </div>

    <div
      v-if="showInviteDialog"
      class="invite-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
    >
      <div class="dialog-content">
        <h2 id="invite-title" class="dialog-title">邀请服务</h2>
        <p class="dialog-text">
          确定邀请 <strong>{{ selectedWorker?.nickname }}</strong> 为您服务吗？
        </p>
        <p class="dialog-tips">请先发布任务，然后从任务列表中邀请该陪诊师</p>
        <div class="dialog-actions">
          <button class="dialog-btn" @click="showInviteDialog = false">取消</button>
          <button class="dialog-btn primary" @click="goToPublish">去发单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'

const router = useRouter()

const workers = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const showInviteDialog = ref(false)
const selectedWorker = ref(null)

const handleAvatarError = (event, nickname) => {
  const img = event.target
  const wrapper = img.parentElement
  img.style.display = 'none'
  const placeholder = document.createElement('div')
  placeholder.className = 'avatar-placeholder'
  placeholder.setAttribute('aria-label', nickname + '的头像占位符')
  placeholder.textContent = nickname.charAt(0)
  wrapper.appendChild(placeholder)
}

const fetchWorkers = async () => {
  loading.value = true
  try {
    const res = await request.get('/employer/workers', { skills: searchKeyword.value })
    if (res.code === 0) {
      workers.value = res.data.workers || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleInvite = (worker) => {
  selectedWorker.value = worker
  showInviteDialog.value = true
}

const goToPublish = () => {
  showInviteDialog.value = false
  router.push('/employer/publish')
}

onMounted(() => {
  fetchWorkers()
})
</script>

<style scoped>
.worker-square {
  padding: var(--spacing-md);
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
  background: var(--bg-warm);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  padding-top: var(--spacing-md);
}

.page-header h1 {
  font-size: var(--font-size-2xl);
  margin: 0 0 var(--spacing-xs);
  font-weight: 600;
  color: var(--text-primary);
}

.subtitle {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin: 0;
}

.filter-bar {
  margin-bottom: var(--spacing-lg);
}

.search-input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  border: var(--border-light);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  min-height: var(--touch-target-min);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--transition-soft);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.worker-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.worker-card {
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s var(--transition-soft);
}

.worker-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.avatar-wrapper {
  width: 56px;
  height: 56px;
  margin-right: var(--spacing-md);
  border: 2px solid var(--accent-soft);
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 20px;
  font-weight: 600;
}

.info {
  flex: 1;
}

.worker-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-xs);
  color: var(--text-primary);
}

.worker-location {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

.rating {
  text-align: center;
  padding: var(--spacing-sm);
}

.rating .score {
  display: block;
  font-size: var(--font-size-xl);
  color: var(--warning);
  font-weight: 700;
}

.rating .label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.worker-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.skill-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  background: var(--accent-light);
  color: var(--accent);
  border-radius: var(--border-radius-sm);
  font-weight: 500;
}

.worker-stats {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.worker-actions {
  display: flex;
  gap: var(--spacing-md);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s var(--transition-soft);
  min-height: var(--touch-target-min);
}

.action-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.action-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--accent);
  color: var(--accent);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

.empty {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 48px;
  color: var(--text-muted);
  display: block;
  margin-bottom: var(--spacing-md);
}

.empty p {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-xs);
}

.tip {
  font-size: var(--font-size-base);
  color: var(--text-muted);
}

.invite-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45, 45, 45, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-md);
  backdrop-filter: blur(2px);
}

.dialog-content {
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
}

.dialog-title {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--spacing-lg);
  text-align: center;
  font-weight: 600;
}

.dialog-text {
  font-size: var(--font-size-base);
  text-align: center;
  margin: 0 0 var(--spacing-sm);
}

.dialog-tips {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 var(--spacing-xl);
}

.dialog-actions {
  display: flex;
  gap: var(--spacing-md);
}

.dialog-btn {
  flex: 1;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s var(--transition-soft);
  min-height: var(--touch-target-min);
}

.dialog-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.dialog-btn:hover {
  background: var(--bg-secondary);
}

.dialog-btn.primary {
  background: var(--accent) !important;
  color: #FFFFFF !important;
  border-color: var(--accent) !important;
}

.dialog-btn.primary:hover {
  background: var(--accent-hover) !important;
}

.dialog-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
