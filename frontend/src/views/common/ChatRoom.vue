<template>
  <div class="chat-room">
    <div class="message-list" ref="messageListRef">
      <div v-for="msg in messages" :key="msg.id" class="message-item" :class="{ mine: msg.from_user_id === userId }">
        <img v-if="msg.from_user_id !== userId" :src="msg.from_avatar || '/default-avatar.png'" class="avatar" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { io } from 'socket.io-client'

const route = useRoute()
const userStore = useUserStore()

const userId = ref(userStore.userInfo?.id)
const targetUserId = ref(route.params.userId)
const messages = ref([])
const inputText = ref('')
const messageListRef = ref(null)

let socket = null

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const fetchMessages = async () => {
  try {
    const res = await request.get(`/message/conversation/${targetUserId.value}`)
    if (res.code === 0) {
      messages.value = res.data || []
      scrollToBottom()
    }
  } catch (e) {
    console.error(e)
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return

  try {
    const res = await request.post('/message/send', {
      to_user_id: targetUserId.value,
      content: inputText.value.trim()
    })
    if (res.code === 0) {
      messages.value.push(res.data)
      inputText.value = ''
      scrollToBottom()
    }
  } catch (e) {
    console.error(e)
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
    if (msg.from_user_id === Number(targetUserId.value)) {
      messages.value.push(msg)
      scrollToBottom()
    }
  })

  socket.on('message_sent', (msg) => {
    console.log('Message sent:', msg)
  })
}

onMounted(() => {
  fetchMessages()
  initSocket()
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
  height: calc(100vh - 100px);
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
}

.message-item.mine {
  flex-direction: row-reverse;
}

.message-item .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ddd;
  margin-right: 8px;
}

.message-item.mine .avatar {
  margin-right: 0;
  margin-left: 8px;
}

.bubble {
  max-width: 70%;
  padding: 10px 14px;
  background: white;
  border-radius: 12px;
  position: relative;
}

.message-item.mine .bubble {
  background: #667eea;
  color: white;
}

.bubble p {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.bubble .time {
  display: block;
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.message-item.mine .bubble .time {
  color: rgba(255, 255, 255, 0.7);
}

.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.input-area .el-input {
  flex: 1;
}
</style>