<template>
  <div class="chat-room">
    <!-- 聊天对象头部 -->

    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">←</button>
      <span class="header-label">与{{ targetUser?.nickname || '' }}的对话</span>
    </header>

    <div v-if="!isValidTarget" class="chat-error">
      <el-empty description="聊天对象无效，请返回消息列表重新进入" />
    </div>
    <template v-else>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="message-list" ref="messageListRef">
        <div
          v-for="msg in messages"
          :key="msg?.id"
          class="message-item"
          :class="{ mine: msg.from_user_id === userId }"
        >
          <img
            v-if="msg.from_user_id !== userId && msg.from_avatar"
            :src="msg.from_avatar"
            class="avatar"
            @error="onAvatarError($event)"
          />
          <span
            v-else-if="msg.from_user_id !== userId"
            class="avatar avatar-placeholder"
          >{{ (msg.from_nickname || '?').charAt(0) }}</span>
          <div class="bubble">
            <p>{{ msg.content }}</p>
            <span class="time">{{ formatTime(msg.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="input-area">
        <el-input v-model="inputText" placeholder="输入消息..." @keyup.enter="sendMessage" />
        <el-button type="primary" @click="sendMessage" :disabled="!inputText.trim()">发送</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { io } from 'socket.io-client'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = computed(() => userStore.userInfo?.id)
const targetUserId = ref(Number(route.params.userId))
const messages = ref([])
const inputText = ref('')
const messageListRef = ref(null)
const loading = ref(false)
const targetUser = ref(null)
const isValidTarget = computed(() => Number.isInteger(targetUserId.value) && targetUserId.value > 0)

let socket = null

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const onAvatarError = (event) => {
  const img = event.target
  img.style.display = 'none'
  const parent = img.parentElement
  const placeholder = document.createElement('span')
  placeholder.className = 'avatar avatar-placeholder'
  placeholder.textContent = '?'
  parent.insertBefore(placeholder, img.nextSibling)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const goBack = () => {
  router.push('/common/messages')
}

const fetchTargetUser = async () => {
  try {
    const res = await request.get(`/user/profile/${targetUserId.value}`)
    if (res.code === 0) {
      targetUser.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const fetchMessages = async () => {
  loading.value = true
  try {
    const res = await request.get(`/message/conversation/${targetUserId.value}`)
    if (res.code === 0) {
      messages.value = (res.data || []).filter(Boolean)
      scrollToBottom()
    } else {
      ElMessage.error(res.message || '加载消息失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return
  if (!isValidTarget.value) {
    ElMessage.error('聊天对象无效')
    return
  }

  const content = inputText.value.trim()
  inputText.value = '' // 立即清空输入框，提升体验

  try {
    const res = await request.post('/message/send', {
      to_user_id: targetUserId.value,
      content
    })
    if (res.code === 0 && res.data) {
      messages.value.push(res.data)
      scrollToBottom()
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error(e?.message || '发送失败')
  }
}

const initSocket = () => {
  socket = io({
    auth: { token: userStore.token }
  })

  socket.on('connect', () => {
    console.log('Socket connected')
  })

  socket.on('new_message', (msg) => {
    if (msg && msg.from_user_id === Number(targetUserId.value)) {
      messages.value.push(msg)
      scrollToBottom()
    }
  })

  socket.on('message_sent', () => {
    // HTTP 响应已处理消息展示，此处无需重复添加
  })
}

onMounted(() => {
  if (isValidTarget.value) {
    fetchTargetUser()
    fetchMessages()
    initSocket()
  }
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-warm);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: transparent;
  border: none !important;
  cursor: pointer;
  border-radius: 50% !important;
  color: var(--text-secondary) !important;
  transition: all 0.2s var(--transition-soft);
  padding: 0 !important;
  min-height: unset !important;
}

.back-btn:hover {
  background: var(--bg-secondary) !important;
  color: var(--accent) !important;
}

.header-label {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--font-size-base);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-md);
}

.message-item {
  display: flex;
  margin-bottom: var(--spacing-md);
}

.message-item.mine {
  flex-direction: row-reverse;
}

.message-item .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  margin-right: 10px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--accent-soft);
  flex-shrink: 0;
}

.message-item.mine .avatar {
  margin-right: 0;
  margin-left: 10px;
}

.bubble {
  max-width: 70%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.message-item.mine .bubble {
  background: var(--accent);
  color: white;
}

.bubble p {
  font-size: var(--font-size-sm);
  line-height: 1.5;
  word-break: break-all;
  margin: 0;
}

.bubble .time {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 4px;
}

.message-item.mine .bubble .time {
  color: rgba(255, 255, 255, 0.7);
}

.input-area {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-top: 1px solid var(--border-light);
  align-items: center;
}

.input-area .el-input {
  flex: 1;
}
</style>