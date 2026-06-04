<template>
  <div class="app-empty" role="status">
    <div v-if="icon || $slots.icon" class="app-empty__icon" aria-hidden="true">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <h4 v-if="title || $slots.title" class="app-empty__title">
      <slot name="title">{{ title }}</slot>
    </h4>
    <p v-if="desc || $slots.desc" class="app-empty__desc">
      <slot name="desc">{{ desc }}</slot>
    </p>
    <div v-if="$slots.action" class="app-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon:  { type: String, default: '' },
  title: { type: String, default: '' },
  desc:  { type: String, default: '' }
})
</script>

<style scoped>
.app-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--ds-space-7) var(--ds-space-4);
  text-align: center;
  color: var(--ds-text-2);
}
.app-empty__icon {
  font-size: 48px;
  margin-bottom: var(--ds-space-3);
  color: var(--ds-text-3);
}
.app-empty__title {
  font-size: var(--ds-font-callout);
  font-weight: var(--ds-weight-bold);
  color: var(--ds-text);
  margin-bottom: 4px;
}
.app-empty__desc {
  font-size: var(--ds-font-sub);
  color: var(--ds-text-3);
  max-width: 320px;
}
.app-empty__action { margin-top: var(--ds-space-4); }
</style>
