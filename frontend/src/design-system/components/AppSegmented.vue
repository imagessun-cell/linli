<template>
  <div class="app-segmented" role="tablist">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :class="['app-segmented__item', { 'is-active': modelValue === opt.value, 'is-disabled': opt.disabled }]"
      :disabled="opt.disabled"
      @click="select(opt)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options:    { type: Array, required: true } // [{label, value, disabled?}]
})
const emit = defineEmits(['update:modelValue', 'change'])
const select = (opt) => {
  if (opt.disabled) return
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
}
</script>

<style scoped>
.app-segmented {
  display: inline-flex;
  padding: 2px;
  background: var(--ds-fill-2);
  border-radius: var(--ds-radius-md);
  gap: 2px;
  width: 100%;
}
.app-segmented__item {
  flex: 1;
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  font-size: var(--ds-font-sub);
  font-weight: var(--ds-weight-semi);
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.app-segmented__item.is-active {
  background: #fff;
  color: var(--ds-text);
  box-shadow: var(--ds-shadow-1);
}
.app-segmented__item.is-disabled { opacity: 0.4; cursor: not-allowed; }
.app-segmented__item:focus-visible { outline: 3px solid var(--ds-blue); outline-offset: 1px; }
</style>
