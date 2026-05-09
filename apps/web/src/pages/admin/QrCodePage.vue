<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold">桌台二维码</h2>
    </div>

    <el-card class="mb-4">
      <el-form :model="form" label-width="100px">
        <el-form-item label="桌号">
          <el-input
            v-model="form.tableInput"
            type="textarea"
            :rows="3"
            placeholder="一行一个，或用逗号分隔。例如：A1, A2, A3"
          />
          <div class="text-xs text-gray-400 mt-1">
            支持中文、字母、数字；每个桌号最多 20 字符
          </div>
        </el-form-item>
        <el-form-item label="菜单地址">
          <el-input v-model="form.baseUrl" placeholder="例如 https://menu.example.com（留空则使用服务端 PUBLIC_BASE_URL）" />
        </el-form-item>
        <el-form-item label="格式">
          <el-radio-group v-model="form.format">
            <el-radio-button label="png">PNG</el-radio-button>
            <el-radio-button label="svg">SVG</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="generating" @click="onGenerate">生成</el-button>
          <el-button v-if="items.length" @click="printAll">打印全部</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="items.length" id="qr-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <el-card
        v-for="it in items"
        :key="it.tableNo"
        body-style="padding: 12px; text-align: center;"
        class="qr-card"
      >
        <img :src="it.dataUrl" :alt="it.tableNo" class="w-full max-w-[200px] mx-auto" />
        <div class="font-semibold mt-2">桌号 {{ it.tableNo }}</div>
        <div class="text-xs text-gray-400 truncate" :title="it.url">{{ it.url }}</div>
        <el-button size="small" link @click="download(it)">下载</el-button>
      </el-card>
    </div>
    <div v-else class="text-gray-400 text-center py-12">
      请输入桌号并点击生成
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { adminGenerateQrCodes, type QrCodeItem } from '@/api/qrcode';

const form = reactive({
  tableInput: '',
  baseUrl: '',
  format: 'png' as 'png' | 'svg',
});

const items = ref<QrCodeItem[]>([]);
const generating = ref(false);

function parseTables(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,，;；\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

async function onGenerate() {
  const tables = parseTables(form.tableInput);
  if (tables.length === 0) {
    ElMessage.warning('请至少输入一个桌号');
    return;
  }
  generating.value = true;
  try {
    items.value = await adminGenerateQrCodes({
      tables,
      baseUrl: form.baseUrl || undefined,
      format: form.format,
    });
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    ElMessage.error(msg || '生成失败');
  } finally {
    generating.value = false;
  }
}

function download(it: QrCodeItem) {
  const a = document.createElement('a');
  a.href = it.dataUrl;
  a.download = `qrcode-${it.tableNo}.${it.format}`;
  a.click();
}

function printAll() {
  const w = window.open('', '_blank');
  if (!w) return;
  const html = `
    <html><head><title>桌台二维码</title>
    <style>
      body { font-family: sans-serif; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px; }
      .card { border: 1px solid #eee; padding: 12px; text-align: center; page-break-inside: avoid; }
      .card img { width: 200px; }
      .table-no { font-size: 18px; font-weight: 600; margin-top: 8px; }
      .url { font-size: 10px; color: #666; word-break: break-all; }
    </style>
    </head><body>
    <div class="grid">
      ${items.value
        .map(
          (it) => `
        <div class="card">
          <img src="${it.dataUrl}" alt="${it.tableNo}" />
          <div class="table-no">桌号 ${it.tableNo}</div>
          <div class="url">${it.url}</div>
        </div>`,
        )
        .join('')}
    </div>
    <script>window.onload = () => window.print();<\/script>
    </body></html>`;
  w.document.write(html);
  w.document.close();
}
</script>

<style scoped>
.qr-card :deep(.el-card__body) {
  padding: 12px;
}
</style>
