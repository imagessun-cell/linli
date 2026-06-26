<template>
  <svg class="process-illustration" :class="`type-${type}`" viewBox="0 0 132 96" role="img" :aria-label="label">
    <rect class="canvas" x="6" y="6" width="120" height="84" rx="18" />
    <g v-if="type === 'prepare'">
      <rect class="panel" x="24" y="18" width="34" height="54" rx="8" />
      <path class="line" d="M31 31h20M31 42h16M31 53h12" />
      <path class="accent" d="M75 29l7 7 15-16" />
      <path class="line" d="M70 52h30M70 63h20" />
    </g>
    <g v-else-if="type === 'arrive'">
      <path class="line" d="M28 46 66 20l38 26" />
      <path class="line" d="M36 46v26h60V46" />
      <path class="accent" d="M66 37v18M57 46h18" />
      <path class="line" d="M48 72V56h36v16" />
    </g>
    <g v-else-if="type === 'triage'">
      <rect class="panel" x="24" y="28" width="84" height="34" rx="10" />
      <circle class="line" cx="42" cy="45" r="8" />
      <path class="line" d="M60 39h30M60 51h22" />
      <path class="accent" d="M36 73h60" />
    </g>
    <g v-else-if="type === 'consult'">
      <circle class="line" cx="42" cy="34" r="8" />
      <path class="line" d="M28 63c3-9 7.7-13 14-13s11 4 14 13" />
      <circle class="line" cx="90" cy="34" r="8" />
      <path class="line" d="M76 63c3-9 7.7-13 14-13s11 4 14 13" />
      <path class="accent" d="M58 42h16" />
      <path class="accent" d="M66 34v16" />
    </g>
    <g v-else-if="type === 'check'">
      <rect class="panel" x="25" y="24" width="82" height="48" rx="12" />
      <circle class="line" cx="49" cy="48" r="12" />
      <path class="accent" d="M68 40h24M68 52h18M68 64h12" />
    </g>
    <g v-else-if="type === 'pay'">
      <rect class="panel" x="26" y="27" width="80" height="42" rx="10" />
      <path class="line" d="M36 42h60" />
      <path class="line" d="M38 57h24" />
      <path class="accent" d="M84 51l6 6 10-14" />
    </g>
    <g v-else-if="type === 'pharmacy'">
      <path class="panel" d="M34 36h64l-6 37H40l-6-37Z" />
      <path class="line" d="M48 36c1.4-8 7.4-13 18-13s16.6 5 18 13" />
      <path class="accent" d="M66 47v15M58.5 54.5h15" />
    </g>
    <g v-else>
      <rect class="panel" x="32" y="20" width="68" height="56" rx="12" />
      <path class="line" d="M44 36h44M44 49h34M44 62h24" />
      <path class="accent" d="M86 58l6 6 12-16" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'record'
  },
  label: {
    type: String,
    default: '陪诊流程插图'
  }
})
</script>

<style scoped>
.process-illustration {
  width: 100%;
  max-width: 132px;
  aspect-ratio: 132 / 96;
  display: block;
}

.canvas {
  fill: #FFF9F2;
  stroke: #EBD8CF;
  stroke-width: 1.5;
}

.panel {
  fill: #fffdf8;
  stroke: #EBD8CF;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line,
.accent {
  fill: none;
  stroke: #E94F3D;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.accent {
  stroke: #F6A21A;
}
</style>
