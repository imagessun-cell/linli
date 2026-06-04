<template>
  <button
    type="button"
    :class="['app-chip', { 'is-active': modelValue, 'is-disabled': disabled }]"
    :disabled="disabled"
    :aria-pressed="modelValue"
    @click="toggle"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled:   { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'change'])
const toggle = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
  emit('change', !props.modelValue)
}
</script>

<style scoped>
.app-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 40px;
  padding: 6px 14px;
  font-size: var(--ds-font-sub);
  font-weight: var(--ds-weight-semi);
  border-radius: var(--ds-radius-pill);
  background: var(--ds-fill-2);
  color: var(--ds-text);
  border: 0;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.08s;
  -webkit-tap-highlight-color: transparent;
}
.app-chip:active:not(.is-disabled) { transform: scale(0.97); }
.app-chip.is-active {
  background: var(--ds-blue);
  color: #fff;
}
.app-chip.is-disabled { opacity: 0.4; cursor: not-allowed; }
.app-chip:focus-visible { outline: 3px solid var(--ds-blue); outline-offset: 2px; }
</style>
