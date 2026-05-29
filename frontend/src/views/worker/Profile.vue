<template>
  <div class="profile">
    <div class="avatar-section">
      <div class="avatar-wrapper" @click="changeAvatar">
        <img :src="userInfo?.avatar_url || '/default-avatar.png'" class="avatar" />
        <span class="change-icon">✏️</span>
      </div>
      <p class="nickname">{{ userInfo?.nickname }}</p>
      <p class="phone">{{ userInfo?.phone }}</p>
    </div>

    <div class="info-section">
      <h3>个人信息</h3>
      <div class="info-list">
        <div class="info-item">
          <span class="label">真实姓名</span>
          <span class="value">{{ userInfo?.real_name || '未填写' }}</span>
        </div>
        <div class="info-item">
          <span class="label">实名认证</span>
          <span class="value" :class="userInfo?.face_verified ? 'success' : 'warning'">
            {{ userInfo?.face_verified ? '已认证' : '未认证' }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">服务者状态</span>
          <span class="value" :class="statusClass">
            {{ statusNames[workerInfo?.status] || '未申请' }}
          </span>
        </div>
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" plain @click="$router.push('/worker/apply')" v-if="workerInfo?.status !== 1">
        申请认证
      </el-button>
      <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(userStore.userInfo)
const workerInfo = ref(null)

const statusNames = { 0: '审核中', 1: '已认证', 2: '已驳回' }

const statusClass = computed(() => {
  const status = workerInfo.value?.status
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  return 'danger'
})

const changeAvatar = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userStore.token}` },
        body: formData
      }).then(r => r.json())

      if (res.code === 0) {
        ElMessage.success('头像上传成功')
        userStore.fetchProfile()
      }
    } catch (e) {
      ElMessage.error('上传失败')
    }
  }
  input.click()
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await userStore.fetchProfile()
  userInfo.value = userStore.userInfo
  workerInfo.value = userStore.userInfo?.worker
})
</script>

<style scoped>
.profile {
  padding: 16px;
}

.avatar-section {
  text-align: center;
  padding: 30px;
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #ddd;
}

.change-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 16px;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  margin-top: 12px;
}

.phone {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.info-section {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-section h3 {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  color: #333;
}

.info-item .value.success { color: #4caf50; }
.info-item .value.warning { color: #ff9800; }
.info-item .value.danger { color: #f44336; }

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions .el-button {
  width: 100%;
}
</style>