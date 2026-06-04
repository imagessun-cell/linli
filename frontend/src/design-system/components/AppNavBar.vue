<template>
  <header :class="['app-navbar', { 'app-navbar--large': large, 'app-navbar--translucent': translucent, 'app-navbar--bordered': bordered }]">
    <div class="app-navbar__left">
      <slot name="left">
        <button
          v-if="back"
          type="button"
          class="app-navbar__btn"
          :aria-label="backLabel || '返回'"
          @click="onBack"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span v-if="backText" class="app-navbar__btn-text">{{ backText }}</span>
        </button>
      </slot>
    </div>
    <div class="app-navbar__center">
      <slot>
        <h1 v-if="title" :class="['app-navbar__title', { 'app-navbar__title--large': large }]">{{ title }}</h1>
      </slot>
    </div>
    <div class="app-navbar__right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
const props = defineProps({
  title:    { type: String, default: '' },
  back:     { type: Boolean, default: false },
  backText: { type: String, default: '' },
  backLabel:{ type: String, default: '' },
  large:    { type: Boolean, default: false },
  translucent: { type: Boolean, default: true },
  bordered: { type: Boolean, default: false }
})
const emit = defineEmits(['back'])
const router = useRouter()
const onBack = () => {
  if (props.back === false) return
  emit('back')
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: var(--ds-nav-height);
  padding: 0 12px;
  background: var(--ds-bg-elevated);
  color: var(--ds-text);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  background: rgba(255, 255, 255, 0.85);
}
.app-navbar--translucent { background: rgba(255, 255, 255, 0.85); }
.app-navbar--large {
  height: var(--ds-nav-large-height);
  align-items: end;
  padding-bottom: 8px;
}
.app-navbar--bordered { border-bottom: 1px solid var(--ds-separator); }

.app-navbar__left,
.app-navbar__right { display: flex; align-items: center; gap: 4px; min-height: var(--ds-touch-min); }
.app-navbar__right { justify-content: flex-end; }

.app-navbar__center {
  text-align: center;
  font-size: var(--ds-font-callout);
  font-weight: var(--ds-weight-bold);
  color: var(--ds-text);
  min-width: 0;
}

.app-navbar__title {
  font-size: var(--ds-font-callout);
  font-weight: var(--ds-weight-bold);
  margin: 0;
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-navbar__title--large {
  font-size: var(--ds-font-h1);
  letter-spacing: -0.02em;
  align-self: end;
  margin-bottom: 4px;
  width: 100%;
  text-align: left;
  padding-left: 4px;
}

.app-navbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-height: var(--ds-touch-min);
  min-width: var(--ds-touch-min);
  padding: 0 10px;
  background: transparent;
  border: 0;
  color: var(--ds-blue);
  font-size: var(--ds-font-body);
  font-weight: var(--ds-weight-medium);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.app-navbar__btn:active { opacity: 0.6; }
.app-navbar__btn-text { font-size: var(--ds-font-body); }
</style>
