<template>
  <div class="flex items-center px-4 py-3 border-b last:border-b-0">
    <img
      v-if="item.imageUrl"
      :src="item.imageUrl"
      class="w-20 h-20 rounded-md object-cover bg-gray-100 mr-3"
      alt=""
    />
    <div v-else class="w-20 h-20 rounded-md bg-gray-100 mr-3 flex items-center justify-center text-gray-300 text-xs">
      暂无图片
    </div>
    <div class="flex-1 min-w-0">
      <div class="font-medium text-gray-900 truncate">{{ item.name }}</div>
      <div v-if="item.description" class="text-xs text-gray-500 truncate mt-1">{{ item.description }}</div>
      <div class="mt-2 flex items-center justify-between">
        <span class="text-brand-600 font-semibold">¥{{ centsToYuan(item.price) }}</span>
        <Stepper :value="qty" @incr="incr" @decr="decr" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MenuItem } from '@mealping/shared';
import { centsToYuan } from '@mealping/shared';
import { useCartStore } from '@/stores/cart';
import Stepper from '@/components/common/Stepper.vue';

const props = defineProps<{ item: MenuItem }>();
const cart = useCartStore();

const qty = computed(() => cart.lines.find((l) => l.item.id === props.item.id)?.quantity ?? 0);

function incr() {
  if (qty.value === 0) cart.addItem(props.item, 1);
  else cart.incr(props.item.id);
}
function decr() {
  cart.decr(props.item.id);
}
</script>
