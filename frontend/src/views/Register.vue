<template>
  <div class="register-container">
    <div class="register-box">
      <div class="header">
        <h1>注册账号</h1>
        <p>加入邻里大家庭</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" size="large" prefix-icon="Phone" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item prop="role">
          <el-radio-group v-model="form.role" size="large">
            <el-radio-button :value="1">服务者</el-radio-button>
            <el-radio-button :value="2">用工方</el-radio-button>
            <el-radio-button :value="3">家属</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" native-type="submit">
            注册
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-link">
        <el-link type="primary" @click="$router.push('/login')">已有账号？立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  phone: '',
  password: '',
  role: 1
})

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }]
}

const roleLabels = { 1: '服务者', 2: '用工方', 3: '家属' }

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await userStore.register(form.phone, form.password, form.role)
        if (res.code === 0) {
          ElMessage.success(`注册成功，您是${roleLabels[form.role]}`)
          router.push('/role-select')
        } else {
          ElMessage.error(res.message || '注册失败')
        }
      } catch (e) {
        ElMessage.error(e.message || '注册失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-box {
  width: 90%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.header p {
  color: #999;
  font-size: 14px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}
</style>