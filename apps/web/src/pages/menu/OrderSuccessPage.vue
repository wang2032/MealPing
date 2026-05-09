<template>
  <div class="min-h-full p-6 flex flex-col items-center bg-gray-50">
    <div class="w-full max-w-md bg-white rounded-lg shadow-sm p-6 mt-12 text-center">
      <div class="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl">
        ✓
      </div>
      <h1 class="mt-4 text-lg font-semibold">订单已提交</h1>
      <p class="text-sm text-gray-500 mt-1">已通知店家，请耐心等候</p>

      <div v-if="order" class="mt-6 text-left text-sm space-y-2">
        <div class="flex justify-between"><span class="text-gray-500">订单号</span><span>{{ order.orderNo }}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">桌号</span><span>{{ order.tableNo || '-' }}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">总金额</span><span class="text-brand-600 font-semibold">¥{{ centsToYuan(order.totalAmount) }}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">状态</span><span>{{ statusLabel }}</span></div>
      </div>
      <div v-else-if="loading" class="mt-6 text-gray-400 text-sm">加载订单中...</div>
      <div v-else class="mt-6 text-gray-400 text-sm">订单详情未找到</div>

      <div class="mt-8 flex gap-3 justify-center">
        <van-button plain @click="refresh">刷新状态</van-button>
        <van-button type="primary" @click="goMenu">返回菜单</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchOrderByNo } from '@/api/order';
import { centsToYuan, ORDER_STATUS_LABEL, type Order, type OrderStatus } from '@mealping/shared';

const route = useRoute();
const router = useRouter();
const order = ref<Order | null>(null);
const loading = ref(true);

const statusLabel = computed(() =>
  order.value ? ORDER_STATUS_LABEL[order.value.status as OrderStatus] : '',
);

async function refresh() {
  const orderNo = String(route.query.orderNo ?? '');
  if (!orderNo) return;
  loading.value = true;
  try {
    order.value = await fetchOrderByNo(orderNo);
  } catch {
    order.value = null;
  } finally {
    loading.value = false;
  }
}

function goMenu() {
  router.push({ name: 'menu', query: order.value?.tableNo ? { table: order.value.tableNo } : {} });
}

onMounted(refresh);
</script>
