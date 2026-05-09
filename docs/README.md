# MealPing 开发文档

> 项目代号：**MealPing** —— 轻量扫码点单系统  
> 文档版本：v0.1（对应代码 Phase 1 + Phase 2）

## 目录

- [01-overview.md](./01-overview.md) — 项目总览、范围、角色
- [02-architecture.md](./02-architecture.md) — 系统架构、技术选型、目录结构
- [03-data-model.md](./03-data-model.md) — 数据库设计、Prisma schema 说明
- [04-api.md](./04-api.md) — REST API 与 SSE 接口规范
- [05-frontend.md](./05-frontend.md) — 前端路由、页面、状态管理
- [06-notify.md](./06-notify.md) — 微信公众号测试号通知接入指南
- [07-development.md](./07-development.md) — 本地开发、调试、常见问题
- [08-deployment.md](./08-deployment.md) — Docker 部署与生产配置
- [09-roadmap.md](./09-roadmap.md) — 阶段规划与后续扩展

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量
cp .env.example apps/server/.env

# 3. 启动 PostgreSQL（任选其一）
docker compose up -d postgres

# 4. 初始化数据库
pnpm db:migrate
pnpm db:seed

# 5. 启动开发服务
pnpm dev
```

- 顾客端：<http://localhost:5173/menu?table=A1>
- 后台：<http://localhost:5173/admin/login>（默认密码 `admin123`）
- API：<http://localhost:3000/api/health>
