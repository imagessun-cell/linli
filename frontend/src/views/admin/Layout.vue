<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h1>管理后台</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="back-btn" @click="$router.push('/')">
          ← 返回首页
        </button>
      </div>
    </aside>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/admin', icon: '📊', label: '仪表盘' },
  { path: '/admin/users', icon: '👥', label: '用户管理' },
  { path: '/admin/tasks', icon: '📋', label: '任务管理' },
  { path: '/admin/types', icon: '🏷️', label: '分类管理' }
]
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-warm);
}

.admin-sidebar {
  width: 220px;
  background: var(--bg-primary);
  border-right: var(--border-light);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: var(--border-light);
}

.sidebar-header h1 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: all 0.2s;
  min-height: var(--touch-target-min);
}

.nav-item:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: var(--border-light);
}

.back-btn {
  width: 100%;
  padding: var(--spacing-sm);
  background: transparent;
  border: var(--border-light);
  border-radius: var(--border-radius);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s;
  min-height: var(--touch-target-min);
}

.back-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.admin-main {
  margin-left: 220px;
  flex: 1;
  padding: var(--spacing-xl);
  min-height: 100vh;
}
</style>
