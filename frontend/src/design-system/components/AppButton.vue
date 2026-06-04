<template>
  <button
    :class="['app-btn', `app-btn--${variant}`, `app-btn--${size}`, { 'is-block': block, 'is-disabled': disabled || loading, 'is-loading': loading }]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
    @click="handleClick"
  >
    <span v-if="loading" class="app-btn__spinner" aria-hidden="true" />
    <span class="app-btn__content">
      <slot />
    </span>
  </button>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' },  // primary | secondary | tertiary | destructive | ghost
  size:    { type: String, default: 'md' },       // sm | md | lg
  block:   { type: Boolean, default: false },
  disabled:{ type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type:    { type: String, default: 'button' }
})
const emit = defineEmits(['click'])
const handleClick = (e) => {
  if (props.disabled || props.loading) return
  emit('click', e)
}
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--ds-touch-min);
  padding: 0 20px;
  border-radius: var(--ds-radius-md);
  font-family: inherit;
  font-size: var(--ds-font-body);
  font-weight: var(--ds-weight-semi);
  line-height: 1.2;
  border: 1px solid transparent;
  background: var(--ds-fill-1);
  color: var(--ds-text);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.08s ease, opacity 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.app-btn:active:not(.is-disabled) { transform: scale(0.98); }
.app-btn.is-disabled { opacity: 0.4; cursor: not-allowed; }
.app-btn.is-block { width: 100%; }
.app-btn:focus-visible { outline: 3px solid var(--ds-blue); outline-offset: 2px; }

.app-btn--primary {
  background: var(--ds-blue);
  color: #fff;
  border-color: var(--ds-blue);
}
.app-btn--primary:hover:not(.is-disabled) { background: var(--ds-blue-hover); }

.app-btn--destructive {
  background: var(--ds-red);
  color: #fff;
  border-color: var(--ds-red);
}
.app-btn--destructive:hover:not(.is-disabled) { background: #FF453A; }

.app-btn--secondary {
  background: var(--ds-fill-1);
  color: var(--ds-blue);
}
.app-btn--secondary:hover:not(.is-disabled) { background: var(--ds-fill-2); }

.app-btn--tertiary {
  background: transparent;
  color: var(--ds-blue);
}
.app-btn--tertiary:hover:not(.is-disabled) { background: var(--ds-blue-soft); }

.app-btn--ghost {
  background: transparent;
  color: var(--ds-blue);
  border-color: var(--ds-blue);
}
.app-btn--ghost:hover:not(.is-disabled) { background: var(--ds-blue-soft); }

/* sizes */
.app-btn--sm { min-height: 40px; padding: 0 14px; font-size: var(--ds-font-sub); border-radius: var(--ds-radius-sm); }
.app-btn--md { min-height: var(--ds-touch-min); padding: 0 20px; font-size: var(--ds-font-body); }
.app-btn--lg { min-height: var(--ds-touch-large); padding: 0 24px; font-size: var(--ds-font-callout); border-radius: var(--ds-radius-lg); }

.app-btn__content { display: inline-flex; align-items: center; gap: 6px; }

.app-btn__spinner {
  width: 18px; height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.8s linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
</style>
