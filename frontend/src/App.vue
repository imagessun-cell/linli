<template>
  <router-view v-slot="{ Component, route }">
    <Transition name="ios-page" appear>
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </router-view>
  <GlobalTabBar v-if="showGlobalTabBar" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalTabBar from '@/components/GlobalTabBar.vue'

const route = useRoute()
const primaryTabRouteNames = new Set(['Home', 'WorkerSquare', 'MessageList', 'Profile'])
const showGlobalTabBar = computed(() => {
  return !route.meta.hideTabBar && primaryTabRouteNames.has(route.name)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 邻里品牌色系 - 用 logo 暖红做少量强调，整体保持克制、清透 */
  --bg-primary: #FFFFFF;
  --bg-secondary: #FBF8F4;
  --bg-tertiary: #FBE9E4;
  --bg-warm: #F7F3EE;
  --bg-panel: #FFFDFB;
  --bg-elevated: rgba(255, 253, 251, 0.92);

  /* 文字 - 层级更明确，避免大片深色压迫 */
  --text-primary: #3F332E;
  --text-secondary: #6F5C53;
  --text-muted: #9A877D;

  /* 主色 - logo 暖红 */
  --accent: #D94A37;
  --accent-hover: #B83A2C;
  --accent-light: #FBE9E4;
  --accent-soft: #E8B8AB;

  /* 辅色 - logo 暖橙 */
  --accent-warm: #E79A22;
  --accent-warm-hover: #C77C12;
  --accent-warm-light: #FBF0DA;

  /* 语义色 - 医疗场景 */
  --danger: #A8473B;
  --danger-light: #F8E6E1;
  --success: #9A6A2D;
  --success-light: #FBF0DA;
  --warning: #B87919;
  --warning-light: #FBF0DA;

  /* 边框 - 细线比阴影承担更多层级 */
  --line: #E6DDD6;
  --line-soft: #EEE6DF;
  --border: 1px solid var(--line);
  --border-medium: 1px solid var(--line);
  --border-light: 1px solid var(--line-soft);
  --border-soft: 1px solid rgba(217, 74, 55, 0.12);

  /* 阴影 - 减少厚重感，保留轻微悬浮 */
  --shadow-sm: 0 1px 2px rgba(64, 48, 40, 0.04);
  --shadow-md: 0 8px 22px rgba(64, 48, 40, 0.055);
  --shadow-lg: 0 14px 34px rgba(64, 48, 40, 0.08);
  --shadow-xl: 0 20px 48px rgba(64, 48, 40, 0.10);

  /* 圆角 - 柔和精准 */
  --border-radius-sm: 8px;
  --border-radius: 10px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-full: 9999px;

  /* 间距 */
  --spacing-xs: 6px;
  --spacing-sm: 10px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  --global-tab-bar-height: 78px;
  --search-bar-height: 0px;

  /* 字体 */
  --font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --font-size-xs: 13px;
  --font-size-sm: 15px;
  --font-size-base: 17px;
  --font-size-lg: 19px;
  --font-size-xl: 22px;
  --font-size-2xl: 26px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;

  --touch-target-min: 52px;

  /* 过渡 */
  --transition-spring: cubic-bezier(0.32, 0.72, 0, 1);
  --transition-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --transition-soft: cubic-bezier(0.4, 0, 0.2, 1);
}

html {
  font-size: var(--font-size-base);
  scroll-behavior: smooth;
  overscroll-behavior-y: contain;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-warm);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

#app {
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  letter-spacing: 0;
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
  border-radius: 12px !important;
  font-family: var(--font-family);
  font-weight: 700;
  font-size: var(--font-size-base);
  border: 1px solid var(--line) !important;
  color: var(--text-primary) !important;
  background: #FFFDFB !important;
  transition: all 0.25s var(--transition-soft);
  min-height: var(--touch-target-min);
  padding: var(--spacing-sm) var(--spacing-lg);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

button:hover, .el-button:hover {
  background: var(--accent-light) !important;
  border-color: var(--accent-soft) !important;
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
  padding: 12px var(--spacing-md);
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--bg-panel);
  color: var(--text-primary);
  transition: all 0.25s var(--transition-soft);
  box-shadow: none;
}

input:focus, select:focus, textarea:focus {
  outline: none;
}

input::placeholder {
  color: var(--text-muted);
  font-size: var(--font-size-base);
}

label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  display: block;
}

.ios-page-enter-active,
.ios-page-leave-active {
  transition:
    transform 0.34s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.24s ease;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform, opacity;
}

.ios-page-enter-active {
  position: relative;
  z-index: 1;
}

.ios-page-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 0;
  pointer-events: none;
}

.ios-page-enter-from {
  opacity: 0.96;
  transform: translate3d(28px, 0, 0);
}

.ios-page-enter-to,
.ios-page-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.ios-page-leave-to {
  opacity: 0.92;
  transform: translate3d(-18px, 0, 0) scale(0.995);
}

.task-card,
.profile-entry,
.info-section,
.worker-card,
.conversation-item,
.sub-type-card,
.training-card,
.flow-card {
  animation: surface-rise 0.18s var(--transition-smooth) both;
  will-change: transform, opacity;
}

@keyframes surface-rise {
  from {
    opacity: 0.94;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@supports (animation-timeline: view()) {
  .task-card,
  .profile-entry,
  .info-section,
  .worker-card,
  .conversation-item,
  .sub-type-card,
  .training-card,
  .flow-card {
    animation-name: surface-scroll-rise;
    animation-duration: 1ms;
    animation-fill-mode: both;
    animation-timeline: view();
    animation-range: entry 0% cover 22%;
  }

  @keyframes surface-scroll-rise {
    from {
      opacity: 0.9;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* 全局精修皮肤：把旧页面统一收敛到浅底、细线、轻阴影的品牌体系 */
#app .home-container,
#app .worker-square,
#app .message-list-page,
#app .chat-room,
#app .profile-container,
#app .publish,
#app .apply,
#app .orders,
#app .my-tasks,
#app .training-page,
#app .task-detail-page {
  background:
    linear-gradient(180deg, #F7F3EE 0%, #FBF8F4 42%, #F8F1EB 100%) !important;
  color: var(--text-primary) !important;
}

#app .hero-panel,
#app .profile-header,
#app .detail-header,
#app .tasks-hero,
#app .orders-hero,
#app .training-hero,
#app .hero-section {
  background:
    linear-gradient(180deg, #FFFCF8 0%, #F6EEE8 100%) !important;
  color: var(--text-primary) !important;
  border-bottom: 1px solid var(--line-soft) !important;
  box-shadow: none !important;
}

#app .hero-panel::before {
  background: rgba(217, 74, 55, 0.08) !important;
}

#app .profile-header,
#app .tasks-hero,
#app .orders-hero,
#app .training-hero,
#app .hero-section {
  padding-top: 16px !important;
  padding-bottom: 20px !important;
}

#app .tasks-hero h1,
#app .orders-hero h1,
#app .training-hero h1,
#app .hero-title,
#app .header-label,
#app .nickname {
  color: var(--text-primary) !important;
}

#app .tasks-hero p,
#app .orders-hero p,
#app .training-hero p,
#app .hero-meta,
#app .profile-meta,
#app .preview,
#app .subtitle {
  color: var(--text-secondary) !important;
}

#app .hero-top span,
#app .orders-hero span,
#app .tasks-hero span,
#app .article-tags span,
#app .sub-type-tag,
#app .hero-type-plain,
#app .task-type,
#app .skill-tag,
#app .summary-pill,
#app .intro-kicker,
#app .entry-inline-tag,
#app .order-status.primary,
#app .order-content .time {
  background: var(--accent-light) !important;
  color: var(--accent) !important;
}

#app .task-date,
#app .step-section-label,
#app .order-status.warning,
#app .order-status.success,
#app .insurance-badge {
  background: var(--accent-warm-light) !important;
  color: #7F551F !important;
}

#app .back-btn,
#app .hero-back,
#app .header-icon-btn,
#app .close-btn,
#app .map-info-close {
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(255, 253, 251, 0.92) !important;
  border: 1px solid var(--line) !important;
  color: var(--accent) !important;
  border-radius: 13px !important;
  box-shadow: none !important;
  font-size: 22px !important;
  line-height: 1 !important;
  font-weight: 900 !important;
}

#app .header-icon-btn:hover,
#app .back-btn:hover,
#app .hero-back:hover,
#app .close-btn:hover,
#app .map-info-close:hover {
  background: var(--accent-light) !important;
  border-color: var(--accent-soft) !important;
  color: var(--accent) !important;
}

#app .search-input,
#app input,
#app textarea,
#app select,
#app .el-input__wrapper,
#app .el-textarea__inner,
#app .el-date-editor {
  background: var(--bg-panel) !important;
  border-color: var(--line) !important;
  box-shadow: 0 0 0 1px var(--line) inset !important;
}

#app .search-input:focus,
#app input:focus,
#app textarea:focus,
#app .el-input__wrapper.is-focus,
#app .el-date-editor.is-active {
  border-color: var(--accent-soft) !important;
  box-shadow: 0 0 0 1px var(--accent-soft) inset, 0 0 0 4px rgba(217, 74, 55, 0.08) !important;
}

#app .publish .el-form-item__label,
#app .apply .el-form-item__label {
  color: var(--text-secondary) !important;
  font-weight: 800 !important;
}

#app .location-suggestions,
#app .hospital-suggestions,
#app .dept-suggestions,
#app .suggestion-list {
  background: var(--bg-panel) !important;
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  box-shadow: var(--shadow-lg) !important;
}

#app .suggestion-item:hover,
#app .suggestion-item.highlighted,
#app .suggestion-item.active,
#app .dept-suggestion-item:hover,
#app .dept-suggestion-item.highlighted {
  background: var(--accent-light) !important;
  color: var(--accent) !important;
}

#app .search-bar,
#app .filter-bar {
  background: transparent !important;
}

#app .sort-bar,
#app .role-tabs,
#app .el-tabs__header {
  background: rgba(255, 253, 251, 0.9) !important;
  border: 1px solid var(--line-soft) !important;
  box-shadow: var(--shadow-sm) !important;
  backdrop-filter: blur(12px);
}

#app .sort-tabs button.active,
#app .view-toggle button.active,
#app .role-tab.active,
#app .el-tabs__item.is-active {
  background: var(--accent-light) !important;
  color: var(--accent) !important;
}

#app .task-card,
#app .worker-card,
#app .conversation-list,
#app .conversation-item,
#app .profile-entry,
#app .info-section,
#app .order-card,
#app .guide-card,
#app .flow-step,
#app .training-intro,
#app .article-hero,
#app .section,
#app .sub-type-section,
#app .publish .el-form-item,
#app .apply .el-form-item,
#app .patient-map-card,
#app .service-notice,
#app .dialog-content,
#app .message-overview,
#app .publisher-card {
  background: var(--bg-panel) !important;
  border: 1px solid var(--line-soft) !important;
  border-radius: 16px !important;
  box-shadow: var(--shadow-md) !important;
}

#app .task-card,
#app .worker-card,
#app .profile-entry,
#app .order-card,
#app .guide-card,
#app .flow-step,
#app .section,
#app .sub-type-section,
#app .publish .el-form-item,
#app .apply .el-form-item {
  padding: 18px !important;
}

#app .task-card:hover,
#app .worker-card:hover,
#app .conversation-item:hover,
#app .profile-entry:hover,
#app .order-card:hover,
#app .guide-card:hover,
#app .sub-type-card:hover {
  border-color: rgba(217, 74, 55, 0.24) !important;
  box-shadow: var(--shadow-lg) !important;
  transform: translateY(-1px);
}

#app .task-fact,
#app .stat-item,
#app .info-row,
#app .entry-metric,
#app .step-action-card,
#app .special-requirements,
#app .attachment-chip,
#app .quick-chip,
#app .emoji-btn,
#app .voice-hold-btn,
#app .media-action {
  background: var(--bg-secondary) !important;
  border: 1px solid var(--line-soft) !important;
  box-shadow: none !important;
}

#app .section-title,
#app .task-title,
#app .worker-name,
#app .entry-copy strong,
#app .guide-copy strong,
#app .step-title-block h2,
#app .order-content h4 {
  color: var(--text-primary) !important;
  letter-spacing: 0 !important;
}

#app .task-title {
  color: var(--text-primary) !important;
  font-size: 23px !important;
  line-height: 1.34 !important;
}

#app .task-budget,
#app .amount,
#app .value.highlight,
#app .stat-value,
#app .duration-display,
#app .budget-unit,
#app .price-hint,
#app .dialog-amount,
#app .guide-arrow,
#app .route-nav-link,
#app .credit-value,
#app .insurance-badge__detail {
  color: var(--accent) !important;
}

#app .detail-hint,
#app .grab-btn,
#app .send-btn,
#app .wallet-btn.primary,
#app .login-btn,
#app .dialog-btn.primary,
#app .actions .el-button,
#app .submit-btn,
#app .step-number,
#app .voice-hold-btn.recording {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #fff !important;
}

#app .detail-hint:hover,
#app .grab-btn:hover,
#app .send-btn:hover,
#app .wallet-btn.primary:hover,
#app .login-btn:hover,
#app .dialog-btn.primary:hover,
#app .actions .el-button:hover,
#app .submit-btn:hover {
  background: var(--accent-hover) !important;
  border-color: var(--accent-hover) !important;
  color: #fff !important;
}

#app .sub-type-card {
  background: #FFFCF8 !important;
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}

#app .sub-type-card.selected {
  background: var(--accent-light) !important;
  border-color: var(--accent) !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

#app .sub-icon,
#app .media-action-icon,
#app .mode-toggle,
#app .plus-toggle {
  background: var(--accent-light) !important;
  color: var(--accent) !important;
  border-color: transparent !important;
}

#app .sub-type-card.selected .sub-icon,
#app .sub-type-card.selected .check-mark {
  background: #fff !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

#app .meta-chip {
  background: rgba(255, 253, 251, 0.72) !important;
  border: 1px solid rgba(230, 221, 214, 0.9) !important;
  color: var(--text-primary) !important;
}

#app .meta-chip em,
#app .label,
#app .stat-label,
#app .entry-copy span,
#app .guide-copy span,
#app .worker-location,
#app .order-no,
#app .order-content p,
#app .detail-row span,
#app .step-title-block span,
#app .bubble .time {
  color: var(--text-muted) !important;
}

#app .avatar-wrapper,
#app .publisher-avatar,
#app .conversation-avatar {
  border-color: transparent !important;
  box-shadow: none !important;
}

#app .actions,
#app .input-area {
  background: rgba(255, 253, 251, 0.96) !important;
  border-top: 1px solid var(--line-soft) !important;
  box-shadow: 0 -8px 22px rgba(64, 48, 40, 0.06) !important;
}

#app .bubble {
  background: var(--bg-panel) !important;
  border: 1px solid var(--line-soft) !important;
  box-shadow: var(--shadow-sm) !important;
}

#app .message-item.mine .bubble {
  background: var(--accent) !important;
  border-color: transparent !important;
  color: #fff !important;
}

#app .message-item.mine .bubble .time,
#app .chat-room .message-item.mine .bubble .time {
  color: rgba(255, 255, 255, 0.86) !important;
}

#app .chat-room .input-area .el-input__wrapper {
  border: 1px solid var(--line) !important;
  border-radius: 16px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

#app .chat-room .input-area .el-input__inner,
#app .chat-room .input-area input.el-input__inner {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}

#app .chat-room .media-action,
#app .chat-room .media-action:hover,
#app .chat-room .media-action:disabled {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

#app .chat-room .media-action-icon {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

#app .media-action,
#app .media-action-label {
  color: var(--accent) !important;
}

#app .global-tab-bar {
  background: rgba(255, 253, 251, 0.96) !important;
  border-top: 1px solid var(--line-soft) !important;
  box-shadow: 0 -6px 20px rgba(64, 48, 40, 0.05) !important;
}

#app .linli-logo-mark.variant-full {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

#app .publish > .detail-header,
#app .apply > .detail-header {
  min-height: 44px !important;
  padding: 0 !important;
  margin-bottom: 12px !important;
  background: transparent !important;
  border-bottom: none !important;
}

#app .message-list-page .conversation-list {
  display: grid !important;
  gap: 10px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
}

#app .message-list-page .conversation-item {
  border-bottom: 1px solid var(--line-soft) !important;
}

#app .skill-tag {
  border: 1px solid rgba(217, 74, 55, 0.12) !important;
  border-radius: 999px !important;
}

#app .worker-stats {
  border: none !important;
}

#app .worker-stats .stat-item {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

#app .publish .location-input-wrapper,
#app .publish .hospital-input-wrapper,
#app .publish .dept-input-wrapper,
#app .publish .location-field-shell,
#app .publish .time-picker-shell,
#app .publish .budget-slider-input-wrap,
#app .publish .budget-slider-input .el-slider__input,
#app .publish .budget-slider-input .el-input-number {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

#app .publish .el-input__wrapper,
#app .publish .el-textarea__inner,
#app .publish .el-date-editor,
#app .publish .time-range-picker,
#app .publish .budget-slider-input .el-slider__input .el-input__wrapper {
  border: 1px solid var(--line) !important;
  box-shadow: none !important;
}

#app .publish .el-input__wrapper:hover,
#app .publish .el-textarea__inner:hover,
#app .publish .el-date-editor:hover,
#app .publish .time-range-picker:hover,
#app .publish .budget-slider-input .el-slider__input .el-input__wrapper:hover {
  border-color: var(--accent-soft) !important;
  box-shadow: none !important;
}

#app .publish .el-input__wrapper.is-focus,
#app .publish .el-date-editor.is-active,
#app .publish .time-range-picker.is-active,
#app .publish .budget-slider-input .el-slider__input .el-input__wrapper.is-focus {
  border-color: var(--accent) !important;
  box-shadow: none !important;
}

#app .publish .service-time-fields {
  width: 100% !important;
  display: grid !important;
  gap: 10px !important;
}

#app .publish .service-time-row {
  min-height: 58px !important;
  display: grid !important;
  grid-template-columns: 52px minmax(0, 1fr) !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 0 12px !important;
  border: 1px solid var(--line) !important;
  border-radius: 13px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

#app .publish .service-time-label {
  color: var(--text-muted) !important;
  font-size: 14px !important;
  font-weight: 800 !important;
}

#app .publish .service-time-picker {
  width: 100% !important;
  min-width: 0 !important;
}

#app .publish .service-time-picker.el-date-editor,
#app .publish .service-time-picker .el-input__wrapper {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 56px !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

#app .publish .service-time-picker .el-input__prefix,
#app .publish .service-time-picker .el-input__suffix {
  display: none !important;
}

#app .publish .service-time-picker .el-input__inner {
  min-height: 56px !important;
  line-height: 56px !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  text-align: right !important;
}

#app .publish .service-time-row:focus-within {
  border-color: var(--accent) !important;
}

#app .publish .el-form-item {
  margin-bottom: 12px !important;
  padding: 16px !important;
  background: var(--bg-panel) !important;
  border: 1px solid var(--line-soft) !important;
  border-radius: 16px !important;
  box-shadow: var(--shadow-md) !important;
}

#app .publish .el-form-item__label {
  padding-left: 2px !important;
}

#app .publish .el-input__inner,
#app .publish .el-date-editor .el-input__inner,
#app .publish .service-time-picker .el-input__inner,
#app .publish .budget-slider-input .el-input__inner,
#app .publish .el-range-input,
#app .publish input.el-input__inner {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}

#app .publish .el-input__wrapper::before,
#app .publish .el-input__wrapper::after,
#app .publish .el-textarea__inner::before,
#app .publish .el-textarea__inner::after {
  display: none !important;
}

#app .apply .el-input__wrapper,
#app .apply .el-textarea__inner,
#app .apply .budget-slider-input .el-slider__input .el-input__wrapper {
  border: 1px solid var(--line) !important;
  border-radius: 13px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

#app .apply .el-input__wrapper:hover,
#app .apply .el-input__wrapper.is-focus,
#app .apply .budget-slider-input .el-slider__input .el-input__wrapper:hover,
#app .apply .budget-slider-input .el-slider__input .el-input__wrapper.is-focus {
  border-color: var(--accent-soft) !important;
  box-shadow: none !important;
}

#app .apply .el-input__inner,
#app .apply .budget-slider-input .el-input__inner,
#app .apply input.el-input__inner {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}

#app .apply .budget-slider-input-wrap,
#app .apply .budget-slider-input .el-slider__input,
#app .apply .budget-slider-input .el-input-number {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

#app .apply .el-input__wrapper::before,
#app .apply .el-input__wrapper::after {
  display: none !important;
}

/* 全局弹层统一：浅底、细线、单层输入框 */
.el-overlay {
  background-color: rgba(64, 48, 40, 0.32) !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.el-dialog {
  width: min(92vw, 430px) !important;
  border-radius: 20px !important;
  border: 1px solid var(--line-soft) !important;
  background: var(--bg-panel) !important;
  box-shadow: 0 18px 48px rgba(64, 48, 40, 0.18) !important;
  overflow: hidden;
}

.el-dialog__header {
  margin: 0 !important;
  padding: 18px 18px 10px !important;
}

.el-dialog__title {
  color: var(--text-primary) !important;
  font-size: 21px !important;
  line-height: 1.25 !important;
  font-weight: 900 !important;
}

.el-dialog__headerbtn {
  top: 12px !important;
  right: 12px !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  border-radius: 13px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: rgba(255, 253, 251, 0.92) !important;
  border: 1px solid var(--line) !important;
  color: var(--accent) !important;
  box-shadow: none !important;
}

.el-dialog__headerbtn:hover {
  background: var(--accent-light) !important;
  border-color: var(--accent-soft) !important;
}

.el-dialog__headerbtn .el-dialog__close {
  color: var(--accent) !important;
  font-size: 18px !important;
  font-weight: 900 !important;
}

.el-dialog__body {
  padding: 10px 18px 16px !important;
  color: var(--text-primary) !important;
}

.el-dialog__footer {
  padding: 12px 18px calc(16px + env(safe-area-inset-bottom)) !important;
  border-top: 1px solid var(--line-soft);
  background: rgba(255, 253, 251, 0.92);
}

.el-dialog__footer .el-button {
  min-height: 48px !important;
  border-radius: 14px !important;
  font-size: 16px !important;
}

.el-dialog .el-input__wrapper,
.el-dialog .el-textarea__inner,
.el-dialog input,
.el-message-box .el-input__wrapper,
.el-message-box input {
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

.el-dialog .el-input__wrapper.is-focus,
.el-dialog input:focus,
.el-message-box .el-input__wrapper.is-focus,
.el-message-box input:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 4px rgba(217, 74, 55, 0.08) !important;
}

.el-dialog .el-input__inner,
.el-dialog input.el-input__inner,
.el-message-box .el-input__inner,
.el-message-box input.el-input__inner {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

.el-message-box {
  width: min(92vw, 420px) !important;
  border-radius: 20px !important;
  border: 1px solid var(--line-soft) !important;
  background: var(--bg-panel) !important;
}

.el-dialog .el-input,
.el-message-box .el-input {
  width: 100% !important;
}

.el-dialog .el-input .el-input__wrapper,
.el-message-box .el-input .el-input__wrapper {
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

.el-dialog .el-input .el-input__wrapper.is-focus,
.el-message-box .el-input .el-input__wrapper.is-focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 4px rgba(217, 74, 55, 0.08) !important;
}

.el-dialog .el-input .el-input__inner,
.el-message-box .el-input .el-input__inner {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

#app .el-dialog .el-input__wrapper,
#app .el-dialog .el-input .el-input__wrapper,
#app .el-message-box .el-input__wrapper,
#app .el-message-box .el-input .el-input__wrapper,
.el-overlay .el-dialog .el-input__wrapper,
.el-overlay .el-dialog .el-input .el-input__wrapper,
.el-overlay .el-message-box .el-input__wrapper,
.el-overlay .el-message-box .el-input .el-input__wrapper {
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  background: #FFFCF8 !important;
  box-shadow: none !important;
}

#app .el-dialog .el-input__inner,
#app .el-message-box .el-input__inner,
.el-overlay .el-dialog .el-input__inner,
.el-overlay .el-message-box .el-input__inner {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .ios-page-enter-active,
  .ios-page-leave-active,
  .task-card,
  .profile-entry,
  .info-section,
  .worker-card,
  .conversation-item,
  .sub-type-card,
  .training-card,
  .flow-card {
    animation: none !important;
    transition: none !important;
  }
}
</style>
