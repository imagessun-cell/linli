<template>
  <div class="worker-square">
    <div class="filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索社区或技能" clearable @change="fetchWorkers">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="worker-list">
      <div v-for="worker in workers" :key="worker.id" class="worker-card">
        <div class="worker-header">
          <img :src="worker.avatar_url || '/default-avatar.png'" class="avatar" />
          <div class="info">
            <h4>{{ worker.nickname }}</h4>
            <p>{{ worker.community }}</p>
          </div>
          <div class="rating">
            <span class="score">{{ worker.avg_rating }}</span>
            <span class="label">评分</span>
          </div>
        </div>
        <div class="worker-tags">
          <el-tag v-for="skill in JSON.parse(worker.skills || '[]')" :key="skill" size="small">
            {{ skill }}
          </el-tag>
        </div>
        <div class="worker-stats">
          <span>订单: {{ worker.total_orders }}</span>
          <span>服务时长: {{ worker.total_hours }}小时</span>
          <span>Lv.{{ worker.honor_level }}</span>
        </div>
        <div class="worker-actions">
          <el-button type="primary" size="small" @click="handleInvite(worker)">邀请服务</el-button>
          <el-button size="small" @click="$router.push(`/common/chat/${worker.user_id}`)">咨询</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="workers.length === 0 && !loading" description="暂无服务者" />
    <el-loading v-if="loading" />

    <el-dialog v-model="showInviteDialog" title="邀请服务" width="90%">
      <p>确定邀请 <strong>{{ selectedWorker?.nickname }}</strong> 为您服务吗？</p>
      <p class="tips">请先发布任务，然后从任务列表中邀请该服务者</p>
      <template #footer>
        <el-button @click="showInviteDialog = false">取消</el-button>
        <el-button type="primary" @click="goToPublish">去发单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()

const workers = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const showInviteDialog = ref(false)
const selectedWorker = ref(null)

const fetchWorkers = async () => {
  loading.value = true
  try {
    const res = await request.get('/employer/workers', { skills: searchKeyword.value })
    if (res.code === 0) {
      workers.value = res.data.workers || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleInvite = (worker) => {
  selectedWorker.value = worker
  showInviteDialog.value = true
}

const goToPublish = () => {
  showInviteDialog.value = false
  router.push('/employer/publish')
}

onMounted(() => {
  fetchWorkers()
})
</script>

<style scoped>
.worker-square {
  padding: 16px;
}

.filter-bar {
  margin-bottom: 16px;
}

.worker-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.worker-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.worker-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 12px;
  background: #ddd;
}

.info {
  flex: 1;
}

.info h4 {
  font-size: 16px;
  margin-bottom: 4px;
}

.info p {
  font-size: 13px;
  color: #999;
}

.rating {
  text-align: center;
}

.rating .score {
  display: block;
  font-size: 18px;
  color: #ff9800;
  font-weight: bold;
}

.rating .label {
  font-size: 11px;
  color: #999;
}

.worker-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.worker-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.worker-actions {
  display: flex;
  gap: 8px;
}

.tips {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}
</style>