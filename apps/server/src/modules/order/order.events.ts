import type { Request, Response } from 'express';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { Errors } from '../../utils/errors.js';

/**
 * Server-Sent Events stream of new-order notifications for the admin dashboard.
 * Auth: token via `?token=` query (EventSource cannot send custom headers).
 */
type Client = { id: number; res: Response };
const clients = new Set<Client>();
let nextId = 1;

export function broadcastNewOrder(orderId: number): void {
  const payload = `event: new-order\ndata: ${JSON.stringify({ orderId, ts: Date.now() })}\n\n`;
  for (const c of clients) {
    try {
      c.res.write(payload);
    } catch {
      // ignore
    }
  }
}

export const adminEventsRouter = Router();

adminEventsRouter.get('/orders', (req: Request, res: Response, next) => {
  try {
    const token = String(req.query.token ?? '');
    if (!token) throw Errors.unauthorized('缺少访问令牌');
    try {
      jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw Errors.unauthorized('令牌无效');
    }

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders?.();
    res.write('retry: 5000\n\n');
    res.write(': connected\n\n');

    const client: Client = { id: nextId++, res };
    clients.add(client);

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        // ignore
      }
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(client);
    });
  } catch (e) {
    next(e);
  }
});
