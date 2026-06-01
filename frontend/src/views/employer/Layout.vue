<template>
  <div class="employer-layout">
    <div class="main-content">
      <router-view />
    </div>
    <div class="tab-bar">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.path"
        :class="['tab-item', { active: active === index }]"
        @click="onTabChange(index)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const active = ref(0)

const tabs = [
  { label: '首页', icon: '◇', path: '/employer/dashboard' },
  { label: '发单', icon: '＋', path: '/employer/publish' },
  { label: '我的', icon: '○', path: '/employer/profile' }
]

const routeMap = {
  '/employer/dashboard': 0,
  '/employer/publish': 1,
  '/employer/profile': 2
}

watch(() => route.path, (path) => {
  active.value = routeMap[path] ?? 0
}, { immediate: true })

const onTabChange = (index) => {
  router.push(tabs[index].path)
}
</script>

<style scoped>
.employer-layout {
  min-height: 100vh;
  background: #FFFFFF;
  padding-bottom: 70px;
}

.main-content {
  padding: 0;
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  background: #FFFFFF;
  border-top: 2px solid #000;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
}

.tab-item.active .tab-icon {
  font-weight: 700;
}

.tab-item.active .tab-label {
  color: #0066FF;
  font-weight: 700;
}

.tab-icon {
  font-size: 18px;
  font-weight: 400;
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
}
</style>