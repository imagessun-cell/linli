<template>
  <div :class="['app-avatar', `app-avatar--${size}`, { 'app-avatar--square': square }]">
    <img v-if="src && !errored" :src="src" :alt="alt" @error="errored = true" />
    <span v-else class="app-avatar__placeholder" aria-hidden="true">{{ fallbackText }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
const props = defineProps({
  src:    { type: String, default: '' },
  alt:    { type: String, default: '头像' },
  name:   { type: String, default: '' },
  size:   { type: String, default: 'md' },  // xs | sm | md | lg | xl
  square: { type: Boolean, default: false }
})
const errored = ref(false)
const fallbackText = computed(() => (props.name || '?').slice(0, 1))
</script>

<style scoped>
.app-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--ds-fill-2);
  color: var(--ds-text);
  font-weight: var(--ds-weight-bold);
  overflow: hidden;
  flex: 0 0 auto;
  border-radius: 50%;
  user-select: none;
}
.app-avatar img { width: 100%; height: 100%; object-fit: cover; }
.app-avatar__placeholder {
  font-size: inherit;
  color: var(--ds-text-2);
}
.app-avatar--xs { width: 28px; height: 28px; font-size: 13px; }
.app-avatar--sm { width: 36px; height: 36px; font-size: 15px; }
.app-avatar--md { width: 44px; height: 44px; font-size: 17px; }
.app-avatar--lg { width: 56px; height: 56px; font-size: 20px; }
.app-avatar--xl { width: 80px; height: 80px; font-size: 28px; }
.app-avatar--square { border-radius: var(--ds-radius-md); }
</style>
