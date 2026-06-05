<template>
  <div class="admin-types">
    <div class="page-header">
      <h1 class="page-title">任务分类管理</h1>
      <button class="add-btn" @click="openAdd">+ 添加分类</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>图标</th>
            <th>名称</th>
            <th>排序</th>
            <th>子分类</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="type in types" :key="type.id">
            <td>{{ type.id }}</td>
            <td class="type-icon">{{ type.icon }}</td>
            <td><strong>{{ type.name }}</strong></td>
            <td>
              <input v-model.number="type.sort_order" class="sort-input" @change="updateType(type)" />
            </td>
            <td>
              <span :class="['tag', type.has_sub_types ? 'tag-yes' : 'tag-no']">
                {{ type.has_sub_types ? '是' : '否' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-edit" @click="openEdit(type)">编辑</button>
              <button class="btn-danger" @click="handleDelete(type)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="types.length === 0" class="empty">暂无分类</div>
    </div>

    <!-- 编辑/添加弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2 class="modal-title">{{ isEditing ? '编辑分类' : '添加分类' }}</h2>
        <div class="form-group">
          <label>图标 (emoji)</label>
          <input v-model="form.icon" class="form-input" />
        </div>
        <div class="form-group">
          <label>名称</label>
          <input v-model="form.name" class="form-input" />
        </div>
        <div class="form-group">
          <label>排序 (数字越小越靠前)</label>
          <input v-model.number="form.sort_order" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="form.has_sub_types" type="checkbox" />
            支持子分类
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-save" @click="saveType">{{ isEditing ? '保存' : '添加' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const types = ref([])
const loading = ref(true)

const showModal = ref(false)
const isEditing = ref(false)
const form = ref({ name: '', icon: '📋', sort_order: 0, has_sub_types: false })

const fetchTypes = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/types')
    if (res.code === 0) types.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  isEditing.value = false
  form.value = { name: '', icon: '📋', sort_order: 0, has_sub_types: false }
  showModal.value = true
}

const openEdit = (type) => {
  isEditing.value = true
  form.value = { ...type }
  showModal.value = true
}

const saveType = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  try {
    let res
    if (isEditing.value) {
      res = await request.put(`/admin/types/${form.value.id}`, form.value)
    } else {
      res = await request.post('/admin/types', form.value)
    }
    if (res.code === 0) {
      ElMessage.success(isEditing.value ? '更新成功' : '添加成功')
      showModal.value = false
      fetchTypes()
    }
  } catch (e) {
    console.error(e)
  }
}

const updateType = async (type) => {
  try {
    await request.put(`/admin/types/${type.id}`, { sort_order: type.sort_order })
    ElMessage.success('排序已更新')
  } catch (e) {
    console.error(e)
  }
}

const handleDelete = (type) => {
  ElMessageBox.confirm(`确定删除分类「${type.name}」？`, '确认删除', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error'
  }).then(async () => {
    const res = await request.delete(`/admin/types/${type.id}`)
    if (res.code === 0) { ElMessage.success('删除成功'); fetchTypes() }
  }).catch(() => {})
}

onMounted(fetchTypes)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: 0;
}

.add-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--accent) !important;
  color: #fff !important;
  border: none !important;
  border-radius: var(--border-radius) !important;
  cursor: pointer;
  font-weight: 500;
  font-size: var(--font-size-base);
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
}

.data-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-light);
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover { background: var(--bg-secondary); }

.type-icon { font-size: 24px; }

.sort-input {
  width: 60px;
  padding: 4px 8px;
  border: var(--border-light);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  text-align: center;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}
.tag-yes { background: var(--success-light); color: var(--success); }
.tag-no { background: var(--bg-secondary); color: var(--text-muted); }

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
.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: var(--font-size-base) !important;
}
.checkbox-label input { width: 18px; height: 18px; }
.modal-actions { display: flex; gap: var(--spacing-md); margin-top: var(--spacing-lg); }
.btn-cancel, .btn-save { flex: 1; padding: var(--spacing-sm); border-radius: var(--border-radius) !important; font-weight: 500; min-height: var(--touch-target-min); cursor: pointer; }
.btn-cancel { background: var(--bg-primary) !important; border: var(--border-light) !important; color: var(--text-primary) !important; }
.btn-save { background: var(--accent) !important; border: none !important; color: #fff !important; }
.loading, .empty { text-align: center; padding: var(--spacing-2xl); color: var(--text-muted); }
</style>
