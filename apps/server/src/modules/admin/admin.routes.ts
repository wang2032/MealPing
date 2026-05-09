import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { signAdminToken, requireAdmin } from '../../middleware/auth.js';
import { Errors } from '../../utils/errors.js';

const loginSchema = z.object({
  password: z.string().min(1),
});

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', (req, res, next) => {
  try {
    const { password } = loginSchema.parse(req.body);
    if (password !== env.ADMIN_PASSWORD) {
      throw Errors.unauthorized('密码错误');
    }
    const token = signAdminToken();
    res.json({ data: { token } });
  } catch (e) {
    next(e);
  }
});

adminAuthRouter.get('/me', requireAdmin, (_req, res) => {
  res.json({ data: { sub: 'admin' } });
});
