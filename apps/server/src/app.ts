import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { publicMenuRouter, adminMenuRouter } from './modules/menu/menu.routes.js';
import { publicOrderRouter, adminOrderRouter } from './modules/order/order.routes.js';
import { adminEventsRouter } from './modules/order/order.events.js';
import { adminAuthRouter } from './modules/admin/admin.routes.js';
import { adminNotifyRouter } from './modules/notify/notify.routes.js';
import { adminQrcodeRouter } from './modules/qrcode/qrcode.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  app.get('/api/shop', (_req, res) => {
    res.json({ data: { name: env.SHOP_NAME } });
  });

  // ===== Public =====
  app.use('/api/menu', publicMenuRouter);
  app.use('/api/orders', publicOrderRouter);

  // ===== Admin =====
  app.use('/api/admin/auth', adminAuthRouter);
  app.use('/api/admin/menu', adminMenuRouter);
  app.use('/api/admin/orders', adminOrderRouter);
  app.use('/api/admin/notify', adminNotifyRouter);
  app.use('/api/admin/qrcodes', adminQrcodeRouter);
  app.use('/api/admin/events', adminEventsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
