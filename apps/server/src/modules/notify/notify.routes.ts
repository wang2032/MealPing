import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import { listRecentNotifyLogs, retryNotify } from './notify.service.js';
import { Errors } from '../../utils/errors.js';
import { prisma } from '../../db/prisma.js';

export const adminNotifyRouter = Router();
adminNotifyRouter.use(requireAdmin);

adminNotifyRouter.get('/logs', async (_req, res, next) => {
  try {
    const data = await listRecentNotifyLogs(100);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

const idParam = z.object({ orderId: z.coerce.number().int().positive() });

adminNotifyRouter.post('/retry/:orderId', async (req, res, next) => {
  try {
    const { orderId } = idParam.parse(req.params);
    await retryNotify(orderId);
    const fresh = await prisma.order.findUnique({
      where: { id: orderId },
      select: { notifyStatus: true },
    });
    if (!fresh) throw Errors.notFound('订单不存在');
    res.json({ data: { orderId, notifyStatus: fresh.notifyStatus } });
  } catch (e) {
    next(e);
  }
});
