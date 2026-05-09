import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { sendTemplateMessage } from './wechat.client.js';
import { Errors } from '../../utils/errors.js';
import { centsToYuan, ORDER_STATUS_LABEL, type OrderStatus } from '@mealping/shared';

interface OrderForNotify {
  id: number;
  orderNo: string;
  tableNo: string | null;
  remark: string | null;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: { name: string; quantity: number }[];
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildSummary(order: OrderForNotify) {
  const itemsLine = order.items.map((it) => `${it.name} x${it.quantity}`).join('，');
  return {
    title: '新订单提醒',
    table: order.tableNo ?? '未指定',
    items: itemsLine,
    remark: order.remark || '无',
    amount: `${centsToYuan(order.totalAmount)} 元`,
    time: formatTime(order.createdAt),
    status: ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status,
  };
}

/**
 * Send notification for a newly created order. Failure never throws — it is
 * persisted to NotifyLog and reflected in order.notifyStatus.
 */
export async function notifyOrderCreated(orderId: number): Promise<void> {
  if (env.NOTIFY_CHANNEL === 'disabled') {
    await prisma.order.update({
      where: { id: orderId },
      data: { notifyStatus: 'disabled' },
    });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const summary = buildSummary(order);

  if (env.NOTIFY_CHANNEL === 'wechat_test_account') {
    if (!env.WECHAT_TEMPLATE_ID || !env.WECHAT_ADMIN_OPENID) {
      await persistFailure(orderId, '微信模板/openid 未配置', null);
      return;
    }
    try {
      const result = await sendTemplateMessage({
        toUser: env.WECHAT_ADMIN_OPENID,
        templateId: env.WECHAT_TEMPLATE_ID,
        data: {
          first: { value: summary.title },
          keyword1: { value: summary.table },
          keyword2: { value: summary.items },
          keyword3: { value: summary.amount },
          keyword4: { value: summary.time },
          remark: { value: `备注：${summary.remark}` },
        },
      });
      if (result.ok) {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: { notifyStatus: 'sent' },
          }),
          prisma.notifyLog.create({
            data: {
              orderId,
              channel: 'wechat_test_account',
              status: 'sent',
              request: JSON.stringify(summary),
              response: JSON.stringify(result.raw),
            },
          }),
        ]);
      } else {
        await persistFailure(orderId, '微信接口返回错误', result.raw);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await persistFailure(orderId, msg, null);
    }
  }
}

async function persistFailure(orderId: number, errorMsg: string, raw: unknown) {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { notifyStatus: 'failed' },
    }),
    prisma.notifyLog.create({
      data: {
        orderId,
        channel: env.NOTIFY_CHANNEL,
        status: 'failed',
        errorMsg,
        response: raw ? JSON.stringify(raw) : null,
      },
    }),
  ]);
}

/** List recent notify logs for admin diagnostic view. */
export function listRecentNotifyLogs(limit = 50) {
  return prisma.notifyLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      order: { select: { orderNo: true, tableNo: true } },
    },
  });
}

/**
 * Reset an order's notify status to `pending` and re-trigger sending.
 * Throws AppError(404) if the order does not exist; never throws on send failure
 * (failure is recorded in NotifyLog).
 */
export async function retryNotify(orderId: number): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw Errors.notFound('订单不存在');
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { notifyStatus: 'pending' },
  });
  await notifyOrderCreated(orderId);
}
