<template>
  <div class="publish">
    <div class="header">
      <h2>发布任务</h2>
      <p>填写任务信息，等待服务者接单</p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="服务类型" prop="type">
        <el-select v-model="form.type" placeholder="选择服务类型" style="width: 100%">
          <el-option v-for="(name, index) in taskTypes" :key="index" :label="name" :value="index" />
        </el-select>
      </el-form-item>

      <el-form-item label="服务地址" prop="address">
        <el-input v-model="form.address" placeholder="请输入服务地址" />
      </el-form-item>

      <el-form-item label="开始时间" prop="start_time">
        <el-date-picker v-model="form.start_time" type="datetime" placeholder="选择开始时间" style="width: 100%" />
      </el-form-item>

      <el-form-item label="结束时间" prop="end_time">
        <el-date-picker v-model="form.end_time" type="datetime" placeholder="选择结束时间" style="width: 100%" />
      </el-form-item>

      <el-form-item label="服务时长">
        <span>{{ duration }} 分钟</span>
      </el-form-item>

      <el-form-item label="体力要求" prop="physical_level">
        <el-radio-group v-model="form.physical_level">
          <el-radio :label="1">轻度</el-radio>
          <el-radio :label="2">中度</el-radio>
          <el-radio :label="3">重度</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="预算" prop="budget">
        <el-input v-model.number="form.budget" type="number" placeholder="输入预算金额">
          <template #prepend>¥</template>
        </el-input>
      </el-form-item>

      <el-form-item label="特殊要求">
        <el-input v-model="form.special_requirements" type="textarea" :rows="3" placeholder="如有特殊要求请填写" />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.is_charity">公益任务</el-checkbox>
      </el-form-item>
    </el-form>

    <div class="actions">
      <el-button type="primary" size="large" :loading="loading" @click="handlePublish">
        发布任务
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref()
const loading = ref(false)

const taskTypes = ['', '陪诊', '陪聊', '小时保洁', '做饭', '接送', '看护', '跑腿', '助教', '其他']

const form = reactive({
  type: '',
  address: '',
  start_time: '',
  end_time: '',
  physical_level: 1,
  budget: '',
  special_requirements: '',
  is_charity: false
})

const rules = {
  type: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  address: [{ required: true, message: '请输入服务地址', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  budget: [{ required: true, message: '请输入预算', trigger: 'blur' }]
}

const duration = computed(() => {
  if (!form.start_time || !form.end_time) return 0
  const start = new Date(form.start_time).getTime()
  const end = new Date(form.end_time).getTime()
  return Math.round((end - start) / 60000)
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toISOString()
}

const handlePublish = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (duration.value <= 0) {
        ElMessage.warning('结束时间必须晚于开始时间')
        return
      }
      loading.value = true
      try {
        const res = await request.post('/employer/tasks', {
          ...form,
          start_time: formatTime(form.start_time),
          end_time: formatTime(form.end_time),
          duration_minutes: duration.value
        })
        if (res.code === 0) {
          ElMessage.success('任务发布成功')
          router.push('/employer/orders')
        }
      } catch (e) {
        ElMessage.error(e.message || '发布失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.publish {
  padding: 16px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.header p {
  color: #999;
  font-size: 14px;
}

.actions {
  margin-top: 30px;
}

.actions .el-button {
  width: 100%;
}
</style>