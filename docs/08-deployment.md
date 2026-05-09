# 08 部署

## 8.1 一键 Docker Compose

仓库根目录提供 `docker-compose.yml`，包含三个服务：

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| postgres | 5432 | PostgreSQL 16 |
| server | 3000 | Express API |
| web | 8080 | Nginx 静态 + `/api` 反代 |

启动：

```bash
# 1. 准备生产环境变量（建议放仓库外的 .env 文件，由 docker compose 自动注入）
cat > .env.production <<EOF
ADMIN_PASSWORD=<your-strong-password>
JWT_SECRET=<at-least-32-random-chars>
SHOP_NAME=我的小馆
PUBLIC_BASE_URL=https://menu.example.com
NOTIFY_CHANNEL=wechat_test_account
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
WECHAT_TEMPLATE_ID=...
WECHAT_ADMIN_OPENID=...
EOF

# 2. 构建并启动
docker compose --env-file .env.production up -d --build
```

容器启动时 `apps/server/Dockerfile` 会自动执行 `prisma migrate deploy`，无需手动跑 migration。

首次部署后种子数据：

```bash
docker compose exec server sh -c "cd /app/apps/server && node -e \"require('./prisma/seed.ts')\""
# 或更简单：登入 server 容器后 npx tsx prisma/seed.ts
```

## 8.2 反向代理（生产）

仅暴露 `web`（80/443），由其内部 Nginx 反代 `/api/`。如果你已有外层 Nginx，可让外层直接代理到 `web:80`，或绕过 `web` 直接：

```nginx
server {
  listen 443 ssl;
  server_name menu.example.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
  }
  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_buffering off;     # 关键：保留 SSE
    proxy_read_timeout 1h;
  }
}
```

## 8.3 备份

```bash
# 备份
docker compose exec postgres pg_dump -U mealping mealping > backup-$(date +%F).sql

# 恢复
cat backup.sql | docker compose exec -T postgres psql -U mealping -d mealping
```

## 8.4 升级

```bash
git pull
docker compose --env-file .env.production up -d --build
```

`prisma migrate deploy` 会自动应用新增 migration；不会回退表结构。

## 8.5 安全清单

- [ ] `ADMIN_PASSWORD` 不使用默认值
- [ ] `JWT_SECRET` ≥ 32 位随机
- [ ] `.env` 不进 git（`.gitignore` 已配置）
- [ ] 公网仅暴露 80/443，5432 / 3000 限内网
- [ ] 启用 HTTPS（Caddy 自动 / Nginx + certbot）
- [ ] 每日 `pg_dump` 备份
