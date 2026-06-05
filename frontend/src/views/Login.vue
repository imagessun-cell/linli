<template>
  <div class="login-container">
    <header class="login-header">
      <h1>LINLI</h1>
      <p class="subtitle">邻里守候，就诊无忧</p>
    </header>

    <main class="login-box">
      <form @submit.prevent="handleLogin" aria-label="登录表单">
        <div class="form-group">
          <label for="phone-input">手机号</label>
          <input
            id="phone-input"
            v-model="form.phone"
            type="tel"
            placeholder="请输入手机号"
            required
            autocomplete="tel"
            inputmode="numeric"
            aria-describedby="phone-hint"
          />
        </div>

        <div class="form-group">
          <label for="code-input">验证码</label>
          <div class="code-input">
            <input
              id="code-input"
              v-model="form.code"
              type="text"
              placeholder="请输入验证码"
              required
              autocomplete="one-time-code"
              inputmode="numeric"
            />
            <button
              type="button"
              class="code-btn"
              @click="sendCode"
              :disabled="countdown > 0"
              :aria-describedby="countdown > 0 ? 'countdown-hint' : undefined"
            >
              {{ countdown > 0 ? `${countdown}秒` : '获取' }}
            </button>
          </div>
          <p id="countdown-hint" class="sr-only" v-if="countdown > 0">
            验证码已发送，请在{{ countdown }}秒后重试
          </p>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading" aria-busy="loading">
          {{ loading ? '登录中，请稍候...' : '登录' }}
        </button>
      </form>

      <aside class="mock-notice" role="note">
        本地Mock验证码: <strong>123456</strong>
      </aside>

      <nav class="register-link" aria-label="注册链接">
        <span class="text-muted">还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const countdown = ref(0)

const form = reactive({
  phone: '',
  code: ''
})

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
  ElMessage.success('验证码已发送')
}

const handleLogin = async () => {
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
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--bg-warm);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.login-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.subtitle {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  margin: 0;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  border: var(--border-light);
  box-shadow: var(--shadow-md);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-group input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  border: var(--border-light);
  background: var(--bg-primary);
  outline: none;
  border-radius: var(--border-radius);
  transition: all 0.3s var(--transition-soft);
  min-height: var(--touch-target-min);
  box-shadow: var(--shadow-sm);
}

.form-group input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.code-input {
  display: flex;
  gap: var(--spacing-md);
}

.code-input input {
  flex: 1;
}

.code-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: 500;
  background: var(--accent) !important;
  color: #FFFFFF !important;
  border: none !important;
  cursor: pointer;
  border-radius: var(--border-radius) !important;
  transition: all 0.3s var(--transition-soft);
  min-width: 100px;
  min-height: var(--touch-target-min);
}

.code-btn:hover:not(:disabled) {
  background: var(--accent-hover) !important;
}

.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.submit-btn {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  background: var(--accent) !important;
  color: #FFFFFF !important;
  border: none !important;
  cursor: pointer;
  border-radius: var(--border-radius) !important;
  min-height: var(--touch-target-min);
  transition: all 0.3s var(--transition-soft);
  margin-top: var(--spacing-md);
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-hover) !important;
}

.submit-btn:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mock-notice {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: var(--border-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  text-align: center;
}

.mock-notice strong {
  color: var(--accent);
  font-weight: 600;
}

.register-link {
  margin-top: var(--spacing-lg);
  text-align: center;
  font-size: var(--font-size-base);
}

.register-link .text-muted {
  color: var(--text-muted);
}

.register-link a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: underline;
  margin-left: var(--spacing-xs);
  transition: color 0.3s var(--transition-soft);
}

.register-link a:hover {
  color: var(--accent-hover);
}

.register-link a:hover {
  color: var(--accent-hover);
}

.register-link a:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
</style>
