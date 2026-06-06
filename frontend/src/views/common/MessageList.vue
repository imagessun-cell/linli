<template>
  <div class="message-list-page">
    <h2 class="page-title">消息</h2>
    <div class="conversation-list">
      <div
        v-for="conv in conversations"
        :key="conv.other_user_id"
        class="conversation-item"
        @click="$router.push(`/common/chat/${conv.other_user_id}`)"
      >
        <img
          v-if="conv.other_avatar"
          :src="conv.other_avatar"
          class="avatar"
          @error="onAvatarError($event, conv.other_nickname)"
        />
        <span v-else class="avatar avatar-placeholder">{{ (conv.other_nickname || '?').charAt(0) }}</span>
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

const onAvatarError = (event, name) => {
  const img = event.target
  img.style.display = 'none'
  const placeholder = document.createElement('span')
  placeholder.className = 'avatar avatar-placeholder'
  placeholder.textContent = (name || '?').charAt(0)
  img.parentElement.appendChild(placeholder)
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
</style>
