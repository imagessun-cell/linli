<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo">
        <h1>🏠 邻里</h1>
        <p>社区养老服务</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" size="large" prefix-icon="Phone" />
        </el-form-item>
        <el-form-item prop="code">
          <el-input v-model="form.code" placeholder="请输入验证码" size="large" prefix-icon="Lock">
            <template #append>
              <el-button @click="sendCode" :disabled="countdown > 0">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" :loading="loading" native-type="submit">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="tips">
        <span>本地Mock验证码: 123456</span>
      </div>
      <div class="register-link">
        <el-link type="primary" @click="$router.push('/register')">还没有账号？立即注册</el-link>
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
const countdown = ref(0)

const form = reactive({
  phone: '',
  code: ''
})

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

let timer = null

const sendCode = () => {
  if (!form.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  ElMessage.success('验证码已发送 (本地Mock: 123456)')
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await userStore.login(form.phone, form.code)
        if (res.code === 0) {
          ElMessage.success('登录成功')
          router.push('/role-select')
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      } catch (e) {
        ElMessage.error(e.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 90%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.logo {
  text-align: center;
  margin-bottom: 40px;
}

.logo h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 8px;
}

.logo p {
  color: #999;
  font-size: 14px;
}

.tips {
  text-align: center;
  color: #ff9800;
  font-size: 12px;
  margin-bottom: 20px;
}

.register-link {
  text-align: center;
}
</style>