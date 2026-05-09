import { http } from './http';

export interface NotifyLog {
  id: number;
  orderId: number;
  channel: string;
  status: string;
  errorMsg: string | null;
  createdAt: string;
  order: { orderNo: string; tableNo: string | null };
}

export async function adminListNotifyLogs(): Promise<NotifyLog[]> {
  const res = await http.get<{ data: NotifyLog[] }>('/admin/notify/logs');
  return res.data.data;
}

export async function adminRetryNotify(orderId: number): Promise<{ notifyStatus: string }> {
  const res = await http.post<{ data: { orderId: number; notifyStatus: string } }>(
    `/admin/notify/retry/${orderId}`,
  );
  return res.data.data;
}
