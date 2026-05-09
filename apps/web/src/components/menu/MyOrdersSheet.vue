<template>
  <van-popup
    :show="show"
    position="bottom"
    round
    :style="{ height: '80vh' }"
    @update:show="(v) => emit('update:show', v)"
  >
    <div class="flex flex-col h-full">
      <header class="flex items-center justify-between px-4 py-3 border-b">
        <div class="font-medium">
          我的订单
          <span class="text-xs text-gray-400 ml-2">桌号 {{ tableNo || '-' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="lastUpdatedAt" class="text-xs text-gray-400">
            {{ formatRelative(lastUpdatedAt) }}
          </span>
          <button class="text-sm text-brand-500" @click="reload(true)">刷新</button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto bg-gray-50">
        <div v-if="loading && orders.length === 0" class="p-8 text-center text-gray-400">
          加载中...
        </div>
        <div v-else-if="orders.length === 0" class="p-8 text-center text-gray-400">
          这一桌还没有订单
        </div>

        <div
          v-for="o in orders"
          :key="o.id"
          class="bg-white mx-3 my-3 rounded-lg shadow-sm overflow-hidden"
        >
          <div class="px-4 py-3 flex items-center justify-between border-b">
            <div>
              <div class="text-xs text-gray-400">{{ formatTime(o.createdAt) }}</div>
              <div class="text-xs text-gray-400 mt-0.5">单号 {{ o.orderNo }}</div>
            </div>
            <span
              class="px-2 py-1 rounded-full text-xs font-medium"
              :class="statusBadgeClass(o.status)"
            >
              {{ statusLabel(o.status) }}
            </span>
          </div>

          <div class="px-4 py-2">
            <div
              v-for="it in o.items"
              :key="it.id"
              class="flex items-center justify-between py-1 text-sm"
            >
              <span class="text-gray-700">{{ it.name }} <span class="text-gray-400">x{{ it.quantity }}</span></span>
              <span class="text-gray-500">¥{{ centsToYuan(it.subtotal) }}</span>
            </div>
            <div v-if="o.remark" class="text-xs text-gray-400 mt-1">备注：{{ o.remark }}</div>
          </div>

          <div class="px-4 py-2 bg-gray-50 flex items-center justify-between">
            <span class="text-xs text-gray-500">合计</span>
            <span class="text-brand-600 font-semibold">¥{{ centsToYuan(o.totalAmount) }}</span>
          </div>

          <!-- Status timeline -->
          <div class="px-4 pb-3">
            <div class="flex items-center text-xs">
              <Step :active="true" label="已下单" />
              <Connector :active="['preparing', 'completed'].includes(o.status)" />
              <Step :active="['preparing', 'completed'].includes(o.status)" label="制作中" />
              <Connector :active="o.status === 'completed'" />
              <Step :active="o.status === 'completed'" label="已完成" />
            </div>
            <div v-if="o.status === 'canceled'" class="mt-2 text-center text-xs text-red-500">
              此订单已取消
            </div>
          </div>
        </div>
      </div>

      <footer class="px-4 py-3 border-t text-center text-xs text-gray-400">
        每 5 秒自动刷新 · 仅显示最近 24 小时的订单
      </footer>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, h } from 'vue';
import { fetchOrdersByTable } from '@/api/order';
import {
  centsToYuan,
  ORDER_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from '@mealping/shared';

const props = defineProps<{ show: boolean; tableNo: string }>();
const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const orders = ref<Order[]>([]);
const loading = ref(false);
const lastUpdatedAt = ref<number>(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;

function statusLabel(s: string) {
  return ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
}

function statusBadgeClass(s: string) {
  return {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    canceled: 'bg-gray-100 text-gray-500',
  }[s] ?? 'bg-gray-100 text-gray-500';
}

function formatTime(s: string) {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRelative(ts: number) {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 5) return '刚刚';
  if (diff < 60) return `${diff} 秒前`;
  return `${Math.floor(diff / 60)} 分钟前`;
}

async function reload(force = false) {
  if (!props.tableNo) return;
  if (loading.value && !force) return;
  loading.value = true;
  try {
    orders.value = await fetchOrdersByTable(props.tableNo);
    lastUpdatedAt.value = Date.now();
  } finally {
    loading.value = false;
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => reload(), 5000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      reload(true);
      startPolling();
    } else {
      stopPolling();
    }
  },
);

onBeforeUnmount(stopPolling);

// Inline tiny step components (kept here to avoid extra files)
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
