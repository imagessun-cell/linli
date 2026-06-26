<template>
  <div class="service-checkpoints">
    <div class="checkpoint-title">服务流程打卡</div>

    <div class="checkpoint-timeline">
      <div
        v-for="(cp, index) in progressData"
        :key="cp.key"
        :class="['checkpoint-item', { done: cp.done, active: !cp.done && index === nextIndex }]"
      >
        <div class="checkpoint-dot">
          <span v-if="cp.done">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="checkpoint-body">
          <div class="checkpoint-name">{{ cp.name }}</div>
          <div class="checkpoint-time" v-if="cp.record?.created_at">
            {{ formatTime(cp.record.created_at) }}
          </div>
          <el-button
            v-if="!cp.done && index === nextIndex && canCheckIn"
            size="small"
            type="primary"
            @click="$emit('checkin', cp.key, cp.name)"
          >
            打卡
          </el-button>
          <div class="checkpoint-photo" v-if="cp.record?.photo_url">
            <img :src="cp.record.photo_url" alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progressData: { type: Array, default: () => [] },
  canCheckIn: { type: Boolean, default: false }
})

defineEmits(['checkin'])

const nextIndex = computed(() => {
  const idx = props.progressData.findIndex(cp => !cp.done)
  return idx === -1 ? props.progressData.length : idx
})

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.service-checkpoints {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.checkpoint-title {
  font-size: 14px;
  font-weight: 600;
  color: #4F3A32;
  margin-bottom: 16px;
}

.checkpoint-timeline {
  position: relative;
  padding-left: 24px;
}

.checkpoint-timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #EFE2DC;
}

.checkpoint-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
}

.checkpoint-item:last-child {
  padding-bottom: 0;
}

.checkpoint-dot {
  position: absolute;
  left: -24px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #EFE2DC;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #8A6C60;
  z-index: 1;
}

.checkpoint-item.done .checkpoint-dot {
  background: #B66A25;
  color: white;
}

.checkpoint-item.active .checkpoint-dot {
  background: #E94F3D;
  color: white;
}

.checkpoint-body {
  flex: 1;
}

.checkpoint-name {
  font-size: 14px;
  color: #4F3A32;
  font-weight: 500;
}

.checkpoint-time {
  font-size: 12px;
  color: #8A6C60;
  margin-top: 2px;
}

.checkpoint-photo {
  margin-top: 4px;
}

.checkpoint-photo img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}
</style>
