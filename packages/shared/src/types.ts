import type { OrderStatus, NotifyStatus, ItemStatus } from './constants';

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  status: ItemStatus;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number; // cents
  imageUrl: string | null;
  status: ItemStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategoryWithItems extends Category {
  items: MenuItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  name: string;
  unitPrice: number; // cents at order time
  quantity: number;
  subtotal: number; // cents
}

export interface Order {
  id: number;
  orderNo: string;
  tableNo: string | null;
  remark: string | null;
  totalAmount: number; // cents
  status: OrderStatus;
  notifyStatus: NotifyStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderItemInput {
  menuItemId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  tableNo?: string;
  remark?: string;
  items: CreateOrderItemInput[];
}

export interface CreateOrderResponse {
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
}

export interface AdminLoginRequest {
  password: string;
}

export interface AdminLoginResponse {
  token: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
