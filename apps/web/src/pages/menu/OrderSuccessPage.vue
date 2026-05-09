<template>
  <div class="min-h-full p-4 bg-gray-50">
    <div class="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 mt-8">
      <!-- Status header -->
      <div class="text-center">
        <div
          class="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl"
          :class="iconClass"
        >
          {{ iconChar }}
        </div>
        <h1 class="mt-4 text-lg font-semibold">{{ headerTitle }}</h1>
        <p class="text-sm text-gray-500 mt-1">{{ headerHint }}</p>
      </div>

      <!-- Status timeline -->
      <div v-if="order && order.status !== 'canceled'" class="mt-6 px-2">
        <div class="flex items-center text-xs">
          <Step :active="true" label="已下单" />
          <Connector :active="['preparing', 'completed'].includes(order.status)" />
          <Step :active="['preparing', 'completed'].includes(order.status)" label="制作中" />
          <Connector :active="order.status === 'completed'" />
          <Step :active="order.status === 'completed'" label="已完成" />
        </div>
      </div>

      <!-- Order details -->
      <div v-if="order" class="mt-6 text-sm space-y-2">
        <div class="flex justify-between">
          <span class="text-gray-500">订单号</span>
          <span class="font-mono text-xs">{{ order.orderNo }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">桌号</span>
          <span>{{ order.tableNo || '-' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">下单时间</span>
          <span>{{ formatTime(order.createdAt) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">总金额</span>
          <span class="text-brand-600 font-semibold">¥{{ centsToYuan(order.totalAmount) }}</span>
        </div>

        <div class="border-t pt-2 mt-2">
          <div
            v-for="it in order.items"
            :key="it.id"
            class="flex items-center justify-between py-1 text-xs text-gray-600"
          >
            <span>{{ it.name }} <span class="text-gray-400">x{{ it.quantity }}</span></span>
            <span>¥{{ centsToYuan(it.subtotal) }}</span>
          </div>
        </div>

        <div v-if="order.remark" class="text-xs text-gray-400">备注：{{ order.remark }}</div>
      </div>

      <div v-else-if="loading" class="mt-6 text-gray-400 text-sm text-center">加载订单中...</div>
      <div v-else class="mt-6 text-gray-400 text-sm text-center">订单未找到</div>

      <!-- Footer hint -->
      <div v-if="order && polling" class="mt-4 text-center text-xs text-gray-400">
        正在自动跟踪状态 · 每 5 秒刷新
      </div>

      <!-- Actions -->
      <div class="mt-6 flex gap-3 justify-center">
        <van-button plain :loading="loading" @click="refresh">立即刷新</van-button>
        <van-button type="primary" @click="goMenu">返回菜单</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, h, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchOrderByNo } from '@/api/order';
import {
  centsToYuan,
  type Order,
  type OrderStatus,
} from '@mealping/shared';
import { speak } from '@/utils/speech';

const route = useRoute();
const router = useRouter();
const order = ref<Order | null>(null);
const loading = ref(true);
const polling = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const TERMINAL: OrderStatus[] = ['completed', 'canceled'];

const headerTitle = computed(() => {
  if (!order.value) return '订单提交';
  switch (order.value.status) {
    case 'pending':
      return '订单已提交';
    case 'preparing':
      return '正在为您制作';
    case 'completed':
      return '已完成，请取餐';
    case 'canceled':
      return '订单已取消';
    default:
      return '订单提交';
  }
});

const headerHint = computed(() => {
  if (!order.value) return '正在确认...';
  switch (order.value.status) {
    case 'pending':
      return '已通知店家，请稍候';
    case 'preparing':
      return '后厨正在加紧制作';
    case 'completed':
      return '请到取餐处领取，慢用~';
    case 'canceled':
      return '如有疑问请联系店员';
    default:
      return '';
  }
});

const iconClass = computed(() => {
  const s = order.value?.status;
  if (s === 'completed') return 'bg-green-100 text-green-600';
  if (s === 'canceled') return 'bg-gray-200 text-gray-500';
  if (s === 'preparing') return 'bg-blue-100 text-blue-600';
  return 'bg-yellow-100 text-yellow-600';
});

const iconChar = computed(() => {
  const s = order.value?.status;
  if (s === 'completed') return '✓';
  if (s === 'canceled') return '×';
  if (s === 'preparing') return '🍳';
  return '⏳';
});

function formatTime(s: string) {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function refresh() {
  const orderNo = String(route.query.orderNo ?? '');
  if (!orderNo) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    order.value = await fetchOrderByNo(orderNo);
  } catch {
    order.value = null;
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  if (pollTimer) return;
  polling.value = true;
  pollTimer = setInterval(() => {
    refresh();
  }, 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  polling.value = false;
}

watch(
  () => order.value?.status,
  (next, prev) => {
    if (next && prev && next !== prev) {
      if (next === 'completed') {
        speak('您的餐已做好，请前往取餐');
      } else if (next === 'preparing') {
        speak('您的订单已开始制作');
      } else if (next === 'canceled') {
        speak('您的订单已取消');
      }
    }
    if (next && TERMINAL.includes(next)) stopPolling();
  },
);

function goMenu() {
  router.push({
    name: 'menu',
    query: order.value?.tableNo ? { table: order.value.tableNo } : {},
  });
}

onMounted(async () => {
  await refresh();
  if (order.value && !TERMINAL.includes(order.value.status as OrderStatus)) {
    startPolling();
  }
});

onBeforeUnmount(stopPolling);

const Step = (props: { active: boolean; label: string }) =>
  h(
    'div',
    {
      class: ['flex flex-col items-center', props.active ? 'text-brand-600' : 'text-gray-300'],
    },
    [
      h('div', {
        class: [
          'w-3 h-3 rounded-full border-2',
          props.active ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-300',
        ],
      }),
      h('span', { class: 'mt-1' }, props.label),
    ],
  );

const Connector = (props: { active: boolean }) =>
  h('div', {
    class: ['flex-1 h-0.5 mx-1 mb-4', props.active ? 'bg-brand-500' : 'bg-gray-200'],
  });
</script>
