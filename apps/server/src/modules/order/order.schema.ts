import { z } from 'zod';
import { ORDER_STATUS } from '@mealping/shared';

export const createOrderSchema = z.object({
  tableNo: z.string().trim().max(20).optional(),
  remark: z.string().trim().max(200).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.number().int().positive(),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, '购物车不能为空'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELED,
  ]),
});

export const listOrdersQuerySchema = z.object({
  status: z
    .enum([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.CANCELED,
    ])
    .optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  cursor: z.coerce.number().int().positive().optional(),
});
