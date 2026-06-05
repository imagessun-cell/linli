<template>
  <div class="register-container">
    <header class="register-header">
      <h1>LINLI</h1>
      <p class="subtitle">注册邻里账号</p>
    </header>

    <main class="register-box">
      <form @submit.prevent="handleRegister" aria-label="注册表单">
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
          />
        </div>

        <div class="form-group">
          <label for="password-input">密码</label>
          <input
            id="password-input"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
            autocomplete="new-password"
          />
        </div>

        <fieldset class="form-group role-fieldset">
          <legend class="role-legend">身份</legend>
          <div class="role-options">
            <label
              v-for="r in roles"
              :key="r.value"
              class="role-option"
              :class="{ active: form.role === r.value }"
            >
              <input
                type="radio"
                v-model="form.role"
                :value="r.value"
                :name="'role'"
              />
              <span>{{ r.label }}</span>
            </label>
          </div>
        </fieldset>

        <button type="submit" class="submit-btn" :disabled="loading" aria-busy="loading">
          {{ loading ? '注册中，请稍候...' : '注册' }}
        </button>
      </form>

      <nav class="login-link" aria-label="登录链接">
        <span class="text-muted">已有账号？</span>
        <router-link to="/login">立即登录</router-link>
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

const form = reactive({
  phone: '',
  password: '',
  role: 1
})

const roles = [
  { label: '陪诊师', value: 1 },
  { label: '就诊人', value: 2 }
]

const roleLabels = { 1: '陪诊师', 2: '就诊人' }

const handleRegister = async () => {
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
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--bg-warm);
}

.register-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.register-header h1 {
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

.register-box {
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

.role-fieldset {
  border: none;
  padding: 0;
  margin: 0 0 var(--spacing-lg);
}

.role-legend {
  display: block;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.role-options {
  display: flex;
  gap: var(--spacing-md);
}

.role-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  border: var(--border-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s var(--transition-soft);
  min-height: var(--touch-target-min);
  background: var(--bg-primary);
  color: var(--text-muted);
}

.role-option input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.role-option:hover {
  border-color: var(--accent-soft);
  background: var(--accent-light);
  color: var(--accent);
}

.role-option:focus-within {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.role-option.active {
  background: var(--accent) !important;
  color: #FFFFFF !important;
  border-color: var(--accent) !important;
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

.login-link {
  margin-top: var(--spacing-lg);
  text-align: center;
  font-size: var(--font-size-base);
}

.login-link .text-muted {
  color: var(--text-muted);
}

.login-link a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: underline;
  margin-left: var(--spacing-xs);
  transition: color 0.3s var(--transition-soft);
}

.login-link a:hover {
  color: var(--accent-hover);
}

.login-link a:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
</style>
