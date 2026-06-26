<template>
  <div class="admin-tasks">
    <div class="page-header">
      <h1 class="page-title">任务管理</h1>
      <div class="search-bar">
        <select v-model="statusFilter" class="filter-select" @change="fetchTasks">
          <option value="">全部状态</option>
          <option :value="0">待接单</option>
          <option :value="1">进行中</option>
          <option :value="2">已完成</option>
          <option :value="3">已取消</option>
        </select>
        <input v-model="keyword" placeholder="搜索地址/发布人" class="search-input" @keyup.enter="fetchTasks" />
        <button class="search-btn" @click="fetchTasks">搜索</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>类型</th>
            <th>地址</th>
            <th>预算</th>
            <th>发布人</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.id }}</td>
            <td>{{ task.type }}</td>
            <td class="addr">{{ task.address }}</td>
            <td>¥{{ task.budget }}</td>
            <td>{{ task.employer_nickname || '-' }}</td>
            <td>
              <span :class="['tag', statusClass(task.status)]">{{ statusText(task.status) }}</span>
            </td>
            <td>{{ task.created_at?.substring(0, 10) }}</td>
            <td class="actions">
              <button class="btn-edit" @click="openEdit(task)">编辑</button>
              <button class="btn-danger" @click="handleDelete(task)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="total === 0" class="empty">暂无任务</div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
      <div class="modal">
        <h2 class="modal-title">编辑任务 #{{ editForm.id }}</h2>
        <div class="form-group">
          <label>类型</label>
          <input v-model.number="editForm.type" class="form-input" />
        </div>
        <div class="form-group">
          <label>地址</label>
          <input v-model="editForm.address" class="form-input" />
        </div>
        <div class="form-group">
          <label>预算 (元)</label>
          <input v-model.number="editForm.budget" class="form-input" />
        </div>
        <div class="form-group">
          <label>特殊要求</label>
          <textarea v-model="editForm.special_requirements" class="form-input" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model.number="editForm.status" class="form-input">
            <option :value="0">待接单</option>
            <option :value="1">进行中</option>
            <option :value="2">已完成</option>
            <option :value="3">已取消</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showEdit = false">取消</button>
          <button class="btn-save" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const tasks = ref([])
const total = ref(0)
const loading = ref(true)
const keyword = ref('')
const statusFilter = ref('')

const showEdit = ref(false)
const editForm = ref({})

const fetchTasks = async () => {
  loading.value = true
  try {
    const params = { keyword: keyword.value, limit: 100 }
    if (statusFilter.value !== '') params.status = statusFilter.value
    const res = await request.get('/admin/tasks', { params })
    if (res.code === 0) {
      tasks.value = res.data.tasks
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openEdit = (task) => {
  editForm.value = { ...task }
  showEdit.value = true
}

const saveEdit = async () => {
  try {
    const res = await request.put(`/admin/tasks/${editForm.value.id}`, editForm.value)
    if (res.code === 0) {
      ElMessage.success('更新成功')
      showEdit.value = false
      fetchTasks()
    }
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = (task) => {
  ElMessageBox.confirm(`确定删除任务 #${task.id}？`, '确认删除', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error'
  }).then(async () => {
    const res = await request.delete(`/admin/tasks/${task.id}`)
    if (res.code === 0) { ElMessage.success('删除成功'); fetchTasks() }
  }).catch(() => {})
}

const statusText = (s) => ({ 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }[s] || '未知')
const statusClass = (s) => ({ 0: 'tag-pending', 1: 'tag-ongoing', 2: 'tag-done', 3: 'tag-cancelled' }[s] || '')

onMounted(fetchTasks)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0;
}

.search-bar {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  flex-wrap: wrap;
}

.filter-select, .search-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  min-height: var(--touch-target-min);
  background: var(--bg-primary);
}

.search-input { min-width: 200px; }

.search-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--accent) !important;
  color: #fff !important;
  border: none !important;
  border-radius: var(--border-radius) !important;
  cursor: pointer;
  font-weight: 500;
}

.table-wrapper {
  background: var(--bg-primary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th {
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-weight: 600;
  border-bottom: var(--border-light);
  white-space: nowrap;
}

.data-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
}

.data-table tr:hover { background: var(--bg-secondary); }
.data-table tr:last-child td { border-bottom: none; }

.addr { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}
.tag-pending { background: #FFF3D8; color: #B66A25; }
.tag-ongoing { background: #FFF0EC; color: #E94F3D; }
.tag-done { background: var(--success-light); color: var(--success); }
.tag-cancelled { background: var(--danger-light); color: var(--danger); }

.actions { display: flex; gap: var(--spacing-xs); }
.btn-edit, .btn-danger {
  padding: 4px 12px; font-size: var(--font-size-xs);
  border: var(--border-light); border-radius: var(--border-radius-sm);
  cursor: pointer; min-height: 32px; background: var(--bg-primary);
}
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-danger:hover { border-color: var(--danger); color: var(--danger); }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(45,45,45,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: var(--bg-primary); border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl); width: 100%; max-width: 480px; box-shadow: var(--shadow-xl);
}
.modal-title { font-size: var(--font-size-lg); font-weight: 600; margin: 0 0 var(--spacing-lg); }
.form-group { margin-bottom: var(--spacing-md); }
.form-group label {
  display: block; font-size: var(--font-size-sm);
  font-weight: 500; color: var(--text-secondary); margin-bottom: var(--spacing-xs);
}
.form-input {
  width: 100%; padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-light); border-radius: var(--border-radius);
  font-size: var(--font-size-base); background: var(--bg-primary);
  min-height: var(--touch-target-min);
}
.modal-actions { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg); }
.btn-cancel, .btn-save { flex: 1; padding: var(--spacing-sm); border-radius: var(--border-radius) !important; font-weight: 500; min-height: var(--touch-target-min); cursor: pointer; }
.btn-cancel { background: var(--bg-primary) !important; border: var(--border-light) !important; color: var(--text-primary) !important; }
.btn-save { background: var(--accent) !important; border: none !important; color: #fff !important; }
.loading, .empty { text-align: center; padding: var(--spacing-2xl); color: var(--text-muted); }
</style>
