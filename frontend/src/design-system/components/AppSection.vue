<template>
  <section :class="['app-section', { 'app-section--inset': inset, 'app-section--grouped': grouped }]">
    <header v-if="title || $slots.title" class="app-section__header">
      <h3 class="app-section__title">
        <slot name="title">{{ title }}</slot>
      </h3>
      <p v-if="subtitle || $slots.subtitle" class="app-section__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </header>
    <div class="app-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title:    { type: String, default: '' },
  subtitle: { type: String, default: '' },
  inset:    { type: Boolean, default: false },
  grouped:  { type: Boolean, default: false }  // grouped list 风格
})
</script>

<style scoped>
.app-section { margin-bottom: var(--ds-space-5); }
.app-section__header {
  padding: 0 var(--ds-space-4) var(--ds-space-2);
}
.app-section__title {
  font-size: var(--ds-font-callout);
  font-weight: var(--ds-weight-bold);
  color: var(--ds-text);
  margin: 0;
}
.app-section__subtitle {
  margin-top: 2px;
  font-size: var(--ds-font-caption);
  color: var(--ds-text-3);
}
.app-section__body { padding: 0; }

.app-section--grouped .app-section__body {
  background: var(--ds-bg-elevated);
  border-radius: var(--ds-radius-md);
  overflow: hidden;
  margin: 0 var(--ds-space-4);
}
.app-section--grouped .app-section__body > :deep(*) + :deep(*) {
  border-top: 1px solid var(--ds-separator);
}
</style>
