<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :class="['app-list-item', { 'is-clickable': clickable, 'is-disabled': disabled, 'app-list-item--inset': inset }]"
    :disabled="disabled"
    :aria-disabled="disabled || undefined"
    @click="onClick"
  >
    <span v-if="$slots.prefix || icon" class="app-list-item__prefix">
      <slot name="prefix">{{ icon }}</slot>
    </span>
    <span class="app-list-item__main">
      <span v-if="title || $slots.title" class="app-list-item__title">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="subtitle || $slots.subtitle" class="app-list-item__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
    </span>
    <span class="app-list-item__aside">
      <slot name="aside">
        <span v-if="value" class="app-list-item__value">{{ value }}</span>
      </slot>
      <span v-if="showChevron" class="app-list-item__chev" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </span>
  </component>
</template>

<script setup>
const props = defineProps({
  title:    { type: String, default: '' },
  subtitle: { type: String, default: '' },
  value:    { type: [String, Number], default: '' },
  icon:     { type: String, default: '' },
  to:       { type: [String, Object], default: '' },
  href:     { type: String, default: '' },
  chevron:  { type: Boolean, default: undefined },
  inset:    { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])
const showChevron = props.chevron !== false && (!!props.to || props.chevron === true)
const clickable = !props.disabled && (!!props.to || !!props.href)
const onClick = (e) => { if (props.disabled) { e.preventDefault(); return } emit('click', e) }
</script>

<style scoped>
.app-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--ds-row-min);
  padding: 12px 16px;
  background: transparent;
  color: var(--ds-text);
  font-size: var(--ds-font-body);
  text-decoration: none;
  border: 0;
  cursor: default;
  width: 100%;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.app-list-item.is-clickable { cursor: pointer; }
.app-list-item.is-clickable:active { background: var(--ds-fill-3); }
.app-list-item.is-disabled { opacity: 0.4; pointer-events: none; }
.app-list-item:focus-visible { outline: 3px solid var(--ds-blue); outline-offset: -3px; }

.app-list-item__prefix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  font-size: 20px;
  color: var(--ds-text-2);
  flex: 0 0 auto;
}

.app-list-item__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app-list-item__title {
  font-size: var(--ds-font-body);
  color: var(--ds-text);
  font-weight: var(--ds-weight-medium);
  line-height: 1.4;
}
.app-list-item__subtitle {
  font-size: var(--ds-font-caption);
  color: var(--ds-text-3);
  line-height: 1.4;
}

.app-list-item__aside {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  color: var(--ds-text-3);
}
.app-list-item__value {
  font-size: var(--ds-font-sub);
  color: var(--ds-text-3);
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-list-item__chev { color: var(--ds-text-4); display: inline-flex; }
</style>
