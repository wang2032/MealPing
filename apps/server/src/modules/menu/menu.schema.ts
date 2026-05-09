import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.number().int().nonnegative().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const menuItemCreateSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().int().nonnegative(), // cents
  imageUrl: z.string().max(500).optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const menuItemUpdateSchema = menuItemCreateSchema.partial();
