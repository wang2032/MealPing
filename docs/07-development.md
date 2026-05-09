# 07 本地开发

## 7.1 准备

- Node.js ≥ 20
- pnpm ≥ 9（`corepack enable && corepack prepare pnpm@9.0.0 --activate`）
- Docker（用于本地起 PostgreSQL）

## 7.2 安装依赖

```bash
pnpm install
```

## 7.3 启动 PostgreSQL

```bash
docker compose up -d postgres
```

或自己启动并修改 `apps/server/.env` 中的 `DATABASE_URL`。

## 7.4 配置环境变量

```bash
cp .env.example apps/server/.env
# 至少修改 ADMIN_PASSWORD / JWT_SECRET
```

`apps/web` 一般不需要 `.env`，开发时通过 Vite proxy 转发到 :3000。

## 7.5 数据库初始化

```bash
pnpm db:migrate     # 应用 prisma migrations
pnpm db:seed        # 注入演示菜单（3 分类 + 6 菜品）
```

## 7.6 启动开发服务

```bash
pnpm dev
```

会并行启动：

- `@mealping/server`：tsx watch，端口 3000
- `@mealping/web`：vite，端口 5173

打开 <http://localhost:5173/menu?table=A1> 即可。

## 7.7 调试技巧

- 后台密码默认 `admin123`，在 `.env` 中修改
- Prisma Studio：`pnpm db:studio`
- 单独启某个包：`pnpm dev:server` / `pnpm dev:web`
- 查看真实 SQL：在 `apps/server/src/db/prisma.ts` 把 log 加上 `'query'`
- 模拟通知失败：把 `WECHAT_TEMPLATE_ID` 改成无效值，下单后查看 `/admin/notify`

## 7.8 常见问题

**Q：`pnpm dev` 报 `Module '@mealping/shared' not found`**  
A：确认 `pnpm install` 在仓库根目录执行过；`packages/shared` 通过 workspace 协议链接。

**Q：Prisma 报 `P1001: Can't reach database server`**  
A：确认 `docker compose up -d postgres` 已启动并 healthy；`DATABASE_URL` 主机指向 `localhost`（开发）或 `postgres`（容器内）。

**Q：前端 401 一直跳登录**  
A：`localStorage` 中 `mealping.admin.token` 可能过期，重新登录即可。

**Q：后台收不到 SSE 推送**  
A：检查浏览器 Network → EventStream，确认 `/api/admin/events/orders` 返回 200；如经过 Nginx 反代，需 `proxy_buffering off`（已在 `apps/web/nginx.conf` 中配置）。
