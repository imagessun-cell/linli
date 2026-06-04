<template>
  <nav :class="['app-tabbar', { 'app-tabbar--floating': floating }]" role="tablist" aria-label="主导航">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.value"
      :class="['app-tabbar__item', { 'is-active': modelValue === item.value, 'is-disabled': item.disabled }]"
      :disabled="item.disabled"
      @click="select(item)"
    >
      <span class="app-tabbar__icon" aria-hidden="true">
        <slot :name="`icon-${item.value}`" :item="item">{{ item.icon || defaultIcon(item) }}</slot>
      </span>
      <span class="app-tabbar__label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  items:      { type: Array, required: true }, // [{value, label, icon?, disabled?}]
  floating:   { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'change'])
const select = (item) => {
  if (item.disabled) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
}
const defaultIcon = (item) => item.icon || '·'
</script>

<style scoped>
.app-tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 200;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-top: 1px solid var(--ds-separator);
  padding-bottom: var(--ds-safe-bottom);
  min-height: var(--ds-tabbar-height);
}
.app-tabbar--floating {
  left: 12px; right: 12px; bottom: calc(12px + var(--ds-safe-bottom));
  border-radius: var(--ds-radius-xl);
  border: 1px solid var(--ds-separator);
  box-shadow: var(--ds-shadow-3);
  min-height: 60px;
}

.app-tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: var(--ds-touch-min);
  padding: 6px 4px;
  background: transparent;
  border: 0;
  color: var(--ds-text-3);
  font-size: var(--ds-font-caption);
  font-weight: var(--ds-weight-medium);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.app-tabbar__item.is-active { color: var(--ds-blue); }
.app-tabbar__item.is-disabled { opacity: 0.4; cursor: not-allowed; }
.app-tabbar__item:active:not(.is-disabled) { opacity: 0.6; }

.app-tabbar__icon {
  width: 28px; height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
}
.app-tabbar__label {
  font-size: 12px;
  font-weight: var(--ds-weight-medium);
  letter-spacing: 0;
}
</style>
