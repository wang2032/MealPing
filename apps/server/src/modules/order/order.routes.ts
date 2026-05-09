import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
} from './order.schema.js';
import * as service from './order.service.js';
import { notifyOrderCreated } from '../notify/notify.service.js';
import { broadcastNewOrder } from './order.events.js';

const idParam = z.object({ id: z.coerce.number().int().positive() });
const orderNoParam = z.object({ orderNo: z.string().min(1).max(40) });

/** Public router: /api/orders */
export const publicOrderRouter = Router();

publicOrderRouter.post('/', async (req, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const order = await service.createOrder(body);

    // Fire-and-forget notification + SSE broadcast (must not block response)
    notifyOrderCreated(order.id).catch((err) => {
      console.error('[notify] failed', err);
    });
    broadcastNewOrder(order.id);

    res.status(201).json({
      data: {
        orderNo: order.orderNo,
        status: order.status,
        totalAmount: order.totalAmount,
      },
    });
  } catch (e) {
    next(e);
  }
});

publicOrderRouter.get('/:orderNo', async (req, res, next) => {
  try {
    const { orderNo } = orderNoParam.parse(req.params);
    const order = await service.getOrderByNo(orderNo);
    res.json({ data: order });
  } catch (e) {
    next(e);
  }
});

/** Admin router: /api/admin/orders */
export const adminOrderRouter = Router();
adminOrderRouter.use(requireAdmin);

adminOrderRouter.get('/', async (req, res, next) => {
  try {
    const q = listOrdersQuerySchema.parse(req.query);
    const result = await service.listOrdersAdmin(q);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

adminOrderRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const order = await service.getOrderById(id);
    res.json({ data: order });
  } catch (e) {
    next(e);
  }
});

adminOrderRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const { status } = updateOrderStatusSchema.parse(req.body);
    const order = await service.updateOrderStatus(id, status);
    res.json({ data: order });
  } catch (e) {
    next(e);
  }
});
