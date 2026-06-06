<template>
  <router-view />
  <GlobalTabBar v-if="!$route.meta.hideTabBar" />
</template>

<script setup>
import GlobalTabBar from '@/components/GlobalTabBar.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 医疗品牌色系 - 洁净、专业、温暖 */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F7FA;
  --bg-tertiary: #EDF0F5;
  --bg-warm: #F0F4F7;

  /* 文字 - 清晰易读 */
  --text-primary: #1E2A3A;
  --text-secondary: #3D4A5A;
  --text-muted: #8B95A5;

  /* 主色 - 治愈蓝 */
  --accent: #2C7A9E;
  --accent-hover: #216080;
  --accent-light: #E6F0F6;
  --accent-soft: #B8D4E3;

  /* 暖色点缀 - 社区关怀 */
  --accent-warm: #D4956B;
  --accent-warm-hover: #C08056;
  --accent-warm-light: #F5EDE6;

  /* 语义色 - 医疗场景 */
  --danger: #D35D6E;
  --danger-light: #F5E6E8;
  --success: #3E9B7A;
  --success-light: #E6F3EF;
  --warning: #D4A050;
  --warning-light: #F5EDE0;

  /* 边框 - 干净线条 */
  --border: 1.5px solid #DCE0E6;
  --border-medium: 1px solid #E2E6EC;
  --border-light: 1px solid #EBEEF2;
  --border-soft: 1px solid rgba(44, 122, 158, 0.12);

  /* 阴影 - 干净层次 */
  --shadow-sm: 0 1px 3px rgba(30, 42, 58, 0.06);
  --shadow-md: 0 4px 12px rgba(30, 42, 58, 0.08);
  --shadow-lg: 0 8px 24px rgba(30, 42, 58, 0.10);
  --shadow-xl: 0 16px 48px rgba(30, 42, 58, 0.12);

  /* 圆角 - 柔和精准 */
  --border-radius-sm: 8px;
  --border-radius: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 24px;
  --border-radius-full: 9999px;

  /* 间距 */
  --spacing-xs: 6px;
  --spacing-sm: 10px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  --global-tab-bar-height: 72px;
  --search-bar-height: 0px;

  /* 字体 */
  --font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
  --font-size-4xl: 36px;

  --touch-target-min: 44px;

  /* 过渡 */
  --transition-spring: cubic-bezier(0.32, 0.72, 0, 1);
  --transition-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --transition-soft: cubic-bezier(0.4, 0, 0.2, 1);
}

html {
  font-size: var(--font-size-base);
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-warm);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--text-primary);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }
h4 { font-size: var(--font-size-lg); }
h5 { font-size: var(--font-size-base); }
h6 { font-size: var(--font-size-sm); }

a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}

a:hover {
  color: var(--accent-hover);
}

button, .el-button {
  border-radius: var(--border-radius) !important;
  font-family: var(--font-family);
  font-weight: 600;
  font-size: var(--font-size-base);
  border: 1.5px solid var(--border-medium) !important;
  color: var(--text-primary) !important;
  background: var(--bg-primary) !important;
  transition: all 0.25s var(--transition-soft);
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-lg);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

button:hover, .el-button:hover {
  background: var(--bg-secondary) !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

button:focus-visible, .el-button:focus-visible {
  outline: 3px solid var(--accent-light);
  outline-offset: 2px;
}

button.primary, .el-button--primary, .el-button[type="primary"] {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #FFFFFF !important;
}

button.primary:hover, .el-button--primary:hover {
  background: var(--accent-hover) !important;
  border-color: var(--accent-hover) !important;
}

button.primary-warm, .el-button--primary-warm {
  background: var(--accent-warm) !important;
  border-color: var(--accent-warm) !important;
  color: #FFFFFF !important;
}

button.primary-warm:hover, .el-button--primary-warm:hover {
  background: var(--accent-warm-hover) !important;
  border-color: var(--accent-warm-hover) !important;
}

input, select, textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1.5px solid var(--border-light);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.25s var(--transition-soft);
  box-shadow: var(--shadow-sm);
}

input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
  outline: none;
}

input::placeholder {
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  display: block;
}
</style>
