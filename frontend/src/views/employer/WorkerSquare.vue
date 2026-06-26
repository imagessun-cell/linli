<template>
  <div class="worker-square">
    <div class="filter-bar" role="search">
      <label for="worker-search" class="sr-only">搜索陪诊师</label>
      <input
        id="worker-search"
        v-model="searchKeyword"
        placeholder="搜索社区、陪诊技能或昵称"
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
            <LinliAvatar :name="worker.nickname" :src="worker.avatar_url" variant="worker" :size="64" />
          </div>
          <div class="info">
            <h2 class="worker-name">{{ worker.nickname }}</h2>
            <p class="worker-location">{{ worker.community || '社区待完善' }}</p>
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
            <span class="stat-label">完成订单</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ worker.total_hours }}</span>
            <span class="stat-label">服务小时</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">Lv.{{ worker.honor_level }}</span>
            <span class="stat-label">荣誉等级</span>
          </div>
        </div>

        <div class="worker-actions">
          <button
            class="action-btn primary"
            @click="handleInvite(worker)"
          >
            邀请陪诊
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
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'
import LinliAvatar from '@/components/LinliAvatar.vue'

const router = useRouter()
const route = useRoute()

const workers = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const matchedSkill = ref('')
const showInviteDialog = ref(false)
const selectedWorker = ref(null)

const fetchWorkers = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim()
      if (matchedSkill.value && keyword === matchedSkill.value) {
        params.skills = keyword
      } else {
        params.keyword = keyword
      }
    }
    const res = await request.get('/employer/workers', { params })
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
  const initialSkill = route.query.skill || route.query.service
  if (initialSkill) {
    matchedSkill.value = String(initialSkill)
    searchKeyword.value = matchedSkill.value
  }
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

/* 新版 H5：就诊人选择陪诊师 */
.worker-square {
  min-height: 100vh;
  padding: 0 0 calc(96px + env(safe-area-inset-bottom));
  background: #FFF7EF;
  color: #4F3A32;
}

.worker-hero {
  padding: 0;
  background: #E94F3D;
  color: #fff;
}

.hero-pill {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.worker-hero h1 {
  margin: 12px 0 7px;
  font-size: 27px;
  line-height: 1.26;
  color: #fff;
}

.worker-hero p {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

.filter-bar {
  margin: 0;
  padding: 16px 16px 12px;
  background: #FFF7EF;
}

.search-input {
  min-height: 56px;
  padding: 12px 16px;
  font-size: 17px;
  border: 1.5px solid #E0C7BA;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(23, 35, 49, 0.06);
}

.search-input:focus {
  border-color: #D94A37;
  box-shadow: 0 0 0 4px rgba(217, 74, 55, 0.14);
}

.worker-summary {
  padding: 0 16px 16px;
  background: #FFF7EF;
}

.brand-strip {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  min-height: 0;
  margin: 0 16px 16px;
  padding: 15px;
  border: 1px solid #E9D4CA;
  border-radius: 18px;
  background:
    linear-gradient(135deg, #ffffff 0%, #f8f0df 100%);
  box-shadow: 0 10px 26px rgba(23, 35, 49, 0.08);
}

.summary-brand {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.summary-mark {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: #D94A37;
  color: #fff;
}

.summary-mark svg {
  width: 38px;
  height: 38px;
  fill: none;
  stroke: currentColor;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.summary-copy {
  min-width: 0;
  flex: 1;
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-title-row strong {
  font-size: 20px;
  line-height: 1.2;
  color: #4F3A32;
  word-break: keep-all;
}

.summary-title-row em {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #ead9ba;
  color: #9a5b25;
  font-size: 13px;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.summary-copy > span {
  display: block;
  margin-top: 7px;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 800;
  color: #7D6257;
}

.summary-points {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
  padding-left: 58px;
}

.summary-points span {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #D94A37;
  font-size: 13px;
  font-weight: 900;
}

.worker-list {
  gap: 12px;
  padding: 0 12px;
}

.worker-card {
  padding: 18px;
  border: 1px solid #E9D4CA;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 16px rgba(23, 35, 49, 0.06);
}

.worker-header {
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.avatar-wrapper {
  width: 64px;
  height: 64px;
  margin-right: 0;
  border: none;
  box-shadow: none;
}

.avatar-placeholder {
  background: #FFF0EC;
  color: #D94A37;
  font-size: 24px;
  font-weight: 900;
}

.worker-name {
  margin: 2px 0 6px;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 900;
  color: #4F3A32;
}

.worker-location {
  display: block;
  min-height: 30px;
  align-items: center;
  padding: 0;
  border-radius: 0;
  background: transparent;
  font-size: 14px;
  font-weight: 800;
  color: #7D6257;
}

.rating {
  min-width: 60px;
  padding: 6px 8px;
  border-radius: 10px;
  background: #f6ead9;
}

.rating .score {
  font-size: 22px;
  line-height: 1;
  color: #b9673b;
}

.rating .label {
  margin-top: 3px;
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #73522b;
}

.worker-tags {
  gap: 8px;
  margin-bottom: 14px;
}

.skill-tag {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #D94A37;
  font-size: 14px;
  font-weight: 800;
}

.worker-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 0 0 14px;
  padding: 12px 0;
  border-top: 1px solid #EFE2DC;
  border-bottom: 1px solid #EFE2DC;
}

.stat-item {
  min-width: 0;
  padding: 0 4px;
}

.stat-value {
  font-size: 21px;
  line-height: 1.1;
  font-weight: 900;
  color: #4F3A32;
}

.stat-label {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 700;
  color: #8A6C60;
}

.worker-actions {
  gap: 10px;
}

.action-btn {
  min-height: 56px;
  padding: 12px 14px;
  border: 1.5px solid #E9D4CA;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 900;
  color: #D94A37;
  background: #fff;
}

.action-btn.primary {
  border-color: #D94A37 !important;
  background: #D94A37 !important;
  color: #fff !important;
}

.action-btn:hover {
  border-color: #D94A37;
  color: #D94A37;
  background: #FFF0EC;
}

.action-btn.primary:hover {
  background: #B73C2F !important;
}

.loading,
.empty {
  margin: 0 16px;
  border: 1px solid #E9D4CA;
  border-radius: 12px;
  background: #fff;
}

.empty p {
  font-size: 21px;
  font-weight: 800;
  color: #4F3A32;
}

.empty .tip,
.tip {
  font-size: 16px;
  font-weight: 600;
  color: #8A6C60;
}

.invite-dialog {
  background: rgba(23, 35, 49, 0.46);
}

.dialog-content {
  max-width: 420px;
  padding: 22px;
  border-radius: 14px;
}

.dialog-title {
  font-size: 24px;
  font-weight: 900;
}

.dialog-text {
  font-size: 17px;
  line-height: 1.55;
}

.dialog-tips {
  font-size: 15px;
  line-height: 1.55;
}

.dialog-btn {
  min-height: 56px;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 900;
}

.dialog-btn.primary {
  background: #D94A37 !important;
  border-color: #D94A37 !important;
}

/* 精修：统计数据用留白区分，不再使用底色和边框 */
.worker-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  margin: 2px 0 18px;
  padding: 4px 2px 16px;
  border: none;
}

.worker-stats .stat-item {
  min-width: 0;
  padding: 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.worker-stats .stat-value {
  font-size: 22px;
  line-height: 1.05;
  font-weight: 900;
  color: var(--text-primary);
}

.worker-stats .stat-label {
  margin-top: 7px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 360px) {
  .worker-hero h1 {
    font-size: 26px;
  }

  .brand-strip {
    padding: 14px;
  }

  .summary-title-row {
    gap: 7px;
  }

  .summary-title-row strong {
    font-size: 19px;
  }

  .summary-points {
    padding-left: 0;
  }

  .worker-header {
    flex-wrap: wrap;
  }

  .rating {
    margin-left: 76px;
  }
}
</style>
