<template>
  <div :class="['app-field', { 'is-error': error, 'is-disabled': disabled }]">
    <label v-if="label" :for="inputId" class="app-field__label">
      {{ label }}
      <span v-if="required" class="app-field__req" aria-hidden="true">*</span>
    </label>
    <div class="app-field__control">
      <span v-if="$prefix || icon" class="app-field__prefix" aria-hidden="true">
        <slot name="prefix">{{ icon }}</slot>
      </span>
      <input
        v-if="type !== 'textarea'"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        class="app-field__input"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      <textarea
        v-else
        :id="inputId"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :rows="rows"
        class="app-field__input app-field__input--textarea"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      <button
        v-if="clearable && modelValue && !disabled && !readonly"
        type="button"
        class="app-field__clear"
        aria-label="清除"
        @click="clear"
      >×</button>
      <span v-if="$slots.suffix" class="app-field__suffix">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="app-field__msg app-field__msg--error">{{ error }}</p>
    <p v-else-if="hint" class="app-field__msg">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue:  { type: [String, Number], default: '' },
  label:       { type: String, default: '' },
  type:        { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  hint:        { type: String, default: '' },
  error:       { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
  readonly:    { type: Boolean, default: false },
  required:    { type: Boolean, default: false },
  clearable:   { type: Boolean, default: false },
  maxlength:   { type: [String, Number], default: undefined },
  rows:        { type: Number, default: 3 },
  icon:        { type: String, default: '' },
  inputmode:   { type: String, default: undefined },
  autocomplete:{ type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'clear'])
const inputId = computed(() => `app-field-${Math.random().toString(36).slice(2, 9)}`)
const onInput = (e) => emit('update:modelValue', e.target.value)
const clear = () => { emit('update:modelValue', ''); emit('clear') }
</script>

<style scoped>
.app-field { display: flex; flex-direction: column; gap: 6px; }
.app-field__label {
  font-size: var(--ds-font-sub);
  font-weight: var(--ds-weight-semi);
  color: var(--ds-text);
}
.app-field__req { color: var(--ds-red); margin-left: 2px; }

.app-field__control {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--ds-touch-min);
  background: var(--ds-fill-2);
  border-radius: var(--ds-radius-md);
  padding: 0 12px;
  transition: background 0.15s, box-shadow 0.15s;
}
.app-field__control:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px var(--ds-blue);
}
.app-field.is-error .app-field__control { box-shadow: 0 0 0 2px var(--ds-red); }
.app-field.is-disabled .app-field__control { opacity: 0.5; }

.app-field__prefix,
.app-field__suffix {
  display: inline-flex;
  align-items: center;
  color: var(--ds-text-3);
  font-size: var(--ds-font-body);
  flex: 0 0 auto;
}

.app-field__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: var(--ds-font-body);
  color: var(--ds-text);
  padding: 8px 0;
  line-height: 1.4;
}
.app-field__input::placeholder { color: var(--ds-text-3); }
.app-field__input--textarea {
  resize: vertical;
  min-height: 88px;
  padding: 10px 0;
  line-height: var(--ds-line-base);
}

.app-field__clear {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: var(--ds-fill-1);
  color: var(--ds-text-2);
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
}

.app-field__msg {
  font-size: var(--ds-font-caption);
  color: var(--ds-text-3);
}
.app-field__msg--error { color: var(--ds-red); }
</style>
