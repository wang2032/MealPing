<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <el-card class="w-96">
      <template #header>
        <div class="font-semibold">MealPing 后台登录</div>
      </template>
      <el-form @submit.prevent="onSubmit">
        <el-form-item label="访问密码">
          <el-input v-model="password" type="password" show-password placeholder="请输入后台密码" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="w-full" @click="onSubmit">
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { adminLogin } from '@/api/auth';
import { primeSpeech } from '@/utils/speech';

const password = ref('');
const loading = ref(false);
const route = useRoute();
const router = useRouter();

async function onSubmit() {
  if (!password.value) return;
  // First user gesture in this tab — unlock TTS so new-order voice plays later.
  primeSpeech();
  loading.value = true;
  try {
    await adminLogin(password.value);
    const redirect = (route.query.redirect as string) || '/admin/orders';
    router.push(redirect);
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>
