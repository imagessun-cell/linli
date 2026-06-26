<template>
  <span
    class="linli-logo-mark"
    :class="[`tone-${tone}`, `variant-${variant}`]"
    :style="sizeStyle"
    :aria-label="label"
    role="img"
  >
    <img class="linli-logo-image" :src="logoSrc" alt="" decoding="async" />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: [Number, String],
    default: 40
  },
  tone: {
    type: String,
    default: 'brand'
  },
  variant: {
    type: String,
    default: 'mark'
  },
  label: {
    type: String,
    default: '邻里陪诊'
  }
})

const sizeStyle = computed(() => {
  const value = typeof props.size === 'number' ? `${props.size}px` : props.size
  if (props.variant === 'full') {
    const width = typeof props.size === 'number' ? `${Math.round(props.size * 2.55)}px` : `calc(${value} * 2.55)`
    return {
      width,
      height: value
    }
  }
  return {
    width: value,
    height: value
  }
})

const logoSrc = computed(() => {
  const base = import.meta.env.BASE_URL || '/'
  return props.variant === 'full'
    ? `${base}brand/linli-logo-full.png`
    : `${base}brand/linli-logo-mark.png`
})
</script>

<style scoped>
.linli-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
}

.variant-full {
  padding: 4px 8px;
  border: 1px solid rgba(235, 216, 207, 0.92);
  border-radius: 12px;
  background: rgba(255, 253, 248, 0.96);
  box-shadow: 0 6px 16px rgba(79, 58, 50, 0.08);
}

.variant-mark {
  border-radius: 12px;
}

.variant-mark.tone-light {
  padding: 3px;
  background: rgba(255, 253, 248, 0.96);
  box-shadow: 0 4px 10px rgba(79, 58, 50, 0.1);
}

.linli-logo-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}
</style>
