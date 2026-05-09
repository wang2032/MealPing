import { prisma } from '../../db/prisma.js';
import { Errors } from '../../utils/errors.js';
import type { z } from 'zod';
import type {
  categoryCreateSchema,
  categoryUpdateSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
} from './menu.schema.js';

/** Public menu: only active categories with their active items, sorted. */
export async function getPublicMenu() {
  const categories = await prisma.category.findMany({
    where: { status: 'active' },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: {
      items: {
        where: { status: 'active' },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      },
    },
  });
  return categories;
}

// ===== Categories (admin) =====

export function listCategoriesAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
}

export function createCategory(data: z.infer<typeof categoryCreateSchema>) {
  return prisma.category.create({ data });
}

export async function updateCategory(id: number, data: z.infer<typeof categoryUpdateSchema>) {
  await ensureCategory(id);
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  await ensureCategory(id);
  const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    throw Errors.conflict('该分类下仍有菜品，无法删除');
  }
  await prisma.category.delete({ where: { id } });
}

async function ensureCategory(id: number) {
  const c = await prisma.category.findUnique({ where: { id } });
  if (!c) throw Errors.notFound('分类不存在');
  return c;
}

// ===== Menu items (admin) =====

export function listMenuItemsAdmin(categoryId?: number) {
  return prisma.menuItem.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  });
}

export async function createMenuItem(data: z.infer<typeof menuItemCreateSchema>) {
  await ensureCategory(data.categoryId);
  return prisma.menuItem.create({ data });
}

export async function updateMenuItem(id: number, data: z.infer<typeof menuItemUpdateSchema>) {
  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound('菜品不存在');
  if (data.categoryId && data.categoryId !== existing.categoryId) {
    await ensureCategory(data.categoryId);
  }
  return prisma.menuItem.update({ where: { id }, data });
}

export async function deleteMenuItem(id: number) {
  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound('菜品不存在');
  const used = await prisma.orderItem.count({ where: { menuItemId: id } });
  if (used > 0) {
    // Soft delete to preserve history
    return prisma.menuItem.update({ where: { id }, data: { status: 'inactive' } });
  }
  await prisma.menuItem.delete({ where: { id } });
  return null;
}
