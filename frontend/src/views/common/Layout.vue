<template>
  <div class="common-layout">
    <div class="header">
      <el-icon @click="$router.back()"><ArrowLeft /></el-icon>
      <span class="title">{{ title }}</span>
      <span></span>
    </div>
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const title = ref('')

const titleMap = {
  'OrderDetail': '订单详情',
  'MessageList': '消息',
  'ChatRoom': '聊天',
  'Training': '培训课程',
  'Community': '银发圈'
}

watch(() => route.name, (name) => {
  title.value = titleMap[route.name] || ''
}, { immediate: true })
</script>

<style scoped>
.common-layout {
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #F2E6DE;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .el-icon {
  font-size: 20px;
  cursor: pointer;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.main-content {
  padding: 16px;
}
</style>