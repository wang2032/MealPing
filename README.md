# MealPing

> 轻量扫码点单系统 · QR-code H5 ordering for small shops.

**MealPing** 让顾客扫码看菜单、下单，店主在后台收到订单并通过微信公众号收到提醒。
项目刻意保持轻量：没有支付、没有配送、没有会员，方便个人玩具或小店快速跑通。

## 主要能力

- 顾客扫码进入菜单页（`/menu?table=A1`），无需注册
- 购物车持久化、备注、桌号自动识别
- 后端事务一致性 + 价格服务端校验
- 后台订单管理：状态流转、SSE 实时推送、提示音
- 菜单管理：分类、菜品、上下架、排序
- 微信公众号测试号模板消息通知 + 通知日志

## 技术栈

| 层级 | 选型 |
| --- | --- |
| 后端 | Node.js 20 + Express + TypeScript + Prisma |
| 数据库 | PostgreSQL 16 |
| 前端 | Vue 3 + Vite + TailwindCSS + Element Plus + Vant |
| 部署 | Docker Compose + Nginx |
| 包管理 | pnpm 9 workspaces |

## 快速开始

```bash
pnpm install
cp .env.example apps/server/.env
docker compose up -d postgres
pnpm db:migrate && pnpm db:seed
pnpm dev
```

| 入口 | 地址 |
| --- | --- |
| 顾客菜单 | <http://localhost:5173/menu?table=A1> |
| 后台 | <http://localhost:5173/admin/login>（默认密码 `admin123`） |
| 健康检查 | <http://localhost:3000/api/health> |

## 文档

完整开发与部署文档见 [`docs/`](./docs/README.md)：

- [01 项目总览](./docs/01-overview.md)
- [02 架构与目录](./docs/02-architecture.md)
- [03 数据模型](./docs/03-data-model.md)
- [04 API 规范](./docs/04-api.md)
- [05 前端](./docs/05-frontend.md)
- [06 微信通知接入](./docs/06-notify.md)
- [07 本地开发](./docs/07-development.md)
- [08 部署](./docs/08-deployment.md)
- [09 路线图](./docs/09-roadmap.md)

## License

MIT
