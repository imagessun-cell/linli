<template>
  <div class="chat-room">
    <!-- 聊天对象头部 -->

    <header class="detail-header">
      <button class="back-btn" type="button" aria-label="返回消息列表" @click="goBack">←</button>
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
          <LinliAvatar
            v-if="msg.from_user_id !== userId"
            class="avatar vector-avatar"
            :name="msg.from_nickname || '联系人'"
            :src="msg.from_avatar || targetUser?.avatar_url"
            variant="worker"
            :size="40"
          />
          <div class="bubble">
            <p>{{ msg.content }}</p>
            <span class="time">{{ formatTime(msg.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="input-area">
        <input
          ref="attachmentInputRef"
          class="hidden-file-input"
          type="file"
          multiple
          @change="handleAttachmentChange"
        />
        <input
          ref="cameraInputRef"
          class="hidden-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          @change="handleCameraChange"
        />
        <div class="quick-panel" aria-label="快捷消息">
          <button
            v-for="tag in quickMessages"
            :key="tag"
            type="button"
            class="quick-chip"
            @click="appendText(tag)"
          >
            {{ tag }}
          </button>
        </div>
        <div class="emoji-panel" aria-label="表情">
          <button
            v-for="emoji in sceneEmojis"
            :key="emoji"
            type="button"
            class="emoji-btn"
            @click="appendText(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
        <div v-if="pendingAttachments.length > 0" class="attachment-preview" aria-label="待发送附件">
          <span
            v-for="file in pendingAttachments"
            :key="file.id"
            class="attachment-chip"
          >
            <span class="attachment-name">{{ file.name }}</span>
            <span class="attachment-size">{{ formatFileSize(file.size) }}</span>
            <button type="button" aria-label="移除附件" @click="removeAttachment(file.id)">×</button>
          </span>
        </div>
        <div class="message-compose">
          <button
            type="button"
            class="mode-toggle"
            :aria-label="inputMode === 'text' ? '切换语音输入' : '切换文字输入'"
            @click="toggleInputMode"
          >
            <span
              class="mode-toggle-icon"
              aria-hidden="true"
              v-html="inputMode === 'text' ? mediaIcons.mic : mediaIcons.keyboard"
            ></span>
            <span class="sr-only">{{ inputMode === 'text' ? '语音输入' : '键盘输入' }}</span>
          </button>
          <button
            v-if="inputMode === 'voice'"
            type="button"
            :class="['voice-hold-btn', { recording: isRecording }]"
            @pointerdown.prevent="startVoiceRecord"
            @pointerup.prevent="finishVoiceRecord"
            @pointercancel.prevent="cancelVoiceRecord"
          >
            {{ isRecording ? '松开发送' : '按住说话' }}
          </button>
          <el-input
            v-else
            v-model="inputText"
            placeholder="输入消息..."
            @focus="showMorePanel = false"
            @keyup.enter="sendMessage()"
          />
          <button
            type="button"
            :class="['plus-toggle', { active: showMorePanel }]"
            :aria-expanded="showMorePanel"
            aria-label="更多功能"
            @click="toggleMorePanel"
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            v-if="canSend"
            type="button"
            class="send-btn"
            @click="sendMessage()"
          >
            发送
          </button>
        </div>
        <div v-if="showMorePanel" class="media-toolbar" aria-label="消息工具">
          <button
            v-for="action in mediaActions"
            :key="action.key"
            type="button"
            class="media-action"
            :disabled="action.key === 'location' && locating"
            @click="handleMediaAction(action.key)"
          >
            <span class="media-action-icon" aria-hidden="true" v-html="mediaIcons[action.icon]"></span>
            <span class="media-action-label">{{ action.label }}</span>
          </button>
        </div>
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
import { isDemoMode } from '@/api/demo'
import { io } from 'socket.io-client'
import LinliAvatar from '@/components/LinliAvatar.vue'

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
const inputMode = ref('text')
const showMorePanel = ref(false)
const attachmentInputRef = ref(null)
const cameraInputRef = ref(null)
const pendingAttachments = ref([])
const locating = ref(false)
const isRecording = ref(false)
const voiceStartAt = ref(0)
const isValidTarget = computed(() => Number.isInteger(targetUserId.value) && targetUserId.value > 0)
const canSend = computed(() => Boolean(inputText.value.trim() || pendingAttachments.value.length > 0))

const quickMessages = [
  '我已到达医院门口',
  '请问方便电话沟通吗',
  '我会提前到达',
  '需要带医保卡和病历',
  '检查结束后我同步结果'
]

const sceneEmojis = ['🙂', '👌', '🙏', '📍', '🏥', '🕘', '💊', '🧾']

const mediaActions = [
  { key: 'file', label: '附件', icon: 'paperclip' },
  { key: 'camera', label: '拍摄', icon: 'camera' },
  { key: 'location', label: '位置', icon: 'mapPin' },
  { key: 'voiceCall', label: '语音通话', icon: 'phone' },
  { key: 'videoCall', label: '视频通话', icon: 'video' }
]

const mediaIcons = {
  paperclip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.6 12 21a6 6 0 0 1-8.5-8.5l9.8-9.8a4 4 0 0 1 5.7 5.7l-9.8 9.8a2 2 0 1 1-2.8-2.8l9.2-9.2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.7 7-12A7 7 0 0 0 5 9c0 6.3 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 5-3v10l-5-3"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/><path d="M8 22h8"/></svg>',
  keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M11 9h.01M15 9h.01M19 9h.01M7 13h.01M11 13h.01M15 13h.01M17 17H7"/></svg>'
}

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

const appendText = (text) => {
  const spacer = inputText.value && !inputText.value.endsWith(' ') ? ' ' : ''
  inputText.value = `${inputText.value}${spacer}${text}`.trimStart()
  inputMode.value = 'text'
  showMorePanel.value = false
}

const toggleInputMode = () => {
  inputMode.value = inputMode.value === 'text' ? 'voice' : 'text'
  showMorePanel.value = false
}

const toggleMorePanel = () => {
  showMorePanel.value = !showMorePanel.value
  if (showMorePanel.value) {
    inputMode.value = 'text'
  }
}

const handleMediaAction = (key) => {
  if (key === 'file') {
    attachmentInputRef.value?.click()
  } else if (key === 'camera') {
    cameraInputRef.value?.click()
  } else if (key === 'location') {
    sendLocation()
  } else if (key === 'voiceCall') {
    sendCallInvite('voice')
  } else if (key === 'videoCall') {
    sendCallInvite('video')
  }
}

const normalizeFiles = (fileList, source) => {
  const files = Array.from(fileList || [])
  if (files.length === 0) return
  const nextFiles = files.map((file, index) => ({
    id: `${Date.now()}-${source}-${index}`,
    name: file.name || (source === 'camera' ? '现场照片' : '附件'),
    size: file.size || 0,
    type: file.type || '',
    source
  }))
  pendingAttachments.value = [...pendingAttachments.value, ...nextFiles].slice(0, 6)
  showMorePanel.value = false
  ElMessage.success(source === 'camera' ? '照片已加入待发送' : '附件已加入待发送')
}

const handleAttachmentChange = (event) => {
  normalizeFiles(event.target.files, 'file')
  event.target.value = ''
}

const handleCameraChange = (event) => {
  normalizeFiles(event.target.files, 'camera')
  event.target.value = ''
}

const removeAttachment = (id) => {
  pendingAttachments.value = pendingAttachments.value.filter(file => file.id !== id)
}

const formatFileSize = (size) => {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

const buildAttachmentText = () => {
  return pendingAttachments.value.map(file => {
    const prefix = file.source === 'camera' || file.type.startsWith('image/') ? '[图片]' : '[附件]'
    return `${prefix} ${file.name}`
  }).join('\n')
}

const sendLocation = async () => {
  if (!navigator.geolocation) {
    ElMessage.warning('当前浏览器不支持定位')
    return
  }
  locating.value = true
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000
      })
    })
    const { latitude, longitude } = position.coords
    showMorePanel.value = false
    await sendMessage(`[位置] 我当前的位置：${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
  } catch (e) {
    ElMessage.warning('定位失败，请检查浏览器定位权限')
  } finally {
    locating.value = false
  }
}

const sendCallInvite = async (type) => {
  const content = type === 'voice'
    ? '[语音通话] 已发起语音通话邀请'
    : '[视频通话] 已发起视频通话邀请'
  showMorePanel.value = false
  await sendMessage(content)
}

const startVoiceRecord = () => {
  isRecording.value = true
  voiceStartAt.value = Date.now()
}

const finishVoiceRecord = async () => {
  if (!isRecording.value) return
  const seconds = Math.max(1, Math.round((Date.now() - voiceStartAt.value) / 1000))
  isRecording.value = false
  await sendMessage(`[语音] ${seconds}秒`)
}

const cancelVoiceRecord = () => {
  if (!isRecording.value) return
  isRecording.value = false
  ElMessage.info('已取消语音输入')
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

const sendMessage = async (customContent = '') => {
  const attachmentText = buildAttachmentText()
  const composedContent = [
    customContent || inputText.value.trim(),
    !customContent ? attachmentText : ''
  ].filter(Boolean).join('\n')

  if (!composedContent.trim()) return
  if (!isValidTarget.value) {
    ElMessage.error('聊天对象无效')
    return
  }

  const content = composedContent.trim()
  inputText.value = '' // 立即清空输入框，提升体验
  if (!customContent) {
    pendingAttachments.value = []
  }

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
  if (isDemoMode) return
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

/* 适老化统一风格：聊天 */
.chat-room {
  background:
    linear-gradient(180deg, #FFF2E8 0%, #FFF9F2 38%, #FFF6EE 100%);
}

.detail-header {
  min-height: 70px;
  padding: 12px 16px;
  background: #E94F3D;
  border-bottom: none;
  color: #fff;
}

.back-btn {
  width: 46px;
  height: 46px;
  min-height: 46px !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.16) !important;
  color: #fff !important;
}

.header-label {
  font-size: 18px;
  font-weight: 900;
  color: #fff;
}

.message-list {
  padding: 16px 14px 96px;
}

.message-item {
  margin-bottom: 14px;
}

.message-item .avatar,
.avatar-placeholder {
  width: 44px;
  height: 44px;
  font-size: 18px;
  background: #E94F3D;
  border: 2px solid #FFF0EC;
}

.bubble {
  max-width: 76%;
  padding: 12px 14px;
  border: 1px solid #EBD8CF;
  border-radius: 18px;
  background: #fffdf8;
  box-shadow: 0 8px 18px rgba(23, 35, 49, 0.07);
}

.message-item.mine .bubble {
  background: #E94F3D;
}

.bubble p {
  font-size: 17px;
  line-height: 1.55;
}

.bubble .time {
  margin-top: 6px;
  font-size: 12px;
}

.input-area {
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid #EBD8CF;
  box-shadow: 0 -8px 24px rgba(23, 35, 49, 0.08);
  align-items: stretch;
}

.hidden-file-input {
  display: none;
}

.quick-panel,
.emoji-panel {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.quick-panel::-webkit-scrollbar,
.emoji-panel::-webkit-scrollbar {
  display: none;
}

.quick-chip,
.emoji-btn {
  flex: 0 0 auto;
  border: 1px solid #EBD8CF;
  background: #fffdf8;
  color: #4F3A32;
  border-radius: 999px;
  font-weight: 800;
  min-height: 38px;
  white-space: nowrap;
  cursor: pointer;
}

.quick-chip {
  padding: 8px 12px;
  font-size: 14px;
}

.emoji-btn {
  width: 38px;
  padding: 0;
  font-size: 20px;
}

.media-toolbar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 4px 0 2px;
}

.media-action {
  width: 100%;
  min-width: 0;
  min-height: 76px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  border-radius: 18px;
  background: transparent !important;
  color: #E94F3D !important;
  box-shadow: none;
  cursor: pointer;
}

.media-action:hover {
  background: transparent !important;
  border-color: transparent !important;
  color: #E94F3D !important;
  transform: translateY(-1px);
}

.media-action:disabled {
  opacity: 0.58;
  cursor: default;
  color: #E94F3D !important;
}

.media-action-icon {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #E94F3D;
}

.media-action-icon :deep(svg),
.mode-toggle-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.media-action-label {
  max-width: 64px;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 900;
  color: #E94F3D;
  text-align: center;
  white-space: normal;
}

.attachment-preview {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.attachment-preview::-webkit-scrollbar {
  display: none;
}

.attachment-chip {
  flex: 0 0 auto;
  max-width: 220px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "name remove"
    "size remove";
  gap: 2px 8px;
  align-items: center;
  padding: 8px 8px 8px 12px;
  border: 1px solid #EBD8CF;
  border-radius: 14px;
  background: #FFF0EC;
}

.attachment-name {
  grid-area: name;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 900;
  color: #4F3A32;
}

.attachment-size {
  grid-area: size;
  font-size: 12px;
  font-weight: 800;
  color: #8A6C60;
}

.attachment-chip button {
  grid-area: remove;
  width: 30px;
  height: 30px;
  min-height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(233, 79, 61, 0.12);
  color: #E94F3D;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
}

.message-compose {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 46px auto;
  gap: 10px;
  align-items: center;
}

.mode-toggle,
.plus-toggle,
.send-btn {
  min-height: 52px;
  border: none;
  border-radius: 16px;
  font-weight: 900;
  cursor: pointer;
}

.mode-toggle {
  position: relative;
  width: 46px;
  height: 52px;
  padding: 0 !important;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FFF0EC !important;
  color: #E94F3D;
}

.plus-toggle {
  width: 46px;
  height: 52px;
  padding: 0 !important;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #FFF0EC !important;
  color: #E94F3D !important;
  border: 1px solid transparent;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.plus-toggle.active {
  background: #FFF0EC !important;
  border-color: #F4B5A6 !important;
}

.mode-toggle:hover,
.plus-toggle:hover {
  background: #FFF0EC !important;
}

.plus-toggle span {
  position: relative;
  display: block;
  width: 28px;
  height: 28px;
  font-size: 0;
  line-height: 0;
  transition: transform 0.18s ease;
  transform-origin: center;
  translate: none;
}

.plus-toggle span::before,
.plus-toggle span::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 2.5px;
  border-radius: 999px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.plus-toggle span::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.plus-toggle.active span {
  transform: rotate(45deg);
}

.mode-toggle-icon {
  width: 24px;
  min-width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.voice-hold-btn {
  width: 100%;
  min-width: 0;
  min-height: 52px;
  border: 1px solid #EBD8CF;
  border-radius: 16px;
  background: #fffdf8;
  color: #4F3A32;
  font-size: 17px;
  font-weight: 900;
  cursor: pointer;
  user-select: none;
  touch-action: none;
}

.voice-hold-btn.recording {
  background: #E94F3D;
  color: #fff;
  border-color: #E94F3D;
}

.send-btn {
  min-width: 64px;
  padding: 0 16px;
  background: #E94F3D;
  color: #fff;
  font-size: 17px;
}

.send-btn:disabled {
  opacity: 0.48;
  cursor: default;
}

:deep(.input-area .el-input__wrapper) {
  min-height: 52px;
  border-radius: 16px;
  border: 1px solid var(--line) !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

:deep(.input-area .el-input__inner) {
  min-height: 50px;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  font-size: 17px;
}

:deep(.input-area .el-button) {
  min-height: 52px;
  padding: 0 18px;
  border-radius: 16px;
  background: #E94F3D;
  border-color: #E94F3D;
  font-size: 17px;
  font-weight: 900;
}
</style>
