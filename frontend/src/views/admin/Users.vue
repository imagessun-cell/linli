<template>
  <div class="admin-users">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <div class="search-bar">
        <input
          v-model="keyword"
          placeholder="搜索手机号/昵称/姓名"
          class="search-input"
          @keyup.enter="fetchUsers"
        />
        <button class="search-btn" @click="fetchUsers">搜索</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>昵称</th>
            <th>手机号</th>
            <th>角色</th>
            <th>状态</th>
            <th>实名</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.nickname || '-' }}</td>
            <td>{{ user.phone }}</td>
            <td>
              <span :class="['tag', user.role === 1 ? 'tag-worker' : 'tag-employer']">
                {{ user.role === 1 ? '服务者' : '用工方' }}
              </span>
            </td>
            <td>
              <span :class="['tag', user.status === 0 ? 'tag-active' : 'tag-disabled']">
                {{ user.status === 0 ? '正常' : '禁用' }}
              </span>
            </td>
            <td>{{ user.real_name || '-' }}</td>
            <td>{{ user.created_at?.substring(0, 10) }}</td>
            <td class="actions">
              <button class="btn-edit" @click="openEdit(user)">编辑</button>
              <button class="btn-danger" @click="handleDelete(user)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="total === 0" class="empty">暂无用户</div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
      <div class="modal">
        <h2 class="modal-title">编辑用户 - {{ editForm.nickname }}</h2>
        <div class="form-group">
          <label>昵称</label>
          <input v-model="editForm.nickname" class="form-input" />
        </div>
        <div class="form-group">
          <label>手机号</label>
          <input v-model="editForm.phone" class="form-input" />
        </div>
        <div class="form-group">
          <label>真实姓名</label>
          <input v-model="editForm.real_name" class="form-input" />
        </div>
        <div class="form-group">
          <label>角色</label>
          <select v-model="editForm.role" class="form-input">
            <option :value="1">服务者</option>
            <option :value="2">用工方</option>
          </select>
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="editForm.status" class="form-input">
            <option :value="0">正常</option>
            <option :value="1">禁用</option>
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

const users = ref([])
const total = ref(0)
const loading = ref(true)
const keyword = ref('')

const showEdit = ref(false)
const editForm = ref({})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/users', { params: { keyword: keyword.value, limit: 100 } })
    if (res.code === 0) {
      users.value = res.data.users
      total.value = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openEdit = (user) => {
  editForm.value = { ...user }
  showEdit.value = true
}

const saveEdit = async () => {
  try {
    const res = await request.put(`/admin/users/${editForm.value.id}`, editForm.value)
    if (res.code === 0) {
      ElMessage.success('更新成功')
      showEdit.value = false
      fetchUsers()
    }
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = (user) => {
  ElMessageBox.confirm(`确定删除用户「${user.nickname || user.phone}」？此操作不可撤销。`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'error'
  }).then(async () => {
    const res = await request.delete(`/admin/users/${user.id}`)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchUsers()
    }
  }).catch(() => {})
}

onMounted(fetchUsers)
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
  color: var(--text-primary);
}

.search-bar {
  display: flex;
  gap: var(--spacing-sm);
}

.search-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  min-width: 250px;
  min-height: var(--touch-target-min);
  background: var(--bg-primary);
}

.search-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--accent) !important;
  color: #fff !important;
  border: none !important;
  border-radius: var(--border-radius) !important;
  cursor: pointer;
  font-weight: 500;
  min-height: var(--touch-target-min);
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
  color: var(--text-primary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover {
  background: var(--bg-secondary);
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.tag-worker { background: var(--accent-light); color: var(--accent); }
.tag-employer { background: #FFF0EC; color: #E94F3D; }
.tag-active { background: var(--success-light); color: var(--success); }
.tag-disabled { background: var(--danger-light); color: var(--danger); }

.actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-edit, .btn-danger {
  padding: 4px 12px;
  font-size: var(--font-size-xs);
  border: var(--border-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  min-height: 32px;
  background: var(--bg-primary);
  transition: all 0.2s;
}

.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-danger:hover { border-color: var(--danger); color: var(--danger); }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(45,45,45,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background: var(--bg-primary);
  min-height: var(--touch-target-min);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn-cancel, .btn-save {
  flex: 1;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius) !important;
  font-weight: 500;
  min-height: var(--touch-target-min);
  cursor: pointer;
}

.btn-cancel {
  background: var(--bg-primary) !important;
  border: var(--border-light) !important;
  color: var(--text-primary) !important;
}

.btn-save {
  background: var(--accent) !important;
  border: none !important;
  color: #fff !important;
}

.loading, .empty {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}
</style>
