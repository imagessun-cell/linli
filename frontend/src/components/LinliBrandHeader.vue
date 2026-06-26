<template>
  <section :class="['linli-brand-header', `tone-${tone}`, { compact }]">
    <div class="brand-main">
      <div class="brand-title-row">
        <LinliLogo variant="full" :tone="tone === 'dark' ? 'light' : 'brand'" :size="compact ? 58 : 62" />
      </div>
      <div v-if="meta || $slots.actions" class="brand-side">
        <span v-if="meta" class="brand-meta">{{ meta }}</span>
        <div v-if="$slots.actions" class="brand-actions">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
    <div class="brand-copy">
      <h1>{{ title }}</h1>
    </div>
    <p v-if="subtitle" class="brand-subtitle">{{ subtitle }}</p>
    <p v-if="note" class="brand-note">{{ note }}</p>
  </section>
</template>

<script setup>
import LinliLogo from '@/components/LinliLogo.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  eyebrow: {
    type: String,
    default: '邻里陪诊'
  },
  note: {
    type: String,
    default: ''
  },
  meta: {
    type: String,
    default: ''
  },
  tone: {
    type: String,
    default: 'light'
  },
  compact: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.linli-brand-header {
  position: relative;
  overflow: visible;
  padding: 16px;
  color: #4F3A32;
}

.linli-brand-header::before {
  content: none;
}

.linli-brand-header::after {
  content: none;
}

.tone-light {
  border: 1px solid #EBD8CF;
  border-radius: 16px;
  background: #fffdf8;
  box-shadow: 0 5px 14px rgba(23, 35, 49, 0.04);
}

.tone-dark {
  border-radius: 0;
  background: #E94F3D;
  color: #fff;
}

.compact {
  padding: 14px 16px;
}

.compact .brand-copy h1 {
  font-size: 24px;
  line-height: 1.12;
}

.compact .brand-subtitle,
.compact .brand-note {
  font-size: 14px;
  line-height: 1.44;
}

.compact .brand-note {
  margin-top: 10px;
}

.compact .brand-meta {
  min-height: 28px;
  padding: 4px 9px;
  font-size: 12px;
}

.brand-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand-title-row {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
  margin-top: 12px;
}

.brand-eyebrow {
  display: inline-flex;
  min-height: 22px;
  align-items: center;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: #E94F3D;
  font-size: 13px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0;
  white-space: nowrap;
}

.tone-dark .brand-eyebrow {
  background: transparent;
  color: #fff;
}

.brand-copy h1 {
  margin: 0;
  max-width: 9em;
  font-size: 26px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: 0;
  color: inherit;
}

.brand-subtitle,
.brand-note {
  position: relative;
  z-index: 1;
  margin: 8px 0 0 46px;
  max-width: 20em;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 800;
  color: #8A6C60;
}

.tone-dark .brand-subtitle,
.tone-dark .brand-note {
  color: rgba(255, 255, 255, 0.88);
}

.brand-side {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

.brand-meta {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(233, 79, 61, 0.08);
  border: 1px solid rgba(233, 79, 61, 0.12);
  color: #E94F3D;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.tone-dark .brand-meta {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.brand-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.brand-note {
  max-width: 26em;
}

@media (max-width: 380px) {
  .linli-brand-header {
    padding-left: 14px;
    padding-right: 14px;
  }

  .brand-side {
    gap: 6px;
  }

  .brand-copy h1 {
    font-size: 23px;
  }
}
</style>
