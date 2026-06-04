<template>
  <span :class="['app-tag', `app-tag--${tone}`, { 'app-tag--outline': outline }]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  tone:    { type: String, default: 'neutral' },  // neutral | blue | green | orange | red
  outline: { type: Boolean, default: false }
})
</script>

<style scoped>
.app-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--ds-font-caption);
  font-weight: var(--ds-weight-semi);
  line-height: 1.4;
  padding: 3px 9px;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-fill-2);
  color: var(--ds-text-2);
  white-space: nowrap;
}
.app-tag--blue   { background: var(--ds-blue-soft);   color: var(--ds-blue); }
.app-tag--green  { background: var(--ds-green-soft);  color: var(--ds-green); }
.app-tag--orange { background: var(--ds-orange-soft); color: var(--ds-orange); }
.app-tag--red    { background: var(--ds-red-soft);    color: var(--ds-red); }

.app-tag--outline {
  background: transparent;
  border: 1px solid currentColor;
}
</style>
