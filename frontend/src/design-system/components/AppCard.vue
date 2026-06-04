<template>
  <section
    :class="['app-card', { 'app-card--inset': inset, 'app-card--flat': flat, 'app-card--tinted': tinted }]"
    :style="cardStyle"
  >
    <header v-if="title || $slots.header" class="app-card__header">
      <slot name="header">
        <h3 class="app-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="app-card__subtitle">{{ subtitle }}</p>
      </slot>
      <div v-if="$slots.action" class="app-card__action">
        <slot name="action" />
      </div>
    </header>
    <div class="app-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  title:    { type: String, default: '' },
  subtitle: { type: String, default: '' },
  inset:    { type: Boolean, default: false }, // grouped list 风格:小圆角
  flat:     { type: Boolean, default: false }, // 无阴影
  tinted:   { type: Boolean, default: false }, // 浅蓝色底
  padding:  { type: String, default: '' }      // 自定义内边距
})
const cardStyle = computed(() => {
  if (!props.padding) return {}
  return { padding: props.padding }
})
</script>

<style scoped>
.app-card {
  background: var(--ds-bg-elevated);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-1);
  padding: var(--ds-space-4);
  color: var(--ds-text);
}
.app-card--inset { border-radius: var(--ds-radius-md); padding: 0; }
.app-card--flat  { box-shadow: none; border: 1px solid var(--ds-separator); }
.app-card--tinted { background: var(--ds-blue-soft); box-shadow: none; }

.app-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: var(--ds-space-3);
}
.app-card__title {
  font-size: var(--ds-font-callout);
  font-weight: var(--ds-weight-bold);
  color: var(--ds-text);
}
.app-card__subtitle {
  margin-top: 2px;
  font-size: var(--ds-font-caption);
  color: var(--ds-text-3);
}
.app-card__action { flex: 0 0 auto; }

.app-card__body { font-size: var(--ds-font-body); color: var(--ds-text); }

.app-card__footer {
  margin-top: var(--ds-space-4);
  padding-top: var(--ds-space-3);
  border-top: 1px solid var(--ds-separator);
}
</style>
