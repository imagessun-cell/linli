<template>
  <router-view />
  <GlobalTabBar />
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
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-tertiary: #EEEEEE;
  --text-primary: #000000;
  --text-secondary: #333333;
  --text-muted: #555555;
  --accent: #0052CC;
  --accent-hover: #003999;
  --accent-light: #E6F0FF;
  --danger: #CC0000;
  --danger-light: #FFE6E6;
  --success: #007700;
  --success-light: #E6FFE6;
  --warning: #CC6600;
  --warning-light: #FFF3E6;
  --border: 2px solid #000000;
  --border-medium: 1.5px solid #333333;
  --border-light: 1px solid #CCCCCC;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  --font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-size-xs: 14px;
  --font-size-sm: 16px;
  --font-size-base: 18px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-size-2xl: 30px;
  --font-size-3xl: 36px;
  --font-size-4xl: 48px;
  --touch-target-min: 48px;
  --border-radius: 4px;
}

html {
  font-size: var(--font-size-base);
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  padding-bottom: calc(60px + env(safe-area-inset-bottom));
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

button, .el-button, .el-button span {
  border-radius: var(--border-radius) !important;
  font-family: var(--font-family);
  font-weight: 600;
  font-size: var(--font-size-base);
  border: var(--border) !important;
  color: var(---bg-primar) !important;
  
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-lg);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

button:hover, .el-button:hover {
  background: var(--text-primary) !important;
  color: var(--bg-primary) !important;
}

button:focus-visible, .el-button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

button.primary, .el-button--primary, .el-button[type="primary"] {
  background: var(--text-primary) !important;
  color: var(--bg-primary) !important;
  border-color: var(--text-primary) !important;
}

button.primary:hover, .el-button--primary:hover {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
}

input, select, textarea {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-medium);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
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
