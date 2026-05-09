import { http } from './http';

export interface QrCodeItem {
  tableNo: string;
  url: string;
  dataUrl: string;
  format: 'png' | 'svg';
}

export async function adminGenerateQrCodes(input: {
  tables: string[];
  baseUrl?: string;
  format?: 'png' | 'svg';
}): Promise<QrCodeItem[]> {
  const res = await http.post<{ data: QrCodeItem[] }>('/admin/qrcodes/generate', input);
  return res.data.data;
}
