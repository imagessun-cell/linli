<template>
  <div class="profile">
    <div class="avatar-section">
      <div class="avatar-wrapper" @click="changeAvatar">
        <LinliAvatar :name="userInfo?.nickname || '陪诊师'" :src="userInfo?.avatar_url" variant="worker" :size="96" />
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
          <span class="label">陪诊师状态</span>
          <span class="value" :class="statusClass">
            {{ statusNames[workerInfo?.status] || '未申请' }}
          </span>
        </div>
      </div>
    </div>

    <!-- V1.4 认证卡片 -->
    <div class="info-section" v-if="certInfo">
      <h3>陪诊师认证</h3>
      <div class="cert-card">
        <CertificationBadge
          :level="certInfo.level"
          :totalOrders="certInfo.total_orders"
          :avgRating="certInfo.avg_rating"
        />
        <div class="cert-progress" v-if="certInfo.upgrade_progress">
          <p class="progress-hint">距{{ certInfo.upgrade_progress.level }}升级：</p>
          <p class="progress-detail">{{ certInfo.upgrade_progress.desc }}</p>
        </div>
        <el-button v-if="certInfo.level < 3" size="small" type="primary" @click="applyUpgrade">
          申请升级
        </el-button>
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
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import CertificationBadge from '@/components/v1_4/CertificationBadge.vue'
import LinliAvatar from '@/components/LinliAvatar.vue'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(userStore.userInfo)
const workerInfo = ref(null)
const certInfo = ref(null)

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

const fetchCertInfo = async () => {
  try {
    const res = await request.get('/v1/certification')
    if (res.code === 0) {
      certInfo.value = res.data
    }
  } catch (e) {
    // not a worker yet
  }
}

const applyUpgrade = async () => {
  try {
    const res = await request.post('/v1/certification/upgrade')
    if (res.code === 0) {
      ElMessage.success(res.message || '申请成功')
      fetchCertInfo()
    } else {
      ElMessage.warning(res.message || '暂不符合升级条件')
    }
  } catch (e) {
    ElMessage.error(e.message || '申请失败')
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await userStore.fetchProfile()
  userInfo.value = userStore.userInfo
  workerInfo.value = userStore.userInfo?.worker
  fetchCertInfo()
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
  background: #EBD8CF;
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
  color: #8A6C60;
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
  color: #8A6C60;
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
  color: #7D6257;
}

.info-item .value {
  color: #4F3A32;
}

.info-item .value.success { color: #B66A25; }
.info-item .value.warning { color: #C98216; }
.info-item .value.danger { color: #B84545; }

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions .el-button {
  width: 100%;
}

.cert-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cert-progress {
  background: #FFF9F2;
  border-radius: 8px;
  padding: 12px;
}

.progress-hint {
  font-size: 13px;
  font-weight: 600;
  color: #4F3A32;
  margin-bottom: 4px;
}

.progress-detail {
  font-size: 12px;
  color: #8A6C60;
  line-height: 1.5;
}
</style>
