<template>
  <div class="min-h-full bg-gray-50">
    <header class="sticky top-0 z-20 bg-white shadow-sm">
      <div class="px-4 py-3 flex items-center justify-between">
        <div>
          <div class="font-semibold text-lg">{{ shopName || 'MealPing' }}</div>
          <div class="text-xs text-gray-500">桌号：{{ cart.tableNo || '未指定' }}</div>
        </div>
        <div class="flex items-center gap-2">
          <van-button
            v-if="cart.tableNo"
            size="small"
            type="primary"
            plain
            @click="showMyOrders = true"
          >
            我的订单
          </van-button>
          <van-button v-if="!cart.tableNo" size="small" plain type="primary" @click="showTableDialog = true">
            填写桌号
          </van-button>
        </div>
      </div>
    </header>

    <div v-if="loading" class="p-6 text-center text-gray-400">加载菜单中...</div>
    <div v-else-if="categories.length === 0" class="p-6 text-center text-gray-400">暂无在售菜品</div>

    <div v-else class="flex" style="height: calc(100vh - 56px - 64px);">
      <!-- 左侧分类 -->
      <nav class="w-24 bg-gray-100 overflow-y-auto">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="px-2 py-3 text-center text-sm cursor-pointer border-l-4"
          :class="activeCategoryId === cat.id
            ? 'border-brand-500 bg-white text-brand-600 font-medium'
            : 'border-transparent text-gray-600'"
          @click="scrollToCategory(cat.id)"
        >
          {{ cat.name }}
        </div>
      </nav>

      <!-- 右侧菜品 -->
      <main ref="scrollEl" class="flex-1 overflow-y-auto bg-white" @scroll="onScroll">
        <section
          v-for="cat in categories"
          :key="cat.id"
          :ref="(el) => setCatRef(cat.id, el as HTMLElement)"
          class="border-b last:border-b-0"
        >
          <h2 class="px-4 py-2 text-sm text-gray-500 bg-gray-50">{{ cat.name }}</h2>
          <MenuItemRow v-for="it in cat.items" :key="it.id" :item="it" />
        </section>
        <div class="h-32"></div>
      </main>
    </div>

    <CartBar @open="showCart = true" @submit="submitOrder" />

    <van-popup v-model:show="showCart" position="bottom" round :style="{ maxHeight: '70vh' }">
      <CartSheet @close="showCart = false" @submit="submitOrder" />
    </van-popup>

    <van-dialog
      v-model:show="showTableDialog"
      title="请输入桌号"
      show-cancel-button
      @confirm="onTableConfirm"
    >
      <div class="p-4">
        <van-field v-model="tableInput" placeholder="例如 A1" />
      </div>
    </van-dialog>

    <MyOrdersSheet v-model:show="showMyOrders" :table-no="cart.tableNo" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { fetchPublicMenu, fetchShop } from '@/api/menu';
import { createOrder } from '@/api/order';
import { useCartStore } from '@/stores/cart';
import type { MenuCategoryWithItems, MenuItem } from '@mealping/shared';
import MenuItemRow from '@/components/menu/MenuItemRow.vue';
import CartBar from '@/components/menu/CartBar.vue';
import CartSheet from '@/components/menu/CartSheet.vue';
import MyOrdersSheet from '@/components/menu/MyOrdersSheet.vue';
import { primeSpeech } from '@/utils/speech';

const route = useRoute();
const router = useRouter();
const cart = useCartStore();

const shopName = ref('');
const categories = ref<MenuCategoryWithItems[]>([]);
const loading = ref(true);
const showCart = ref(false);
const showTableDialog = ref(false);
const showMyOrders = ref(false);
const tableInput = ref('');

const allItems = computed<MenuItem[]>(() => categories.value.flatMap((c) => c.items));

const scrollEl = ref<HTMLElement>();
const catEls = new Map<number, HTMLElement>();
const activeCategoryId = ref<number | null>(null);

function setCatRef(id: number, el: HTMLElement | null) {
  if (el) catEls.set(id, el);
}

function scrollToCategory(id: number) {
  const el = catEls.get(id);
  if (el && scrollEl.value) {
    scrollEl.value.scrollTo({ top: el.offsetTop - 4, behavior: 'smooth' });
    activeCategoryId.value = id;
  }
}

function onScroll() {
  if (!scrollEl.value) return;
  const top = scrollEl.value.scrollTop;
  let current = categories.value[0]?.id ?? null;
  for (const cat of categories.value) {
    const el = catEls.get(cat.id);
    if (el && el.offsetTop - 8 <= top) current = cat.id;
  }
  activeCategoryId.value = current;
}

async function load() {
  loading.value = true;
  try {
    const [shop, menu] = await Promise.all([fetchShop(), fetchPublicMenu()]);
    shopName.value = shop.name;
    categories.value = menu;
    activeCategoryId.value = menu[0]?.id ?? null;
    cart.hydrate(allItems.value);
    cart.reconcile(allItems.value);
    // URL ?table= always wins over localStorage to keep scanning a fresh QR reliable.
    readTableFromUrl();
  } catch (e) {
    showToast('菜单加载失败');
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function readTableFromUrl() {
  const t = String(route.query.table ?? '').trim();
  if (t) cart.setTableNo(t);
}

function onTableConfirm() {
  cart.setTableNo(tableInput.value.trim());
}

async function submitOrder() {
  if (cart.isEmpty) {
    showToast('购物车为空');
    return;
  }
  if (!cart.tableNo) {
    tableInput.value = '';
    showTableDialog.value = true;
    return;
  }
  // First user-gesture: prime TTS so the success-page voice plays without delay.
  primeSpeech();
  showLoadingToast({ message: '提交中...', forbidClick: true });
  try {
    const result = await createOrder({
      tableNo: cart.tableNo,
      remark: cart.remark || undefined,
      items: cart.lines.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity })),
    });
    cart.clear();
    closeToast();
    showCart.value = false;
    await nextTick();
    // Voice prompt is fired from OrderSuccessPage on mount — speaking here
    // would be cancelled when the route unmounts this component.
    router.push({ name: 'order-success', query: { orderNo: result.orderNo } });
  } catch (e) {
    closeToast();
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    showToast(msg || '下单失败，请稍后重试');
  }
}

onMounted(async () => {
  await load();
});
</script>
