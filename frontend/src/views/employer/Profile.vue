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
      <h3>账户信息</h3>
      <div class="info-list">
        <div class="info-item">
          <span class="label">信用积分</span>
          <span class="value">{{ employerInfo?.credit_score || 100 }}</span>
        </div>
        <div class="info-item">
          <span class="label">我的角色</span>
          <span class="value">就诊人</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(userStore.userInfo)
const employerInfo = ref(null)

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
  employerInfo.value = userStore.userInfo?.employer
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

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions .el-button {
  width: 100%;
}
</style>