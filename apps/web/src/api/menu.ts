import { http } from './http';
import type { MenuCategoryWithItems, MenuItem, Category } from '@mealping/shared';

export async function fetchPublicMenu(): Promise<MenuCategoryWithItems[]> {
  const res = await http.get<{ data: MenuCategoryWithItems[] }>('/menu');
  return res.data.data;
}

export async function fetchShop(): Promise<{ name: string }> {
  const res = await http.get<{ data: { name: string } }>('/shop');
  return res.data.data;
}

// Admin: categories
export async function adminListCategories(): Promise<Category[]> {
  const res = await http.get<{ data: Category[] }>('/admin/menu/categories');
  return res.data.data;
}

export async function adminCreateCategory(input: Partial<Category>): Promise<Category> {
  const res = await http.post<{ data: Category }>('/admin/menu/categories', input);
  return res.data.data;
}

export async function adminUpdateCategory(id: number, input: Partial<Category>): Promise<Category> {
  const res = await http.patch<{ data: Category }>(`/admin/menu/categories/${id}`, input);
  return res.data.data;
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await http.delete(`/admin/menu/categories/${id}`);
}

// Admin: items
export async function adminListMenuItems(categoryId?: number): Promise<MenuItem[]> {
  const res = await http.get<{ data: MenuItem[] }>('/admin/menu/items', {
    params: categoryId ? { categoryId } : {},
  });
  return res.data.data;
}

export async function adminCreateMenuItem(input: Partial<MenuItem>): Promise<MenuItem> {
  const res = await http.post<{ data: MenuItem }>('/admin/menu/items', input);
  return res.data.data;
}

export async function adminUpdateMenuItem(id: number, input: Partial<MenuItem>): Promise<MenuItem> {
  const res = await http.patch<{ data: MenuItem }>(`/admin/menu/items/${id}`, input);
  return res.data.data;
}

export async function adminDeleteMenuItem(id: number): Promise<void> {
  await http.delete(`/admin/menu/items/${id}`);
}
