<template>
  <div class="inline-flex items-center gap-2">
    <button
      v-if="value > 0"
      class="w-7 h-7 rounded-full border border-brand-500 text-brand-500 flex items-center justify-center"
      @click="$emit('decr')"
    >−</button>
    <span v-if="value > 0" class="min-w-[20px] text-center text-sm">{{ value }}</span>
    <button
      class="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center"
      @click="$emit('incr')"
    >+</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: number }>();
defineEmits<{ incr: []; decr: [] }>();
</script>
