<template>
  <div class="worker-layout">
    <div class="main-content">
      <router-view />
    </div>
    <van-tabbar v-model="active" @change="onTabChange">
      <van-tabbar-item icon="home-o" to="/worker/dashboard">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/worker/task-hall">抢单</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/worker/my-tasks">我的任务</van-tabbar-item>
      <van-tabbar-item icon="wallet-o" to="/worker/wallet">钱包</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/worker/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const active = ref(0)

const routeMap = {
  '/worker/dashboard': 0,
  '/worker/task-hall': 1,
  '/worker/my-tasks': 2,
  '/worker/wallet': 3,
  '/worker/profile': 4
}

watch(() => route.path, (path) => {
  active.value = routeMap[path] ?? 0
}, { immediate: true })

const onTabChange = (index) => {
  const paths = ['/worker/dashboard', '/worker/task-hall', '/worker/my-tasks', '/worker/wallet', '/worker/profile']
  router.push(paths[index])
}
</script>

<style scoped>
.worker-layout {
  min-height: 100vh;
  padding-bottom: 60px;
}

.main-content {
  padding: 16px;
}
</style>