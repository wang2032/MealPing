import { http, setAdminToken } from './http';

export async function adminLogin(password: string): Promise<string> {
  const res = await http.post<{ data: { token: string } }>('/admin/auth/login', { password });
  setAdminToken(res.data.data.token);
  return res.data.data.token;
}

export async function adminMe(): Promise<{ sub: string }> {
  const res = await http.get<{ data: { sub: string } }>('/admin/auth/me');
  return res.data.data;
}

export function adminLogout(): void {
  setAdminToken(null);
}
