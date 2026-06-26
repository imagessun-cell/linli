<template>
  <div class="message-list-page">
    <div class="conversation-list">
      <div
        v-for="conv in conversations"
        :key="conv.other_user_id"
        class="conversation-item"
        @click="$router.push(`/common/chat/${conv.other_user_id}`)"
      >
        <LinliAvatar
          class="conversation-avatar"
          :name="conv.other_nickname || '联系人'"
          :src="conv.other_avatar"
          variant="worker"
          :size="52"
        />
        <div class="content">
          <div class="header">
            <span class="nickname">{{ conv.other_nickname }}</span>
            <span class="time">{{ formatTime(conv.last_message_time) }}</span>
          </div>
          <p class="preview">{{ conv.last_message }}</p>
        </div>
        <span v-if="conv.unread_count > 0" class="unread-badge">{{ conv.unread_count > 99 ? '99+' : conv.unread_count }}</span>
      </div>
    </div>
    <el-empty v-if="conversations.length === 0 && !loading" description="暂无消息" />
    <div v-if="loading" class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import LinliAvatar from '@/components/LinliAvatar.vue'

const conversations = ref([])
const loading = ref(false)

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  const today = new Date()
  if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const fetchConversations = async () => {
  loading.value = true
  try {
    const res = await request.get('/message/list')
    if (res.code === 0) {
      conversations.value = res.data.conversations || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchConversations()
})
</script>

<style scoped>
.message-list-page {
  padding: 0;
  background: var(--bg-warm);
  min-height: 100vh;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  padding: var(--spacing-lg);
  margin: 0;
  color: var(--text-primary);
}

.conversation-list {
  background: var(--bg-primary);
  margin: 0 var(--spacing-md);
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.2s var(--transition-soft);
}

.conversation-item:hover {
  background: var(--bg-secondary);
}

.conversation-item:last-child {
  border-bottom: none;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  background: var(--accent-soft);
  flex-shrink: 0;
}

.conversation-avatar {
  margin-right: 12px;
}

.content {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.nickname {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  flex-shrink: 0;
  margin-left: 8px;
}

.preview {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.unread-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: var(--spacing-sm);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
  font-size: var(--font-size-base);
}

@media (prefers-reduced-motion: reduce) {
  .conversation-item { transition: none; }
}

/* 适老化统一风格：消息列表 */
.message-list-page {
  min-height: 100vh;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
}

.page-title {
  padding: 22px 16px 10px;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 900;
  color: #4F3A32;
}

.message-overview {
  margin: 14px 14px 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #EBD8CF;
  border-radius: 18px;
  background: #fffdf8;
  box-shadow: 0 10px 24px rgba(23, 35, 49, 0.06);
}

.message-overview span {
  color: #8A6C60;
  font-size: 15px;
  font-weight: 900;
}

.message-overview strong {
  color: #4F3A32;
  font-size: 17px;
  font-weight: 900;
}

.message-overview em {
  margin-left: auto;
  padding: 5px 9px;
  border-radius: 999px;
  background: #FFF0EC;
  color: #E94F3D;
  font-size: 13px;
  font-style: normal;
  font-weight: 900;
}

.conversation-list {
  margin: 14px 14px 0;
  border: 1px solid #EBD8CF;
  border-radius: 20px;
  background: #fffdf8;
  box-shadow: 0 12px 28px rgba(23, 35, 49, 0.08);
}

.conversation-item {
  min-height: 86px;
  padding: 16px;
  border-bottom: 1px solid #F2E6DE;
}

.conversation-item:hover {
  background: #FFF9F2;
}

.avatar,
.avatar-placeholder {
  width: 58px;
  height: 58px;
  margin-right: 12px;
  border: 2px solid #FFF0EC;
  font-size: 22px;
  font-weight: 900;
  background: #E94F3D;
}

.header {
  align-items: center;
  gap: 10px;
  margin-bottom: 7px;
}

.nickname {
  font-size: 19px;
  font-weight: 900;
  color: #4F3A32;
}

.time {
  font-size: 14px;
  font-weight: 800;
  color: #8A6C60;
}

.preview {
  font-size: 16px;
  line-height: 1.45;
  color: #7D6257;
}

.unread-badge {
  min-width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #b45f32;
  font-size: 13px;
}

.loading {
  font-size: 18px;
}

/* 全面精修：消息列表 */
.message-list-page {
  background:
    linear-gradient(180deg, #F7F3EE 0%, #FBF8F4 46%, #F8F1EB 100%);
}

.conversation-list {
  display: grid;
  gap: 10px;
  margin: 14px;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.conversation-item {
  min-height: 82px;
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: 16px;
  background: var(--bg-panel);
  box-shadow: 0 8px 22px rgba(64, 48, 40, 0.055);
}

.conversation-item:last-child {
  border-bottom: 1px solid var(--line-soft);
}

.conversation-item:hover {
  background: #FFFCF8;
  border-color: rgba(217, 74, 55, 0.22);
}

.conversation-avatar {
  margin-right: 12px;
  border: none;
  box-shadow: none;
}

.nickname {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 800;
}

.preview,
.time {
  color: var(--text-muted);
}

.unread-badge {
  background: var(--accent);
}
</style>
