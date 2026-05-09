export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待处理',
  preparing: '制作中',
  completed: '已完成',
  canceled: '已取消',
};

export const NOTIFY_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  DISABLED: 'disabled',
} as const;

export type NotifyStatus = (typeof NOTIFY_STATUS)[keyof typeof NOTIFY_STATUS];

export const NOTIFY_STATUS_LABEL: Record<NotifyStatus, string> = {
  pending: '待发送',
  sent: '已发送',
  failed: '发送失败',
  disabled: '未启用',
};

export const ITEM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type ItemStatus = (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS];

/** Allowed status transitions for orders. */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'canceled'],
  preparing: ['completed', 'canceled'],
  completed: [],
  canceled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
