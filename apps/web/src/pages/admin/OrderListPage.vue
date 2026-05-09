<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">订单列表</h2>
      <div class="flex items-center gap-3">
        <el-radio-group v-model="statusFilter" size="small" @change="reload">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="pending">待处理</el-radio-button>
          <el-radio-button label="preparing">制作中</el-radio-button>
          <el-radio-button label="completed">已完成</el-radio-button>
          <el-radio-button label="canceled">已取消</el-radio-button>
        </el-radio-group>
        <el-button size="small" @click="reload">刷新</el-button>
        <el-tag v-if="sseConnected" type="success" size="small">实时</el-tag>
        <el-tag v-else type="info" size="small">离线</el-tag>
        <el-button size="small" :type="soundOn ? 'success' : 'info'" plain @click="toggleSound">
          {{ soundOn ? '🔊 语音' : '🔇 静音' }}
        </el-button>
      </div>
    </div>

    <el-table :data="orders" v-loading="loading" stripe>
      <el-table-column label="订单号" prop="orderNo" min-width="180" />
      <el-table-column label="桌号" prop="tableNo" width="80" />
      <el-table-column label="菜品" min-width="240">
        <template #default="{ row }">
          <span v-for="(it, i) in row.items" :key="it.id">
            {{ it.name }} x{{ it.quantity }}<span v-if="i < row.items.length - 1">，</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="金额" width="100">
        <template #default="{ row }">
          ¥{{ centsToYuan(row.totalAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="通知" width="100">
        <template #default="{ row }">
          <el-tag :type="notifyTagType(row.notifyStatus)" effect="plain" size="small">
            {{ notifyLabel(row.notifyStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="setStatus(row, 'preparing')">开始制作</el-button>
          <el-button v-if="row.status === 'preparing'" size="small" type="success" @click="setStatus(row, 'completed')">完成</el-button>
          <el-button v-if="row.status === 'pending' || row.status === 'preparing'" size="small" type="danger" @click="setStatus(row, 'canceled')">取消</el-button>
          <el-button size="small" link @click="viewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-3 flex justify-end">
      <el-button v-if="nextCursor" :loading="loadingMore" @click="loadMore">加载更多</el-button>
    </div>

    <el-dialog v-model="detailVisible" title="订单详情" width="500px">
      <div v-if="detail" class="text-sm space-y-2">
        <div><b>订单号：</b>{{ detail.orderNo }}</div>
        <div><b>桌号：</b>{{ detail.tableNo || '-' }}</div>
        <div><b>下单时间：</b>{{ formatTime(detail.createdAt) }}</div>
        <div><b>状态：</b>{{ statusLabel(detail.status) }}</div>
        <div><b>通知：</b>{{ notifyLabel(detail.notifyStatus) }}</div>
        <div><b>备注：</b>{{ detail.remark || '-' }}</div>
        <el-table :data="detail.items" border size="small">
          <el-table-column label="菜品" prop="name" />
          <el-table-column label="单价" width="90">
            <template #default="{ row }">¥{{ centsToYuan(row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" width="70" />
          <el-table-column label="小计" width="90">
            <template #default="{ row }">¥{{ centsToYuan(row.subtotal) }}</template>
          </el-table-column>
        </el-table>
        <div class="text-right text-brand-600 font-semibold">合计 ¥{{ centsToYuan(detail.totalAmount) }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  centsToYuan,
  ORDER_STATUS_LABEL,
  NOTIFY_STATUS_LABEL,
  type Order,
  type OrderStatus,
  type NotifyStatus,
} from '@mealping/shared';
import { adminListOrders, adminUpdateOrderStatus, adminGetOrder } from '@/api/order';
import { getAdminToken, apiBaseUrl } from '@/api/http';
import { speak, primeSpeech, chime } from '@/utils/speech';

const orders = ref<Order[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const nextCursor = ref<number | null>(null);
const statusFilter = ref<'' | OrderStatus>('');

const detail = ref<Order | null>(null);
const detailVisible = ref(false);

const sseConnected = ref(false);
const soundOn = ref(localStorage.getItem('mealping.admin.sound') !== 'off');
let es: EventSource | null = null;

function toggleSound() {
  soundOn.value = !soundOn.value;
  localStorage.setItem('mealping.admin.sound', soundOn.value ? 'on' : 'off');
  if (soundOn.value) {
    primeSpeech();
    speak('语音播报已开启');
  }
}

function statusLabel(s: string) {
  return ORDER_STATUS_LABEL[s as OrderStatus] ?? s;
}
function notifyLabel(s: string) {
  return NOTIFY_STATUS_LABEL[s as NotifyStatus] ?? s;
}
function statusTagType(s: string) {
  return { pending: 'warning', preparing: 'primary', completed: 'success', canceled: 'info' }[s] ?? 'info';
}
function notifyTagType(s: string) {
  return { sent: 'success', failed: 'danger', pending: 'warning', disabled: 'info' }[s] ?? 'info';
}
function formatTime(s: string) {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function reload() {
  loading.value = true;
  try {
    const res = await adminListOrders({
      status: statusFilter.value || undefined,
      limit: 50,
    });
    orders.value = res.data;
    nextCursor.value = res.nextCursor;
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!nextCursor.value) return;
  loadingMore.value = true;
  try {
    const res = await adminListOrders({
      status: statusFilter.value || undefined,
      cursor: nextCursor.value,
      limit: 50,
    });
    orders.value.push(...res.data);
    nextCursor.value = res.nextCursor;
  } finally {
    loadingMore.value = false;
  }
}

async function setStatus(order: Order, next: OrderStatus) {
  if (next === 'canceled') {
    try {
      await ElMessageBox.confirm(`确定取消订单 ${order.orderNo}？`, '取消订单');
    } catch {
      return;
    }
  }
  try {
    const updated = await adminUpdateOrderStatus(order.id, next);
    Object.assign(order, updated);
    ElMessage.success('状态已更新');
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '状态更新失败');
  }
}

async function viewDetail(order: Order) {
  detail.value = await adminGetOrder(order.id);
  detailVisible.value = true;
}

function setupSSE() {
  const token = getAdminToken();
  if (!token) return;
  const url = `${apiBaseUrl}/admin/events/orders?token=${encodeURIComponent(token)}`;
  es = new EventSource(url);
  es.onopen = () => (sseConnected.value = true);
  es.onerror = () => (sseConnected.value = false);
  es.addEventListener('new-order', () => {
    reload();
    if (soundOn.value) {
      chime();
      setTimeout(() => speak('叮咚，您有新订单'), 250);
    }
    ElMessage.success('收到新订单');
  });
}

onMounted(() => {
  reload();
  setupSSE();
});

onBeforeUnmount(() => {
  es?.close();
});
</script>
