import { prisma } from '../../db/prisma.js';
import { Errors } from '../../utils/errors.js';
import { generateOrderNo } from '../../utils/orderNo.js';
import { canTransition, type OrderStatus } from '@mealping/shared';
import type { CreateOrderInput } from './order.schema.js';
import type { z } from 'zod';
import type { listOrdersQuerySchema } from './order.schema.js';

/**
 * Create an order. Server re-reads prices from the DB (do NOT trust client),
 * validates that all items are active, and writes order + items in a single tx.
 */
export async function createOrder(input: CreateOrderInput) {
  const ids = input.items.map((i) => i.menuItemId);

  return prisma.$transaction(async (tx) => {
    const menuItems = await tx.menuItem.findMany({
      where: { id: { in: ids } },
    });
    const map = new Map(menuItems.map((m) => [m.id, m]));

    const lines = input.items.map((line) => {
      const m = map.get(line.menuItemId);
      if (!m) throw Errors.badRequest(`菜品不存在: ${line.menuItemId}`);
      if (m.status !== 'active') throw Errors.badRequest(`菜品已下架: ${m.name}`);
      const subtotal = m.price * line.quantity;
      return {
        menuItemId: m.id,
        name: m.name,
        unitPrice: m.price,
        quantity: line.quantity,
        subtotal,
      };
    });

    const totalAmount = lines.reduce((sum, l) => sum + l.subtotal, 0);

    const order = await tx.order.create({
      data: {
        orderNo: generateOrderNo(),
        tableNo: input.tableNo?.trim() || null,
        remark: input.remark?.trim() || null,
        totalAmount,
        status: 'pending',
        notifyStatus: 'pending',
        items: { create: lines },
      },
      include: { items: true },
    });

    return order;
  });
}

export async function getOrderByNo(orderNo: string) {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true },
  });
  if (!order) throw Errors.notFound('订单不存在');
  return order;
}

/**
 * Public lookup: recent orders for a given table number.
 * Returns last 24h of orders so customers can track multiple rounds during one meal.
 */
export async function listOrdersByTable(tableNo: string, limit = 20) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.order.findMany({
    where: {
      tableNo,
      createdAt: { gte: since },
    },
    orderBy: { id: 'desc' },
    take: limit,
    include: { items: true },
  });
}

export async function getOrderById(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) throw Errors.notFound('订单不存在');
  return order;
}

export async function listOrdersAdmin(q: z.infer<typeof listOrdersQuerySchema>) {
  const where = q.status ? { status: q.status } : {};
  const orders = await prisma.order.findMany({
    where,
    orderBy: { id: 'desc' },
    take: q.limit + 1,
    ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    include: { items: true },
  });
  const hasMore = orders.length > q.limit;
  const data = hasMore ? orders.slice(0, q.limit) : orders;
  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.id : null;
  return { data, nextCursor };
}

export async function updateOrderStatus(id: number, next: OrderStatus) {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound('订单不存在');
  if (existing.status === next) return existing;
  if (!canTransition(existing.status as OrderStatus, next)) {
    throw Errors.conflict(`不允许从 ${existing.status} 变更为 ${next}`);
  }
  return prisma.order.update({ where: { id }, data: { status: next } });
}
