<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">通知日志</h2>
      <el-button size="small" @click="reload">刷新</el-button>
    </div>
    <el-table :data="logs" v-loading="loading" stripe>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="订单号" min-width="180">
        <template #default="{ row }">{{ row.order.orderNo }}</template>
      </el-table-column>
      <el-table-column label="桌号" width="100">
        <template #default="{ row }">{{ row.order.tableNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="渠道" prop="channel" width="180" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'sent' ? 'success' : 'danger'" size="small">
            {{ row.status === 'sent' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" prop="errorMsg" min-width="240" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'failed'"
            size="small"
            type="primary"
            link
            :loading="retrying === row.orderId"
            @click="onRetry(row.orderId)"
          >重发</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { adminListNotifyLogs, adminRetryNotify, type NotifyLog } from '@/api/notify';

const logs = ref<NotifyLog[]>([]);
const loading = ref(false);
const retrying = ref<number | null>(null);

function formatTime(s: string) {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function reload() {
  loading.value = true;
  try {
    logs.value = await adminListNotifyLogs();
  } finally {
    loading.value = false;
  }
}

async function onRetry(orderId: number) {
  retrying.value = orderId;
  try {
    const result = await adminRetryNotify(orderId);
    if (result.notifyStatus === 'sent') ElMessage.success('重发成功');
    else if (result.notifyStatus === 'failed') ElMessage.warning('重发仍失败，请查看日志');
    else ElMessage.info(`当前状态：${result.notifyStatus}`);
    await reload();
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '重发失败');
  } finally {
    retrying.value = null;
  }
}

onMounted(reload);
</script>
