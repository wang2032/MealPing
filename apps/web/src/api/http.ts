import axios, { type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
const apiBase = baseURL.endsWith('/api') ? baseURL : `${baseURL.replace(/\/$/, '')}/api`;

export const http: AxiosInstance = axios.create({
  baseURL: apiBase,
  timeout: 15_000,
});

const ADMIN_TOKEN_KEY = 'mealping.admin.token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

http.interceptors.request.use((config) => {
  const url = config.url ?? '';
  if (url.startsWith('/admin')) {
    const t = getAdminToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.config?.url?.startsWith('/admin')) {
      setAdminToken(null);
      if (!location.pathname.startsWith('/admin/login')) {
        location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  },
);

export const apiBaseUrl = apiBase;
