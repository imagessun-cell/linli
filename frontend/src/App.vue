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
  /* 柔和温暖基底 - Editorial Luxury 氛围 */
  --bg-primary: #FDFBF7;
  --bg-secondary: #F5F0EB;
  --bg-tertiary: #EDE8E1;
  --bg-warm: #FAF6F0;

  /* 文字 - 高可读性但柔和 */
  --text-primary: #2D2D2D;
  --text-secondary: #4A4A4A;
  --text-muted: #7A7A7A;

  /* 主色 - 温暖柔和调 */
  --accent: #8B9D83;
  --accent-hover: #6F7F68;
  --accent-light: #E8EDE4;
  --accent-soft: #D4DDCE;

  /* 语义色 - 低饱和度 */
  --danger: #C47A7A;
  --danger-light: #F2E4E4;
  --success: #7A9E7A;
  --success-light: #E4EDE4;
  --warning: #C4A07A;
  --warning-light: #F0E8DE;

  /* 边框 - 柔和线条 */
  --border: 1.5px solid #D4CCC3;
  --border-medium: 1px solid #DED7D0;
  --border-light: 1px solid #E8E3DE;
  --border-soft: 1px solid rgba(139, 157, 131, 0.15);

  /* 阴影 - 极度柔化 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.07);

  /* 圆角 - 柔和曲线 */
  --border-radius-sm: 8px;
  --border-radius: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 24px;
  --border-radius-full: 9999px;

  /* 间距 - 宽敞舒适 */
  --spacing-xs: 6px;
  --spacing-sm: 10px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  /* 全局底部导航栏高度（含 padding-bottom 16px + border-top 1px） */
  --global-tab-bar-height: 81px;

  /* 搜索栏高度（padding 16px×2 + input 44px = 76px） */
  --search-bar-height: 76px;

  /* 字体 - 清晰大头 */
  --font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 13px;
  --font-size-sm: 15px;
  --font-size-base: 17px;
  --font-size-lg: 19px;
  --font-size-xl: 22px;
  --font-size-2xl: 26px;
  --font-size-3xl: 32px;
  --font-size-4xl: 40px;

  --touch-target-min: 48px;

  /* 过渡 - 柔和物理曲线 */
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
  line-height: 1.7;
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

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
h5 { font-size: var(--font-size-lg); }
h6 { font-size: var(--font-size-base); }

a {
  color: var(--accent);
  text-decoration: underline;
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
  border: var(--border-medium) !important;
  color: var(--text-primary) !important;
  background: var(--bg-primary) !important;
  transition: all 0.3s var(--transition-soft);
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-lg);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

button:hover, .el-button:hover {
  background: var(--bg-secondary) !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

button:focus-visible, .el-button:focus-visible {
  outline: 3px solid var(--accent);
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

input, select, textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-light);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s var(--transition-soft);
  box-shadow: var(--shadow-sm);
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
