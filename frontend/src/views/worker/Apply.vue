<template>
  <div class="apply">
    <div class="header">
      <h2>陪诊师认证</h2>
      <p>完成认证后即可开始接单服务</p>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="年龄" prop="age">
        <el-input v-model.number="form.age" type="number" placeholder="50-65岁" />
      </el-form-item>

      <el-form-item label="所属社区" prop="community">
        <el-input v-model="form.community" placeholder="请输入您所在的社区" />
      </el-form-item>

      <el-form-item label="服务范围" prop="service_radius">
        <el-select v-model="form.service_radius" placeholder="选择服务范围">
          <el-option label="1公里" :value="1000" />
          <el-option label="2公里" :value="2000" />
          <el-option label="3公里" :value="3000" />
          <el-option label="5公里" :value="5000" />
        </el-select>
      </el-form-item>

      <el-form-item label="技能标签" prop="skills">
        <el-checkbox-group v-model="form.skills">
          <el-checkbox label="全程陪同">👣 全程陪同</el-checkbox>
          <el-checkbox label="挂号取药">💊 挂号取药</el-checkbox>
          <el-checkbox label="门诊陪护">🪑 门诊陪护</el-checkbox>
          <el-checkbox label="代为问诊">📝 代为问诊</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="紧急联系人" prop="emergency_contact_name">
        <el-input v-model="form.emergency_contact_name" placeholder="联系人姓名" />
      </el-form-item>

      <el-form-item label="紧急联系电话" prop="emergency_contact_phone">
        <el-input v-model="form.emergency_contact_phone" placeholder="联系人电话" />
      </el-form-item>
    </el-form>

    <div class="actions">
      <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
        提交认证
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  age: '',
  community: '',
  service_radius: 3000,
  skills: [],
  emergency_contact_name: '',
  emergency_contact_phone: ''
})

const rules = {
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  community: [{ required: true, message: '请输入所属社区', trigger: 'blur' }],
  skills: [{ required: true, message: '请选择至少一个技能', trigger: 'change' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (form.age < 50 || form.age > 65) {
        ElMessage.warning('年龄必须在50-65岁之间')
        return
      }
      loading.value = true
      try {
        const res = await request.post('/worker/apply', form)
        if (res.code === 0) {
          ElMessage.success('认证申请已提交，请等待审核')
          router.push('/worker/dashboard')
        }
      } catch (e) {
        ElMessage.error(e.message || '提交失败')
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(async () => {
  await userStore.fetchProfile()
  const worker = userStore.userInfo?.worker
  if (worker) {
    form.age = worker.age
    form.community = worker.community
    form.service_radius = worker.service_radius
    form.skills = JSON.parse(worker.skills || '[]')
    form.emergency_contact_name = worker.emergency_contact_name || ''
    form.emergency_contact_phone = worker.emergency_contact_phone || ''
  }
})
</script>

<style scoped>
.apply {
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