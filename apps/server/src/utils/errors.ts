export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  badRequest: (msg = '参数错误', details?: unknown) =>
    new AppError('BAD_REQUEST', msg, 400, details),
  unauthorized: (msg = '未授权') => new AppError('UNAUTHORIZED', msg, 401),
  forbidden: (msg = '无权访问') => new AppError('FORBIDDEN', msg, 403),
  notFound: (msg = '资源不存在') => new AppError('NOT_FOUND', msg, 404),
  conflict: (msg = '状态冲突') => new AppError('CONFLICT', msg, 409),
  internal: (msg = '服务器内部错误') => new AppError('INTERNAL', msg, 500),
};
