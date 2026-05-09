import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Errors } from '../utils/errors.js';

export interface AdminTokenPayload {
  sub: 'admin';
  iat: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminTokenPayload;
  }
}

export function signAdminToken(): string {
  return jwt.sign({ sub: 'admin' } satisfies Omit<AdminTokenPayload, 'iat'>, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(Errors.unauthorized('缺少访问令牌'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
    if (payload.sub !== 'admin') {
      return next(Errors.unauthorized('无效令牌'));
    }
    req.admin = payload;
    next();
  } catch {
    next(Errors.unauthorized('令牌无效或已过期'));
  }
}
