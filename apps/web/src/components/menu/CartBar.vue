<template>
  <div class="fixed bottom-0 inset-x-0 z-30 bg-white border-t shadow-md">
    <div class="flex items-center px-4 py-3 gap-3">
      <div class="relative cursor-pointer" @click="$emit('open')">
        <div class="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center text-xl">🛒</div>
        <span
          v-if="cart.totalQuantity > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5"
        >{{ cart.totalQuantity }}</span>
      </div>
      <div class="flex-1">
        <div class="text-brand-600 font-semibold">¥{{ centsToYuan(cart.totalCents) }}</div>
        <div class="text-xs text-gray-400">点击查看购物车</div>
      </div>
      <button
        class="px-5 py-2 rounded-full font-medium text-white"
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
import { centsToYuan } from '@mealping/shared';
import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
defineEmits<{ open: []; submit: [] }>();
</script>
