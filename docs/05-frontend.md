# 05 前端

## 5.1 路由

```
/                           ─▶ 重定向到 /menu
/menu                       顾客菜单页（接受 ?table=A1）
/order-success              下单成功页（接受 ?orderNo=xxx）
/admin/login                后台登录
/admin/orders               订单管理（默认）
/admin/menu                 菜单管理
/admin/notify               通知日志
```

`router/index.ts` 中通过全局守卫拦截 `meta.requiresAdmin`，未登录跳 `/admin/login`。

## 5.2 页面与组件

```
src/
├── pages/
│   ├── menu/MenuPage.vue           # 三栏布局：左分类、右菜品、底部购物车
│   ├── menu/OrderSuccessPage.vue   # 提交成功 + 状态查询
│   └── admin/{AdminLoginPage.vue, OrderListPage.vue, MenuManagePage.vue, NotifyLogPage.vue}
├── components/
│   ├── menu/{MenuItemRow.vue, CartBar.vue, CartSheet.vue}
│   └── common/Stepper.vue
└── layouts/AdminLayout.vue         # 后台框架（侧栏 + 顶栏）
```

## 5.3 状态管理

只有一个 Pinia store：`stores/cart.ts`。

- `lines`、`tableNo`、`remark` 同步到 `localStorage`，刷新不丢
- `hydrate(menuItems)` 在菜单加载完成后调用，自动剔除已被下架/删除的菜品
- `incr/decr/setQuantity/clear` 等动作都带持久化

## 5.4 API 层

`src/api/http.ts` 维护单一 axios 实例：

- 自动从 `localStorage` 读取 admin token，仅对 `/admin/*` 请求注入 `Authorization`
- 401 时清除 token 并跳登录
- 每个业务模块（`menu.ts`、`order.ts`、`auth.ts`、`notify.ts`）只暴露强类型方法

## 5.5 实时刷新

`OrderListPage.vue` 使用 `EventSource` 连接 `/api/admin/events/orders?token=...`：

- `event: new-order` → 触发列表 reload + `Audio` 播放提示音
- 心跳 25 秒一次保持连接
- Nginx 已配置 `proxy_buffering off` 透传

## 5.6 二维码

后台 `/admin/qrcodes` 提供桌台二维码批量生成：输入桌号列表 → 服务端用 `qrcode` 生成 PNG / SVG dataURL → 前端展示，可单张下载或一键打印（新窗口 + `window.print()`）。
默认菜单 URL 使用 `PUBLIC_BASE_URL`，也可在表单中临时覆盖。
