<template>
  <div class="role-select-container">
    <div class="header">
      <h2>选择身份</h2>
      <p>您想以什么身份使用邻里服务？</p>
    </div>
    <div class="role-list">
      <div class="role-card" @click="selectRole(1)" :class="{ active: selectedRole === 1 }">
        <div class="icon">👴</div>
        <div class="content">
          <h3>服务者</h3>
          <p>50-65岁老年人，为社区提供陪诊、陪聊、保洁等服务</p>
        </div>
      </div>
      <div class="role-card" @click="selectRole(2)" :class="{ active: selectedRole === 2 }">
        <div class="icon">👤</div>
        <div class="content">
          <h3>用工方</h3>
          <p>需要养老服务的用户，发布任务邀请服务者</p>
        </div>
      </div>
    </div>
    <div class="actions">
      <el-button type="primary" size="large" style="width: 100%" :loading="loading" @click="confirmRole">
        确定
      </el-button>
      <el-button size="large" style="width: 100%; margin-top: 12px" @click="handleLogout">
        退出登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()

const selectedRole = ref(1)
const loading = ref(false)

onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.userInfo?.role) {
    selectedRole.value = userStore.userInfo.role
  }
})

const selectRole = (role) => {
  selectedRole.value = role
}

const confirmRole = async () => {
  loading.value = true
  try {
    if (userStore.role !== selectedRole.value) {
      const res = await userStore.switchRole(selectedRole.value)
      if (res.code !== 0) {
        ElMessage.error(res.message || '切换失败')
        loading.value = false
        return
      }
    }

    const roleRoutes = { 1: '/worker/dashboard', 2: '/employer/dashboard' }
    router.push(roleRoutes[selectedRole.value])
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.role-select-container {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f5f5f5;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.header p {
  color: #999;
  font-size: 14px;
}

.role-list {
  max-width: 500px;
  margin: 0 auto;
}

.role-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.role-card:hover {
  border-color: #667eea;
}

.role-card.active {
  border-color: #667eea;
  background: #f0f0ff;
}

.role-card .icon {
  font-size: 48px;
  margin-right: 20px;
}

.role-card .content h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 4px;
}

.role-card .content p {
  font-size: 13px;
  color: #999;
}

.actions {
  max-width: 500px;
  margin: 30px auto 0;
}
</style>