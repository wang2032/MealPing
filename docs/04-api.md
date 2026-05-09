# 04 API 规范

> Base URL：`http://localhost:3000/api`（生产环境通过 Nginx 转发到 `/api`）  
> 全部响应统一 `{ "data": ... }` 包装，错误响应 `{ "code", "message", "details? }`。

## 4.1 公共

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| GET | `/shop` | 返回店铺基础信息（`SHOP_NAME`） |

## 4.2 顾客端

### 获取菜单
```
GET /menu
```
返回 `active` 分类与其下 `active` 菜品，按 sortOrder 排序。

### 创建订单
```
POST /orders
Content-Type: application/json

{
  "tableNo": "A1",
  "remark": "少辣",
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ]
}
```
响应：
```json
{ "data": { "orderNo": "20260510-ABC123", "status": "pending", "totalAmount": 4200 } }
```

校验规则：
- `items` 必须非空
- 后端重新读库菜品价格，**不信任**前端任何金额字段
- 不存在或 `inactive` 的菜品 → `400 BAD_REQUEST`

### 查询订单
```
GET /orders/:orderNo
```

## 4.3 后台

> 所有 `/admin/*` 接口需要 `Authorization: Bearer <token>`，SSE 接口除外（用 `?token=`）。

### 登录
```
POST /admin/auth/login
{ "password": "admin123" }
```
返回 `{ data: { token } }`。

### 校验当前 token
```
GET /admin/auth/me
```

### 订单
| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/admin/orders?status=&cursor=&limit=` | 列表，按 id 降序，cursor 游标分页 |
| GET | `/admin/orders/:id` | 详情 |
| PATCH | `/admin/orders/:id/status` `{status}` | 状态变更，受状态机限制 |

### 菜品/分类
| Method | Path |
| --- | --- |
| GET | `/admin/menu/categories` |
| POST | `/admin/menu/categories` |
| PATCH | `/admin/menu/categories/:id` |
| DELETE | `/admin/menu/categories/:id` |
| GET | `/admin/menu/items?categoryId=` |
| POST | `/admin/menu/items` |
| PATCH | `/admin/menu/items/:id` |
| DELETE | `/admin/menu/items/:id` （若已被订单引用，自动转为软下架） |

### 通知日志
```
GET /admin/notify/logs
POST /admin/notify/retry/:orderId
```
重发会先把 `order.notifyStatus` 重置为 `pending`，再异步触发 `notifyOrderCreated`。

### 桌台二维码
```
POST /admin/qrcodes/generate
{
  "tables": ["A1", "A2"],
  "baseUrl": "https://menu.example.com",  // 可选，留空则使用 PUBLIC_BASE_URL
  "format": "png"                         // png | svg
}
```
响应：
```json
{ "data": [
  { "tableNo": "A1", "url": "...", "dataUrl": "data:image/png;base64,...", "format": "png" }
] }
```

### 实时新订单（SSE）
```
GET /admin/events/orders?token=<JWT>
```

事件流：
```
event: new-order
data: { "orderId": 123, "ts": 1715300000000 }
```

## 4.4 错误码

| code | HTTP | 含义 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Zod 校验失败，`details` 含字段错误 |
| `BAD_REQUEST` | 400 | 业务参数非法 |
| `UNAUTHORIZED` | 401 | 未登录或 token 失效 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 状态冲突（例如非法状态转换） |
| `INTERNAL` | 500 | 服务端异常 |
