<template>
  <div class="flex flex-col" style="max-height: 70vh;">
    <header class="flex items-center justify-between px-4 py-3 border-b">
      <div class="font-medium">购物车</div>
      <button class="text-sm text-gray-500" @click="onClear">清空</button>
    </header>

    <div class="flex-1 overflow-y-auto">
      <div v-if="cart.isEmpty" class="p-8 text-center text-gray-400">购物车是空的</div>
      <div
        v-for="line in cart.lines"
        :key="line.item.id"
        class="flex items-center px-4 py-3 border-b last:border-b-0"
      >
        <div class="flex-1 min-w-0">
          <div class="text-gray-900 truncate">{{ line.item.name }}</div>
          <div class="text-xs text-brand-600">¥{{ centsToYuan(line.item.price) }}</div>
        </div>
        <Stepper :value="line.quantity" @incr="cart.incr(line.item.id)" @decr="cart.decr(line.item.id)" />
      </div>
    </div>

    <div class="px-4 py-3 border-t">
      <van-field v-model="remarkLocal" placeholder="备注，例如少辣" maxlength="100" />
    </div>

    <div class="flex items-center justify-between px-4 py-3 bg-gray-50">
      <div>
        <div class="text-xs text-gray-500">合计</div>
        <div class="text-brand-600 text-lg font-semibold">¥{{ centsToYuan(cart.totalCents) }}</div>
      </div>
      <button
        class="px-6 py-2 rounded-full text-white font-medium"
        :class="cart.isEmpty ? 'bg-gray-300' : 'bg-brand-500'"
        :disabled="cart.isEmpty"
        @click="$emit('submit')"
      >
        提交订单
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { showConfirmDialog } from 'vant';
import { centsToYuan } from '@mealping/shared';
import { useCartStore } from '@/stores/cart';
import Stepper from '@/components/common/Stepper.vue';

const cart = useCartStore();
defineEmits<{ close: []; submit: [] }>();

const remarkLocal = computed({
  get: () => cart.remark,
  set: (v: string) => cart.setRemark(v),
});

async function onClear() {
  if (cart.isEmpty) return;
  try {
    await showConfirmDialog({ title: '清空购物车？' });
    cart.clear();
  } catch {
    // cancelled
  }
}
</script>
