<template>
  <div class="certification-badge">
    <div class="level-icon" :class="levelClass">
      <span>{{ levelIcon }}</span>
    </div>
    <div class="level-info">
      <div class="level-name">{{ levelName }}</div>
      <div class="level-stats" v-if="showStats">
        <span>已服务 {{ totalOrders }} 单</span>
        <span v-if="avgRating"> · ★ {{ avgRating }}</span>
      </div>
    </div>
    <el-tag v-if="size === 'small'" :type="tagType" size="small">{{ levelName }}</el-tag>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  showStats: { type: Boolean, default: true },
  size: { type: String, default: 'normal' } // 'normal' | 'small'
})

const levelNames = ['见习陪诊师', '初级陪诊师', '中级陪诊师', '高级陪诊师']
const levelIcons = ['🌱', '🥉', '🥈', '🥇']

const levelName = computed(() => levelNames[props.level] || '未知')
const levelIcon = computed(() => levelIcons[props.level] || '❓')
const levelClass = computed(() => `level-${props.level}`)
const tagType = computed(() => ['info', 'warning', 'success', 'danger'][props.level] || 'info')
</script>

<style scoped>
.certification-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.level-icon.level-0 { background: #FFF9F2; }
.level-icon.level-1 { background: #FFF3D8; }
.level-icon.level-2 { background: #FFF0EC; }
.level-icon.level-3 { background: #FFF7E3; }

.level-info {
  flex: 1;
}

.level-name {
  font-size: 14px;
  font-weight: 600;
  color: #4F3A32;
}

.level-stats {
  font-size: 12px;
  color: #8A6C60;
  margin-top: 2px;
}
</style>
