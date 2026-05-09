# 轻量扫码点单系统项目需求文档

> 文档版本：v1.1  
> 项目类型：轻量级 H5 菜单点单系统  
> 数据库方案：PostgreSQL / MySQL  
> 推荐默认数据库：PostgreSQL  
> 适用场景：个人玩具项目、小店试用、桌台扫码点单演示  
> 核心目标：顾客扫码点单，店主通过公众号或后台收到订单通知

---

## 1. 项目概述

### 1.1 项目名称

轻量扫码点单系统

### 1.2 项目定位

本项目是一个轻量级菜单点单系统，不包含配送、支付、会员、复杂营销等重型餐饮系统功能。

系统主要解决以下问题：

1. 顾客可以通过二维码进入菜单页面。
2. 顾客可以点击菜品并提交订单。
3. 店主可以在后台查看订单。
4. 新订单产生后，系统可以通过公众号或其他通知渠道提醒店主。
5. 系统整体尽量简单，方便部署、二次开发和后续扩展。
6. 数据库使用 PostgreSQL 或 MySQL，方便后续迁移到正式服务环境。

### 1.3 项目目标

第一版 MVP 目标是跑通完整点单闭环：

```text
扫码进入菜单
    ↓
选择菜品
    ↓
提交订单
    ↓
订单入库
    ↓
后台显示订单
    ↓
店主收到通知
    ↓
店主处理订单
```

### 1.4 非目标范围

第一版不包含以下功能：

- 不做外卖配送
- 不做在线支付
- 不做会员系统
- 不做优惠券系统
- 不做多门店系统
- 不做复杂收银系统
- 不做骑手端
- 不做财务结算
- 不做库存管理

---

## 2. 使用角色

### 2.1 顾客

顾客通过手机扫码访问菜单页面，选择菜品并提交订单。

顾客不需要注册、不需要登录、不需要绑定手机号。

### 2.2 店主 / 管理员

店主通过后台查看订单、处理订单、管理菜单、接收订单通知。

第一版只需要一个管理员账号或一个后台访问密码即可。

### 2.3 系统

系统负责菜单展示、订单创建、订单状态管理、后台实时刷新、公众号通知发送、通知日志记录。

---

## 3. 典型使用场景

### 3.1 顾客桌台扫码点单

顾客坐到桌位后，扫描桌上的二维码。

二维码链接示例：

```text
https://example.com/menu?table=A1
```

系统自动识别桌号 `A1`，顾客选择菜品后提交订单。

### 3.2 店主收到新订单通知

顾客提交订单后，系统自动发送通知给店主。

通知方式可以是：

- 微信公众号测试号模板消息
- 微信服务号模板消息
- 企业微信机器人
- Server 酱 / PushPlus 等第三方通知服务

第一版优先实现：公众号测试号模板消息。

### 3.3 店主后台处理订单

店主打开后台页面，查看订单列表。

订单状态包括：

- 待处理
- 制作中
- 已完成
- 已取消

店主可以点击按钮更新订单状态。

### 3.4 店主管理菜单

店主可以在后台维护菜单内容：

- 新增菜品
- 编辑菜品
- 修改价格
- 上架 / 下架菜品
- 管理菜品分类

---

## 4. 功能需求

## 4.1 顾客端功能

### 4.1.1 菜单展示

#### 功能说明

顾客进入菜单页面后，可以看到当前可售卖的菜品。

#### 页面元素

- 店铺名称
- 桌号
- 菜品分类
- 菜品图片
- 菜品名称
- 菜品描述
- 菜品价格
- 加入购物车按钮
- 购物车入口
- 提交订单按钮

#### 功能规则

1. 只展示状态为“上架”的菜品。
2. 菜品按分类展示。
3. 分类按后台设置的排序值展示。
4. 菜品按后台设置的排序值展示。
5. 如果 URL 中包含 `table` 参数，则自动识别桌号。
6. 如果 URL 中不包含 `table` 参数，则允许用户手动填写桌号或备注。

---

### 4.1.2 购物车

#### 功能说明

顾客可以将菜品加入购物车，并调整数量。

#### 页面元素

- 已选菜品列表
- 菜品数量
- 单价
- 小计
- 总金额
- 清空购物车
- 提交订单

#### 功能规则

1. 同一菜品多次添加时，数量累加。
2. 数量可以增加或减少。
3. 数量减到 0 时，从购物车中移除该菜品。
4. 总价实时计算。
5. 价格以“分”为单位存储，前端展示为“元”。

---

### 4.1.3 提交订单

#### 功能说明

顾客确认购物车内容后，提交订单。

#### 提交字段

| 字段 | 必填 | 说明 |
|---|---|---|
| tableNo | 否 | 桌号，例如 A1 |
| remark | 否 | 备注，例如少辣、不要香菜 |
| items | 是 | 菜品列表 |
| menuItemId | 是 | 菜品 ID |
| quantity | 是 | 数量 |

#### 功能规则

1. 购物车为空时不能提交订单。
2. 提交订单时，后端需要重新读取菜品价格，不能完全信任前端传来的价格。
3. 后端需要校验菜品是否存在、是否上架。
4. 订单创建成功后生成唯一订单号。
5. 订单创建成功后触发通知。
6. 订单创建成功后返回订单号和订单状态。
7. 订单创建、订单明细写入、库存预留等操作应放在同一个数据库事务中。
8. 订单金额必须由后端根据数据库菜品价格计算，前端传入金额不能作为最终金额。

---

### 4.1.4 下单成功页

#### 功能说明

订单提交成功后，展示订单提交成功页面。

#### 页面元素

- 订单号
- 桌号
- 订单总金额
- 订单状态
- 返回菜单按钮

#### 功能规则

1. 下单成功后清空购物车。
2. 页面显示“已提交，请等待处理”。
3. 可以返回菜单继续加单。

---

## 4.2 管理后台功能

### 4.2.1 后台登录

#### 功能说明

管理员进入后台前需要登录。

#### 第一版方案

使用简单密码登录。

#### 登录字段

| 字段 | 必填 | 说明 |
|---|---|---|
| password | 是 | 后台访问密码 |

#### 功能规则

1. 密码配置在环境变量中。
2. 登录成功后返回 token。
3. 后台接口需要校验 token。
4. 第一版不做多账号体系。

---

### 4.2.2 订单列表

#### 功能说明

后台可以查看订单列表。

#### 列表字段

| 字段 | 说明 |
|---|---|
| 订单号 | 系统生成 |
| 桌号 | 来自二维码或用户填写 |
| 菜品 | 订单明细 |
| 总金额 | 订单总价 |
| 备注 | 用户备注 |
| 状态 | 待处理 / 制作中 / 已完成 / 已取消 |
| 通知状态 | 待发送 / 已发送 / 发送失败 |
| 下单时间 | 订单创建时间 |

#### 功能规则

1. 默认展示最新订单在最上方。
2. 可以按状态筛选。
3. 可以查看订单详情。
4. 新订单出现时后台播放提示音。
5. 新订单出现时后台列表自动刷新。

---

### 4.2.3 订单详情

#### 功能说明

管理员可以查看某个订单的完整信息。

#### 详情内容

- 订单号
- 桌号
- 下单时间
- 订单状态
- 通知状态
- 菜品明细
- 菜品数量
- 菜品单价
- 小计
- 总金额
- 用户备注

---

### 4.2.4 修改订单状态

#### 功能说明

管理员可以修改订单状态。

#### 状态流转

```text
待处理 → 制作中 → 已完成
待处理 → 已取消
制作中 → 已取消
```

#### 功能规则

1. 已完成订单原则上不再修改。
2. 已取消订单原则上不再修改。
3. 状态修改需要记录更新时间。
4. 后续可扩展订单操作日志。

---

### 4.2.5 菜品分类管理

#### 功能说明

管理员可以管理菜品分类。

#### 功能项

- 新增分类
- 编辑分类
- 删除分类
- 调整排序
- 启用 / 停用分类

#### 分类字段

| 字段 | 说明 |
|---|---|
| id | 分类 ID |
| name | 分类名称 |
| sortOrder | 排序值 |
| status | 状态 |
| createdAt | 创建时间 |

---

### 4.2.6 菜品管理

#### 功能说明

管理员可以管理菜单里的菜品。

#### 功能项

- 新增菜品
- 编辑菜品
- 上传菜品图片
- 修改价格
- 修改描述
- 上架 / 下架
- 删除菜品
- 调整排序

#### 菜品字段

| 字段 | 说明 |
|---|---|
| id | 菜品 ID |
| categoryId | 分类 ID |
| name | 菜品名称 |
| description | 菜品描述 |
| price | 价格，单位为分 |
| imageUrl | 图片地址 |
| status | active / inactive |
| sortOrder | 排序值 |
| createdAt | 创建时间 |
| updatedAt | 更新时间 |

---

### 4.2.7 通知配置

#### 功能说明

管理员可以配置通知方式。

#### 第一版配置项

| 字段 | 说明 |
|---|---|
| channel | 通知渠道，例如 wechat_test_account |
| appId | 微信公众号 AppID |
| appSecret | 微信公众号 AppSecret |
| templateId | 模板消息 ID |
| adminOpenId | 店主 openid |
| enabled | 是否启用 |

#### 功能规则

1. 敏感配置建议存环境变量，不建议明文展示。
2. 通知失败时记录日志。
3. 后台需要显示最近通知结果。
4. 第一版可以先通过 `.env` 配置，不做后台可视化配置。

---

## 5. 通知需求

## 5.1 通知方式

第一版优先支持：

```text
微信公众号测试号模板消息
```

可选扩展支持：

```text
企业微信机器人
Server 酱
PushPlus
邮件通知
短信通知
```

---

## 5.2 新订单通知内容

通知标题：

```text
新订单提醒
```

通知内容示例：

```text
桌号：A3
菜品：牛肉面 x1，可乐 x2
备注：少辣
金额：36.00 元
时间：2026-05-09 18:30
状态：待处理
```

---

## 5.3 通知触发时机

当订单创建成功后立即触发通知。

```text
订单创建成功
    ↓
写入数据库
    ↓
组装通知内容
    ↓
发送公众号模板消息
    ↓
记录通知结果
```

---

## 5.4 通知失败处理

#### 失败场景

- access_token 获取失败
- template_id 错误
- openid 错误
- 微信接口限流
- 网络请求失败
- app_secret 错误

#### 处理规则

1. 通知失败不影响订单创建。
2. 通知失败需要记录到通知日志表。
3. 订单表中的 `notify_status` 更新为 `failed`。
4. 后台订单列表中显示通知失败标识。
5. 后续可以增加手动重发通知功能。

---

## 6. 业务流程

## 6.1 顾客点单流程

```mermaid
sequenceDiagram
    participant U as 顾客
    participant FE as 菜单前端
    participant API as 后端 API
    participant DB as PostgreSQL / MySQL
    participant WX as 公众号通知
    participant A as 店主

    U->>FE: 扫码进入菜单页
    FE->>API: 获取菜单
    API->>DB: 查询菜品和分类
    DB-->>API: 返回菜单数据
    API-->>FE: 返回菜单数据
    U->>FE: 添加菜品到购物车
    U->>FE: 提交订单
    FE->>API: 创建订单
    API->>DB: 开启事务
    API->>DB: 写入订单和订单明细
    API->>DB: 提交事务
    API->>WX: 发送新订单通知
    WX-->>A: 店主收到微信通知
    API-->>FE: 返回下单成功
```

---

## 6.2 店主处理订单流程

```mermaid
sequenceDiagram
    participant A as 店主后台
    participant API as 后端 API
    participant DB as PostgreSQL / MySQL

    A->>API: 打开订单列表
    API->>DB: 查询订单
    DB-->>API: 返回订单列表
    API-->>A: 展示订单
    A->>API: 修改状态为制作中
    API->>DB: 更新订单状态
    API-->>A: 返回更新成功
    A->>API: 修改状态为已完成
    API->>DB: 更新订单状态
    API-->>A: 返回更新成功
```

---

## 7. 系统架构

## 7.1 总体架构

```mermaid
flowchart TD
    A[顾客手机 H5 菜单页] --> B[前端应用 Vue / React]
    B --> C[后端 API 服务]
    C --> D[(PostgreSQL / MySQL 数据库)]
    C --> E[通知模块 Notifier]
    E --> F[微信公众号 / 企业微信 / PushPlus]
    F --> G[店主微信]

    H[店主后台管理页] --> C
    C --> I[SSE / WebSocket 实时订单推送]
    I --> H

    J[桌台二维码] --> A
```

---

## 7.2 部署架构

```mermaid
flowchart TD
    A[顾客手机浏览器] --> B[Nginx / Caddy HTTPS]
    C[店主后台浏览器] --> B
    B --> D[前端静态文件]
    B --> E[后端 API 服务]
    E --> F[(PostgreSQL / MySQL)]
    E --> G[微信公众号接口]
```

---

## 8. 技术选型

## 8.1 推荐技术栈

| 模块 | 技术 |
|---|---|
| 顾客前端 | Vue 3 + Vant |
| 后台前端 | Vue 3 + Element Plus / Naive UI |
| 后端 | Node.js + Express / NestJS |
| 数据库 | PostgreSQL / MySQL |
| 默认推荐 | PostgreSQL |
| ORM | Prisma / Drizzle / TypeORM |
| 实时刷新 | SSE |
| 通知 | 微信公众号测试号模板消息 |
| 部署 | Docker Compose |
| 反向代理 | Nginx / Caddy |

---

## 8.2 数据库选择建议

### 8.2.1 推荐 PostgreSQL

如果没有历史包袱，建议默认使用 PostgreSQL。

原因：

1. 事务能力稳定。
2. JSON 字段支持好。
3. 适合后续扩展复杂查询。
4. Docker 部署简单。
5. 和 Prisma、Drizzle、TypeORM 等 ORM 兼容较好。

### 8.2.2 可选 MySQL

如果你的服务器已经有 MySQL，或者你更熟悉 MySQL，可以使用 MySQL。

原因：

1. 国内服务器环境常见。
2. 运维资料多。
3. Navicat、DBeaver 等工具支持好。
4. 适合轻量业务。

### 8.2.3 第一版建议

默认使用：

```text
PostgreSQL 16
```

可选兼容：

```text
MySQL 8.0
```

---

## 9. 接口设计

## 9.1 顾客端接口

### 9.1.1 获取菜单

```http
GET /api/menu
```

响应示例：

```json
{
  "categories": [
    {
      "id": 1,
      "name": "主食",
      "items": [
        {
          "id": 101,
          "name": "牛肉面",
          "description": "微辣，可备注不要香菜",
          "price": 1800,
          "imageUrl": "/uploads/beef-noodle.jpg"
        }
      ]
    }
  ]
}
```

---

### 9.1.2 创建订单

```http
POST /api/orders
```

请求示例：

```json
{
  "tableNo": "A1",
  "remark": "少辣，不要香菜",
  "items": [
    {
      "menuItemId": 101,
      "quantity": 1
    },
    {
      "menuItemId": 203,
      "quantity": 2
    }
  ]
}
```

响应示例：

```json
{
  "orderNo": "202605091830001",
  "status": "pending",
  "totalAmount": 3600
}
```

---

## 9.2 后台接口

### 9.2.1 后台登录

```http
POST /api/admin/login
```

请求示例：

```json
{
  "password": "admin_password"
}
```

响应示例：

```json
{
  "token": "jwt_token"
}
```

---

### 9.2.2 获取订单列表

```http
GET /api/admin/orders?status=pending&page=1&pageSize=20
```

响应示例：

```json
{
  "list": [
    {
      "id": 1,
      "orderNo": "202605091830001",
      "tableNo": "A1",
      "totalAmount": 3600,
      "status": "pending",
      "notifyStatus": "sent",
      "createdAt": "2026-05-09 18:30:00"
    }
  ],
  "total": 1
}
```

---

### 9.2.3 获取订单详情

```http
GET /api/admin/orders/:id
```

---

### 9.2.4 修改订单状态

```http
PATCH /api/admin/orders/:id/status
```

请求示例：

```json
{
  "status": "cooking"
}
```

---

### 9.2.5 获取菜品列表

```http
GET /api/admin/menu/items
```

---

### 9.2.6 新增菜品

```http
POST /api/admin/menu/items
```

请求示例：

```json
{
  "categoryId": 1,
  "name": "牛肉面",
  "description": "微辣，可备注不要香菜",
  "price": 1800,
  "imageUrl": "/uploads/beef-noodle.jpg",
  "status": "active",
  "sortOrder": 1
}
```

---

### 9.2.7 修改菜品

```http
PUT /api/admin/menu/items/:id
```

---

### 9.2.8 上架 / 下架菜品

```http
PATCH /api/admin/menu/items/:id/status
```

请求示例：

```json
{
  "status": "inactive"
}
```

---

## 9.3 微信接口

### 9.3.1 微信回调验证

```http
GET /api/wechat/callback
```

用于微信服务器接入验证。

---

### 9.3.2 微信事件接收

```http
POST /api/wechat/callback
```

用于接收关注事件、用户消息、绑定 openid 等。

---

## 10. 数据库设计

## 10.1 数据库命名建议

默认数据库名：

```text
menu_order
```

默认用户：

```text
menu_order_user
```

---

## 10.2 表清单

| 表名 | 说明 |
|---|---|
| categories | 菜品分类表 |
| menu_items | 菜品表 |
| orders | 订单主表 |
| order_items | 订单明细表 |
| notification_settings | 通知配置表 |
| notification_logs | 通知日志表 |

---

## 10.3 PostgreSQL 表结构

### 10.3.1 分类表：categories

```sql
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_status_sort
ON categories (status, sort_order);
```

---

### 10.3.2 菜品表：menu_items

```sql
CREATE TABLE menu_items (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category_status_sort
ON menu_items (category_id, status, sort_order);
```

---

### 10.3.3 订单表：orders

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_no VARCHAR(64) UNIQUE NOT NULL,
  table_no VARCHAR(50),
  remark TEXT,
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notify_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status_created_at
ON orders (status, created_at DESC);

CREATE INDEX idx_orders_created_at
ON orders (created_at DESC);
```

---

### 10.3.4 订单明细表：order_items

```sql
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id
ON order_items (order_id);
```

---

### 10.3.5 通知配置表：notification_settings

```sql
CREATE TABLE notification_settings (
  id BIGSERIAL PRIMARY KEY,
  channel VARCHAR(50) NOT NULL,
  config_json JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_settings_channel_enabled
ON notification_settings (channel, enabled);
```

---

### 10.3.6 通知日志表：notification_logs

```sql
CREATE TABLE notification_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_order_id
ON notification_logs (order_id);

CREATE INDEX idx_notification_logs_status_created_at
ON notification_logs (status, created_at DESC);
```

---

## 10.4 MySQL 表结构

> MySQL 建议使用 8.0 版本，字符集使用 `utf8mb4`，排序规则使用 `utf8mb4_unicode_ci`。

### 10.4.1 分类表：categories

```sql
CREATE TABLE categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10.4.2 菜品表：menu_items

```sql
CREATE TABLE menu_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_menu_items_category_status_sort (category_id, status, sort_order),
  CONSTRAINT fk_menu_items_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_menu_items_price
    CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10.4.3 订单表：orders

```sql
CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  table_no VARCHAR(50),
  remark TEXT,
  total_amount INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notify_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_status_created_at (status, created_at),
  KEY idx_orders_created_at (created_at),
  CONSTRAINT chk_orders_total_amount
    CHECK (total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10.4.4 订单明细表：order_items

```sql
CREATE TABLE order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NULL,
  name VARCHAR(100) NOT NULL,
  price INT NOT NULL,
  quantity INT NOT NULL,
  subtotal INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_menu_item
    FOREIGN KEY (menu_item_id)
    REFERENCES menu_items(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_order_items_price
    CHECK (price >= 0),
  CONSTRAINT chk_order_items_quantity
    CHECK (quantity > 0),
  CONSTRAINT chk_order_items_subtotal
    CHECK (subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10.4.5 通知配置表：notification_settings

```sql
CREATE TABLE notification_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  channel VARCHAR(50) NOT NULL,
  config_json JSON NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notification_settings_channel_enabled (channel, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10.4.6 通知日志表：notification_logs

```sql
CREATE TABLE notification_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  request_body JSON,
  response_body JSON,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notification_logs_order_id (order_id),
  KEY idx_notification_logs_status_created_at (status, created_at),
  CONSTRAINT fk_notification_logs_order
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 11. 状态枚举

## 11.1 订单状态

| 状态值 | 中文名称 | 说明 |
|---|---|---|
| pending | 待处理 | 新订单默认状态 |
| cooking | 制作中 | 店主已开始处理 |
| completed | 已完成 | 订单完成 |
| cancelled | 已取消 | 订单取消 |

---

## 11.2 通知状态

| 状态值 | 中文名称 | 说明 |
|---|---|---|
| pending | 待发送 | 订单刚创建，还未发送通知 |
| sent | 已发送 | 通知发送成功 |
| failed | 发送失败 | 通知发送失败 |

---

## 11.3 菜品状态

| 状态值 | 中文名称 | 说明 |
|---|---|---|
| active | 上架 | 顾客端可见 |
| inactive | 下架 | 顾客端不可见 |

---

## 12. 页面需求

## 12.1 顾客菜单页

### 页面路径

```text
/menu?table=A1
```

### 页面模块

1. 顶部店铺信息
2. 桌号显示
3. 左侧分类导航
4. 右侧菜品列表
5. 底部购物车栏
6. 购物车弹层
7. 提交订单按钮

---

## 12.2 下单成功页

### 页面路径

```text
/order-success?orderNo=xxx
```

### 页面模块

1. 成功提示
2. 订单号
3. 桌号
4. 总金额
5. 当前状态
6. 返回菜单按钮

---

## 12.3 后台订单页

### 页面路径

```text
/admin/orders
```

### 页面模块

1. 登录状态
2. 订单状态筛选
3. 订单列表
4. 订单详情弹窗
5. 状态操作按钮
6. 新订单提示音
7. 通知失败提示

---

## 12.4 菜品管理页

### 页面路径

```text
/admin/menu
```

### 页面模块

1. 分类列表
2. 菜品列表
3. 新增菜品按钮
4. 编辑菜品弹窗
5. 上架 / 下架按钮
6. 图片上传

---

## 13. 权限与安全

## 13.1 后台访问控制

1. 后台接口必须登录后访问。
2. token 过期后需要重新登录。
3. 后台密码通过环境变量配置。
4. 不在前端代码中写死密码。

---

## 13.2 接口安全

1. 创建订单接口需要做参数校验。
2. 菜品价格以后端数据库为准。
3. 禁止前端直接传总金额作为最终金额。
4. 后台接口需要校验 token。
5. 微信回调接口需要校验签名。
6. 图片上传需要限制文件类型和大小。

---

## 13.3 敏感信息

以下信息不得提交到 Git 仓库：

- 微信 AppSecret
- 后台密码
- JWT Secret
- 数据库连接密钥
- 任何第三方通知服务 Token

建议使用 `.env` 文件管理。

---

## 14. 配置项

## 14.1 PostgreSQL `.env` 示例

```env
NODE_ENV=production
PORT=3000

DATABASE_TYPE=postgres
DATABASE_URL=postgresql://menu_order_user:menu_order_password@postgres:5432/menu_order

ADMIN_PASSWORD=change_me
JWT_SECRET=change_me_jwt_secret

WECHAT_ENABLED=true
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_TEMPLATE_ID=your_template_id
WECHAT_ADMIN_OPENID=your_admin_openid
WECHAT_TOKEN=your_callback_token
```

---

## 14.2 MySQL `.env` 示例

```env
NODE_ENV=production
PORT=3000

DATABASE_TYPE=mysql
DATABASE_URL=mysql://menu_order_user:menu_order_password@mysql:3306/menu_order

ADMIN_PASSWORD=change_me
JWT_SECRET=change_me_jwt_secret

WECHAT_ENABLED=true
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_TEMPLATE_ID=your_template_id
WECHAT_ADMIN_OPENID=your_admin_openid
WECHAT_TOKEN=your_callback_token
```

---

## 15. 项目目录结构

推荐目录：

```text
menu-order-system/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── MenuPage.vue
│   │   │   │   ├── CartPage.vue
│   │   │   │   └── OrderSuccess.vue
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── admin/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── OrderList.vue
│       │   │   ├── MenuManage.vue
│       │   │   └── Settings.vue
│       │   └── components/
│       └── package.json
│
├── server/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── menu/
│   │   │   ├── order/
│   │   │   ├── admin/
│   │   │   ├── notify/
│   │   │   └── wechat/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   ├── app.ts
│   │   └── main.ts
│   └── package.json
│
├── docker-compose.postgres.yml
├── docker-compose.mysql.yml
├── nginx.conf
├── .env.example
└── README.md
```

---

## 16. Docker 部署需求

## 16.1 PostgreSQL Docker Compose 示例

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: menu-order-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: menu_order
      POSTGRES_USER: menu_order_user
      POSTGRES_PASSWORD: menu_order_password
      TZ: Asia/Shanghai
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: ./server
    container_name: menu-order-api
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_TYPE: postgres
      DATABASE_URL: postgresql://menu_order_user:menu_order_password@postgres:5432/menu_order
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      WECHAT_ENABLED: ${WECHAT_ENABLED}
      WECHAT_APP_ID: ${WECHAT_APP_ID}
      WECHAT_APP_SECRET: ${WECHAT_APP_SECRET}
      WECHAT_TEMPLATE_ID: ${WECHAT_TEMPLATE_ID}
      WECHAT_ADMIN_OPENID: ${WECHAT_ADMIN_OPENID}
      WECHAT_TOKEN: ${WECHAT_TOKEN}
    volumes:
      - ./uploads:/uploads
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    container_name: menu-order-nginx
    restart: unless-stopped
    depends_on:
      - app
    volumes:
      - ./frontend-dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
```

---

## 16.2 MySQL Docker Compose 示例

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: menu-order-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: menu_order
      MYSQL_USER: menu_order_user
      MYSQL_PASSWORD: menu_order_password
      MYSQL_ROOT_PASSWORD: root_password
      TZ: Asia/Shanghai
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    volumes:
      - ./data/mysql:/var/lib/mysql
    ports:
      - "3306:3306"

  app:
    build: ./server
    container_name: menu-order-api
    restart: unless-stopped
    depends_on:
      - mysql
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_TYPE: mysql
      DATABASE_URL: mysql://menu_order_user:menu_order_password@mysql:3306/menu_order
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      WECHAT_ENABLED: ${WECHAT_ENABLED}
      WECHAT_APP_ID: ${WECHAT_APP_ID}
      WECHAT_APP_SECRET: ${WECHAT_APP_SECRET}
      WECHAT_TEMPLATE_ID: ${WECHAT_TEMPLATE_ID}
      WECHAT_ADMIN_OPENID: ${WECHAT_ADMIN_OPENID}
      WECHAT_TOKEN: ${WECHAT_TOKEN}
    volumes:
      - ./uploads:/uploads
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    container_name: menu-order-nginx
    restart: unless-stopped
    depends_on:
      - app
    volumes:
      - ./frontend-dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
```

---

## 17. 数据库迁移要求

### 17.1 推荐使用 ORM 迁移

建议使用以下任一 ORM：

- Prisma
- Drizzle
- TypeORM

第一版推荐：

```text
Prisma
```

原因：

1. 模型定义清晰。
2. 支持 PostgreSQL 和 MySQL。
3. 迁移命令简单。
4. 适合快速开发。

---

### 17.2 Prisma 模型建议

如果使用 Prisma，可以用统一模型适配 PostgreSQL / MySQL。

```prisma
model Category {
  id        BigInt     @id @default(autoincrement())
  name      String     @db.VarChar(100)
  sortOrder Int        @default(0) @map("sort_order")
  status    String     @default("active") @db.VarChar(20)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  items     MenuItem[]

  @@map("categories")
}

model MenuItem {
  id          BigInt      @id @default(autoincrement())
  categoryId  BigInt?     @map("category_id")
  category    Category?   @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  name        String      @db.VarChar(100)
  description String?
  price       Int
  imageUrl    String?     @map("image_url")
  status      String      @default("active") @db.VarChar(20)
  sortOrder   Int         @default(0) @map("sort_order")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  orderItems  OrderItem[]

  @@map("menu_items")
}

model Order {
  id           BigInt      @id @default(autoincrement())
  orderNo      String      @unique @map("order_no") @db.VarChar(64)
  tableNo      String?     @map("table_no") @db.VarChar(50)
  remark       String?
  totalAmount  Int         @map("total_amount")
  status       String      @default("pending") @db.VarChar(20)
  notifyStatus String      @default("pending") @map("notify_status") @db.VarChar(20)
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  items        OrderItem[]
  notifyLogs   NotificationLog[]

  @@map("orders")
}

model OrderItem {
  id         BigInt    @id @default(autoincrement())
  orderId    BigInt    @map("order_id")
  order      Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId BigInt?   @map("menu_item_id")
  menuItem   MenuItem? @relation(fields: [menuItemId], references: [id], onDelete: SetNull)
  name       String    @db.VarChar(100)
  price      Int
  quantity   Int
  subtotal   Int
  createdAt  DateTime  @default(now()) @map("created_at")

  @@map("order_items")
}

model NotificationSetting {
  id         BigInt   @id @default(autoincrement())
  channel    String   @db.VarChar(50)
  configJson Json     @map("config_json")
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("notification_settings")
}

model NotificationLog {
  id           BigInt   @id @default(autoincrement())
  orderId      BigInt   @map("order_id")
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  channel      String   @db.VarChar(50)
  status       String   @db.VarChar(20)
  requestBody  Json?    @map("request_body")
  responseBody Json?    @map("response_body")
  errorMessage String?  @map("error_message")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("notification_logs")
}
```

---

## 18. MVP 开发计划

## 18.1 第一阶段：基础点单闭环

目标：顾客可以下单，后台可以看到订单。

功能：

- 菜单展示
- 购物车
- 创建订单
- PostgreSQL / MySQL 数据库存储
- 后台订单列表
- 修改订单状态

交付标准：

- 顾客能通过 `/menu?table=A1` 下单
- 后台能看到订单
- 后台能修改订单状态
- 订单数据持久化到 PostgreSQL / MySQL

---

## 18.2 第二阶段：公众号通知

目标：新订单可以通知店主。

功能：

- 公众号测试号配置
- 获取 access_token
- 发送模板消息
- 通知日志
- 通知失败标识

交付标准：

- 新订单创建后，店主能收到微信通知
- 发送失败时后台可以看到失败状态
- 通知日志写入 PostgreSQL / MySQL

---

## 18.3 第三阶段：菜单管理

目标：店主可以自己维护菜单。

功能：

- 分类管理
- 菜品管理
- 图片上传
- 上架 / 下架
- 排序

交付标准：

- 后台可新增菜品
- 后台可修改价格
- 下架菜品不在顾客端展示

---

## 18.4 第四阶段：体验优化

目标：让系统更像真实点单系统。

功能：

- 新订单后台提示音
- SSE 实时刷新
- 二维码生成
- 移动端样式优化
- 订单详情弹窗

交付标准：

- 后台不用刷新即可看到新订单
- 新订单有声音提示
- 可以生成不同桌号二维码

---

## 19. 验收标准

## 19.1 顾客端验收

| 编号 | 验收项 | 标准 |
|---|---|---|
| C-01 | 菜单加载 | 打开菜单页可以看到分类和菜品 |
| C-02 | 桌号识别 | URL 中 `table=A1` 时页面显示 A1 |
| C-03 | 加入购物车 | 点击加号后购物车数量变化 |
| C-04 | 修改数量 | 可以增减数量 |
| C-05 | 提交订单 | 购物车有商品时可以提交订单 |
| C-06 | 下单成功 | 成功后显示订单号 |
| C-07 | 空购物车限制 | 空购物车不能提交 |

---

## 19.2 后台验收

| 编号 | 验收项 | 标准 |
|---|---|---|
| A-01 | 后台登录 | 输入正确密码可进入后台 |
| A-02 | 订单列表 | 可以看到新订单 |
| A-03 | 订单详情 | 可以查看菜品明细 |
| A-04 | 修改状态 | 可以将订单改为制作中或已完成 |
| A-05 | 菜品管理 | 可以新增和编辑菜品 |
| A-06 | 上下架 | 下架菜品不在顾客端展示 |
| A-07 | 新订单提醒 | 新订单出现时有提示音或实时刷新 |

---

## 19.3 通知验收

| 编号 | 验收项 | 标准 |
|---|---|---|
| N-01 | 通知发送 | 新订单创建后店主收到微信通知 |
| N-02 | 通知内容 | 通知中包含桌号、菜品、金额、备注 |
| N-03 | 通知日志 | 通知成功或失败都有日志 |
| N-04 | 失败不影响订单 | 通知失败时订单仍创建成功 |
| N-05 | 失败标识 | 后台可以看到通知失败状态 |

---

## 19.4 数据库验收

| 编号 | 验收项 | 标准 |
|---|---|---|
| DB-01 | 数据库启动 | PostgreSQL / MySQL 容器可以正常启动 |
| DB-02 | 表结构创建 | 所有核心表可以通过 migration 创建 |
| DB-03 | 订单事务 | 订单主表和明细表写入保持事务一致 |
| DB-04 | 数据持久化 | 重启服务后数据不丢失 |
| DB-05 | 查询性能 | 订单列表、菜单列表查询正常 |
| DB-06 | 备份恢复 | 可以导出和恢复数据库 |

---

## 20. 风险与注意事项

### 20.1 公众号限制

如果使用公众号测试号，适合开发测试，不适合正式商用。

如果正式商用，建议使用认证服务号，并按照微信官方规则配置模板消息或订阅通知。

### 20.2 通知失败

微信接口可能因为 token 失效、openid 错误、模板配置错误导致失败。

需要保留通知日志，方便排查。

### 20.3 数据安全

虽然是玩具项目，也要避免后台无密码暴露到公网。

### 20.4 菜品价格可信问题

订单金额必须由后端计算，不能完全相信前端传入的价格。

### 20.5 数据库备份

如果使用 PostgreSQL：

```bash
pg_dump -U menu_order_user -d menu_order > backup.sql
```

如果使用 MySQL：

```bash
mysqldump -u menu_order_user -p menu_order > backup.sql
```

建议定期备份数据库。

---

## 21. 后续扩展方向

### 21.1 小程序版

后续可以将 H5 菜单迁移或扩展为微信小程序。

### 21.2 小票打印

可以对接蓝牙打印机、云打印机或局域网打印机。

### 21.3 厨房看板

增加一个 `/kitchen` 页面，用于后厨查看待制作订单。

### 21.4 多桌台二维码

后台支持一键生成不同桌号的二维码。

### 21.5 多通知渠道

支持同时通知多个店主：

- 公众号
- 企业微信
- 邮件
- 短信
- Telegram

### 21.6 AI 菜单推荐

后续可以加入 AI 推荐功能，例如：

- 根据人数推荐菜品
- 根据口味推荐套餐
- 自动生成菜品描述
- 自动生成菜单图片文案

### 21.7 支付功能

如果后续需要真实经营，可以增加微信支付。

但第一版不建议做。

---

## 22. 第一版最终交付物

第一版建议交付以下内容：

```text
1. 顾客菜单 H5 页面
2. 店主后台页面
3. 后端 API 服务
4. PostgreSQL / MySQL 数据库
5. 数据库 migration 文件
6. 公众号通知模块
7. Docker Compose 部署文件
8. README 部署说明
9. .env.example 配置示例
```

---

## 23. 一句话总结

本项目第一版只需要完成：

```text
扫码 → 点菜 → 提交 → PostgreSQL / MySQL 入库 → 后台看单 → 微信通知店主
```

不要引入配送、支付、会员、多门店等复杂功能。

保持轻量、可部署、可扩展，是这个项目最重要的设计原则。

默认推荐数据库：

```text
PostgreSQL
```

如果服务器已有 MySQL，也可以直接使用：

```text
MySQL 8.0
```
