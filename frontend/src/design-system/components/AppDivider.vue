<template>
  <hr v-if="!label" :class="['app-divider', { 'app-divider--inset': inset }]" />
  <div v-else :class="['app-divider', 'app-divider--with-label', { 'app-divider--inset': inset }]">
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  inset: { type: Boolean, default: false }
})
</script>

<style scoped>
.app-divider {
  border: 0;
  height: 1px;
  background: var(--ds-separator);
  margin: 0;
}
.app-divider--inset { margin-left: var(--ds-space-4); margin-right: var(--ds-space-4); }
.app-divider--with-label {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  height: auto;
  font-size: var(--ds-font-caption);
  color: var(--ds-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: var(--ds-space-4) 0;
}
.app-divider--with-label::before,
.app-divider--with-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ds-separator);
}
</style>
