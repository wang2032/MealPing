import { defineStore } from 'pinia';
import type { MenuItem } from '@mealping/shared';

export interface CartLine {
  item: MenuItem;
  quantity: number;
}

const STORAGE_KEY = 'mealping.cart.v1';

interface PersistedCart {
  tableNo: string;
  remark: string;
  lines: { itemId: number; quantity: number }[];
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    tableNo: '' as string,
    remark: '' as string,
    lines: [] as CartLine[],
  }),
  getters: {
    totalQuantity(state): number {
      return state.lines.reduce((s, l) => s + l.quantity, 0);
    },
    totalCents(state): number {
      return state.lines.reduce((s, l) => s + l.item.price * l.quantity, 0);
    },
    isEmpty(state): boolean {
      return state.lines.length === 0;
    },
  },
  actions: {
    addItem(item: MenuItem, qty = 1) {
      const existing = this.lines.find((l) => l.item.id === item.id);
      if (existing) existing.quantity += qty;
      else this.lines.push({ item, quantity: qty });
      this.persist();
    },
    setQuantity(itemId: number, qty: number) {
      const idx = this.lines.findIndex((l) => l.item.id === itemId);
      if (idx === -1) return;
      if (qty <= 0) this.lines.splice(idx, 1);
      else this.lines[idx]!.quantity = qty;
      this.persist();
    },
    incr(itemId: number) {
      const line = this.lines.find((l) => l.item.id === itemId);
      if (line) {
        line.quantity += 1;
        this.persist();
      }
    },
    decr(itemId: number) {
      const idx = this.lines.findIndex((l) => l.item.id === itemId);
      if (idx === -1) return;
      const line = this.lines[idx]!;
      if (line.quantity <= 1) this.lines.splice(idx, 1);
      else line.quantity -= 1;
      this.persist();
    },
    clear() {
      this.lines = [];
      this.remark = '';
      this.persist();
    },
    setTableNo(v: string) {
      this.tableNo = v;
      this.persist();
    },
    setRemark(v: string) {
      this.remark = v;
      this.persist();
    },
    /** Reconcile lines against latest menu — drop items that no longer exist or are inactive. */
    reconcile(menuItems: MenuItem[]) {
      const map = new Map(menuItems.map((m) => [m.id, m]));
      this.lines = this.lines
        .map((l) => {
          const fresh = map.get(l.item.id);
          if (!fresh || fresh.status !== 'active') return null;
          return { item: fresh, quantity: l.quantity };
        })
        .filter((l): l is CartLine => l !== null);
      this.persist();
    },
    hydrate(menuItems: MenuItem[]) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw) as PersistedCart;
        this.tableNo = data.tableNo ?? '';
        this.remark = data.remark ?? '';
        const map = new Map(menuItems.map((m) => [m.id, m]));
        this.lines = data.lines
          .map((l) => {
            const m = map.get(l.itemId);
            if (!m || m.status !== 'active') return null;
            return { item: m, quantity: l.quantity };
          })
          .filter((l): l is CartLine => l !== null);
      } catch {
        // ignore bad data
      }
    },
    persist() {
      const data: PersistedCart = {
        tableNo: this.tableNo,
        remark: this.remark,
        lines: this.lines.map((l) => ({ itemId: l.item.id, quantity: l.quantity })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
  },
});
