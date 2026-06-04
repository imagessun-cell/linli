<template>
  <Teleport to="body">
    <Transition name="app-sheet-fade">
      <div v-if="modelValue" class="app-sheet-overlay" @click.self="close">
        <div :class="['app-sheet', { 'app-sheet--center': center }]" role="dialog" aria-modal="true">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  center:     { type: Boolean, default: false }  // 居中弹窗
})
const emit = defineEmits(['update:modelValue', 'close'])
const close = () => { emit('update:modelValue', false); emit('close') }
</script>

<style scoped>
.app-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}
.app-sheet {
  width: 100%;
  max-width: 500px;
  background: var(--ds-bg-elevated);
  border-radius: var(--ds-radius-xl) var(--ds-radius-xl) 0 0;
  box-shadow: var(--ds-shadow-sheet);
  padding: 8px 0 calc(20px + var(--ds-safe-bottom));
  max-height: 85vh;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.app-sheet--center {
  margin: auto 16px;
  border-radius: var(--ds-radius-xl);
  padding: 16px 0;
  max-width: 420px;
}

.app-sheet-fade-enter-active,
.app-sheet-fade-leave-active { transition: opacity 0.2s ease; }
.app-sheet-fade-enter-active .app-sheet,
.app-sheet-fade-leave-active .app-sheet { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.app-sheet-fade-enter-from,
.app-sheet-fade-leave-to { opacity: 0; }
.app-sheet-fade-enter-from .app-sheet,
.app-sheet-fade-leave-to .app-sheet { transform: translateY(100%); }
.app-sheet--center.app-sheet-fade-enter-from .app-sheet,
.app-sheet--center.app-sheet-fade-leave-to .app-sheet { transform: scale(0.95); }
</style>
