<template>
  <span
    class="linli-avatar"
    :class="`variant-${variant}`"
    :style="avatarStyle"
    role="img"
    :aria-label="ariaLabel"
  >
    <img
      v-if="normalizedSrc && !imageFailed"
      class="avatar-img"
      :src="normalizedSrc"
      :alt="ariaLabel"
      @error="imageFailed = true"
    />
    <svg v-else class="avatar-svg" viewBox="0 0 80 80" aria-hidden="true">
      <circle class="avatar-bg" cx="40" cy="40" r="37" />
      <path class="avatar-line" d="M26 50c2.6-7.2 7.2-10.7 14-10.7S51.4 42.8 54 50" />
      <path class="avatar-line" d="M28.5 29.8c2-6.2 6.1-9.2 11.5-9.2s9.5 3 11.5 9.2" />
      <circle class="avatar-line" cx="40" cy="32" r="8.5" />
      <path v-if="variant === 'worker'" class="avatar-detail" d="M57 24v9" />
      <path v-if="variant === 'worker'" class="avatar-detail" d="M52.5 28.5h9" />
      <path v-if="variant === 'worker'" class="avatar-detail" d="M31 54h18" />
      <path v-if="variant === 'patient'" class="avatar-detail" d="M28 52c3.4 5.1 7.4 7.6 12 7.6S48.6 57.1 52 52" />
      <path v-if="variant === 'patient'" class="avatar-detail" d="M54 27c3.3 0 5.5 2.1 5.5 5.2 0 4.1-5.5 7.9-5.5 7.9s-5.5-3.8-5.5-7.9c0-3.1 2.2-5.2 5.5-5.2Z" />
      <path v-if="variant === 'user'" class="avatar-detail" d="M25 56h30" />
    </svg>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'user'
  },
  name: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 64
  },
  src: {
    type: String,
    default: ''
  }
})

const imageFailed = ref(false)

const normalizedSrc = computed(() => {
  const value = (props.src || '').trim()
  if (!value) return ''
  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('blob:')) return value
  return value.startsWith('/') ? value : `/${value}`
})

watch(normalizedSrc, () => {
  imageFailed.value = false
})

const avatarStyle = computed(() => {
  const value = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: value,
    height: value
  }
})

const ariaLabel = computed(() => {
  if (props.name) return `${props.name}的头像`
  if (props.variant === 'worker') return '陪诊师头像'
  if (props.variant === 'patient') return '就诊人头像'
  return '用户头像'
})
</script>

<style scoped>
.linli-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
}

.avatar-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-img {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-bg {
  fill: #FFF0EC;
  stroke: #EBD8CF;
  stroke-width: 2;
}

.avatar-line,
.avatar-detail {
  fill: none;
  stroke: #E94F3D;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.avatar-detail {
  stroke: #F6A21A;
}

.variant-patient .avatar-bg {
  fill: #fff7ec;
  stroke: #ead8bd;
}

.variant-patient .avatar-line {
  stroke: #4F3A32;
}

.variant-patient .avatar-detail {
  stroke: #E94F3D;
}

.variant-user .avatar-bg {
  fill: #FFF9F2;
  stroke: #EBD8CF;
}

.variant-user .avatar-line {
  stroke: #8A6C60;
}

.variant-user .avatar-detail {
  stroke: #E94F3D;
}
</style>
