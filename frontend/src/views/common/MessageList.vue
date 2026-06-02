<template>
  <div class="message-list">
    <div class="conversation-list">
      <div v-for="msg in messages" :key="msg.id" class="conversation-item" @click="$router.push(`/common/chat/${msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id}`)">
        <img :src="msg.from_avatar || '/default-avatar.png'" class="avatar" />
        <div class="content">
          <div class="header">
            <span class="nickname">{{ msg.from_user_id === userId ? msg.to_nickname : msg.from_nickname }}</span>
            <span class="time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <p class="preview">{{ msg.content }}</p>
        </div>
        <el-badge :value="msg.unread" :hidden="!msg.unread" />
      </div>
    </div>
    <el-empty v-if="messages.length === 0 && !loading" description="暂无消息" />
    <el-loading v-if="loading" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'

const userStore = useUserStore()
const userId = ref(userStore.userInfo?.id)
const messages = ref([])
const loading = ref(false)

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const fetchMessages = async () => {
  loading.value = true
  try {
    const res = await request.get('/message/list')
    if (res.code === 0) {
      messages.value = res.data.messages || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.message-list {
  padding: 0;
}

.conversation-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.conversation-item:last-child {
  border-bottom: none;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  background: #ddd;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  object-fit: cover;
}

.content {
  flex: 1;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.nickname {
  font-size: 14px;
  font-weight: bold;
}

.time {
  font-size: 12px;
  color: #999;
}

.preview {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>