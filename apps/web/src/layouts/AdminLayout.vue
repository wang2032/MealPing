<template>
  <el-container class="min-h-screen">
    <el-aside width="200px" class="bg-gray-900 text-white">
      <div class="px-4 py-4 border-b border-gray-800 flex items-center gap-2">
        <span class="text-brand-500 text-xl">🍜</span>
        <span class="font-semibold">MealPing 后台</span>
      </div>
      <el-menu
        :default-active="route.path"
        background-color="#111827"
        text-color="#d1d5db"
        active-text-color="#f97316"
        router
      >
        <el-menu-item index="/admin/orders">订单管理</el-menu-item>
        <el-menu-item index="/admin/menu">菜单管理</el-menu-item>
        <el-menu-item index="/admin/qrcodes">桌台二维码</el-menu-item>
        <el-menu-item index="/admin/notify">通知日志</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="bg-white border-b flex items-center justify-between">
        <span class="text-gray-600">欢迎使用 MealPing</span>
        <el-button size="small" @click="logout">退出登录</el-button>
      </el-header>
      <el-main class="bg-gray-50">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { adminLogout } from '@/api/auth';

const route = useRoute();
const router = useRouter();

function logout() {
  adminLogout();
  router.push('/admin/login');
}
</script>
