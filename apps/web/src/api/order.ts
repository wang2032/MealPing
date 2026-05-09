import { http } from './http';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  OrderStatus,
} from '@mealping/shared';

export async function createOrder(input: CreateOrderRequest): Promise<CreateOrderResponse> {
  const res = await http.post<{ data: CreateOrderResponse }>('/orders', input);
  return res.data.data;
}

export async function fetchOrderByNo(orderNo: string): Promise<Order> {
  const res = await http.get<{ data: Order }>(`/orders/${encodeURIComponent(orderNo)}`);
  return res.data.data;
}

/** Public lookup: list recent orders for a given table (last 24h). */
export async function fetchOrdersByTable(tableNo: string, limit = 20): Promise<Order[]> {
  const res = await http.get<{ data: Order[] }>('/orders', {
    params: { tableNo, limit },
  });
  return res.data.data;
}

export async function adminListOrders(params: {
  status?: OrderStatus;
  cursor?: number;
  limit?: number;
}): Promise<{ data: Order[]; nextCursor: number | null }> {
  const res = await http.get<{ data: Order[]; nextCursor: number | null }>('/admin/orders', {
    params,
  });
  return res.data;
}

export async function adminGetOrder(id: number): Promise<Order> {
  const res = await http.get<{ data: Order }>(`/admin/orders/${id}`);
  return res.data.data;
}

export async function adminUpdateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const res = await http.patch<{ data: Order }>(`/admin/orders/${id}/status`, { status });
  return res.data.data;
}
