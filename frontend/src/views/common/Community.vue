<template>
  <div class="community">
    <div class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-card">
        <div class="post-header">
          <img :src="post.avatar_url || '/default-avatar.png'" class="avatar" />
          <div class="user-info">
            <span class="nickname">{{ post.nickname }}</span>
            <span class="time">{{ formatTime(post.created_at) }}</span>
          </div>
        </div>

        <div class="post-content" v-if="post.content_type === 1">
          <p>{{ post.content_text }}</p>
          <audio v-if="post.voice_url" :src="post.voice_url" controls class="voice-player" />
        </div>

        <div class="post-content" v-else-if="post.content_type === 2">
          <p>{{ post.content_text }}</p>
          <div class="image-grid" v-if="post.image_urls">
            <img v-for="(url, idx) in JSON.parse(post.image_urls)" :key="idx" :src="url" />
          </div>
        </div>

        <div class="post-actions">
          <span class="action-item" @click="likePost(post.id)">
            <span>👍</span> {{ post.like_count }}
          </span>
          <span class="action-item">
            <span>💬</span> {{ post.comment_count }}
          </span>
        </div>
      </div>
    </div>

    <el-empty v-if="posts.length === 0 && !loading" description="暂无动态" />
    <el-loading v-if="loading" />

    <el-button class="publish-btn" type="primary" circle @click="showPublish = true">+</el-button>

    <el-dialog v-model="showPublish" title="发布动态" width="90%">
      <el-form :model="publishForm">
        <el-form-item>
          <el-input v-model="publishForm.content_text" type="textarea" :rows="4" placeholder="分享您的想法..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPublish = false">取消</el-button>
        <el-button type="primary" @click="handlePublish" :loading="publishing">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const posts = ref([])
const loading = ref(false)
const showPublish = ref(false)
const publishing = ref(false)

const publishForm = ref({
  content_type: 1,
  content_text: ''
})

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

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await request.get('/community/posts')
    if (res.code === 0) {
      posts.value = res.data.posts || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const likePost = async (postId) => {
  try {
    const res = await request.post(`/community/posts/${postId}/like`)
    if (res.code === 0) {
      const post = posts.value.find(p => p.id === postId)
      if (post) post.like_count++
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handlePublish = async () => {
  if (!publishForm.value.content_text.trim()) {
    ElMessage.warning('请输入内容')
    return
  }
  publishing.value = true
  try {
    const res = await request.post('/community/posts', publishForm.value)
    if (res.code === 0) {
      ElMessage.success('发布成功')
      showPublish.value = false
      publishForm.value.content_text = ''
      fetchPosts()
    }
  } catch (e) {
    ElMessage.error(e.message || '发布失败')
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.community {
  padding: 0;
  padding-bottom: 60px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  background: #ddd;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 14px;
  font-weight: bold;
}

.time {
  font-size: 12px;
  color: #999;
}

.post-content p {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 8px;
}

.voice-player {
  width: 100%;
  margin-top: 8px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.image-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
}

.post-actions {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.publish-btn {
  position: fixed;
  bottom: 30px;
  right: 20px;
  width: 50px;
  height: 50px;
  font-size: 24px;
}
</style>