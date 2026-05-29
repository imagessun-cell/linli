<template>
  <div class="employer-layout">
    <div class="main-content">
      <router-view />
    </div>
    <van-tabbar v-model="active" @change="onTabChange">
      <van-tabbar-item icon="home-o" to="/employer/dashboard">首页</van-tabbar-item>
      <van-tabbar-item icon="plus" to="/employer/publish">发单</van-tabbar-item>
      <van-tabbar-item icon="search" to="/employer/workers">服务者</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/employer/orders">订单</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/employer/profile">我的</van-tabbar-item>
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
  '/employer/dashboard': 0,
  '/employer/publish': 1,
  '/employer/workers': 2,
  '/employer/orders': 3,
  '/employer/profile': 4
}

watch(() => route.path, (path) => {
  active.value = routeMap[path] ?? 0
}, { immediate: true })

const onTabChange = (index) => {
  const paths = ['/employer/dashboard', '/employer/publish', '/employer/workers', '/employer/orders', '/employer/profile']
  router.push(paths[index])
}
</script>

<style scoped>
.employer-layout {
  min-height: 100vh;
  padding-bottom: 60px;
}

.main-content {
  padding: 16px;
}
</style>