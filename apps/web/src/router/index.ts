import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { getAdminToken } from '@/api/http';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/menu' },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('@/pages/menu/MenuPage.vue'),
  },
  {
    path: '/order-success',
    name: 'order-success',
    component: () => import('@/pages/menu/OrderSuccessPage.vue'),
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/pages/admin/AdminLoginPage.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/orders' },
      {
        path: 'orders',
        name: 'admin-orders',
        component: () => import('@/pages/admin/OrderListPage.vue'),
      },
      {
        path: 'menu',
        name: 'admin-menu',
        component: () => import('@/pages/admin/MenuManagePage.vue'),
      },
      {
        path: 'notify',
        name: 'admin-notify',
        component: () => import('@/pages/admin/NotifyLogPage.vue'),
      },
      {
        path: 'qrcodes',
        name: 'admin-qrcodes',
        component: () => import('@/pages/admin/QrCodePage.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/NotFoundPage.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.matched.some((r) => r.meta.requiresAdmin) && !getAdminToken()) {
    return { path: '/admin/login', query: { redirect: to.fullPath } };
  }
});
