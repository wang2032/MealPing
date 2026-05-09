import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
} from './menu.schema.js';
import * as service from './menu.service.js';

const idParam = z.object({ id: z.coerce.number().int().positive() });

/** Public router: GET /api/menu */
export const publicMenuRouter = Router();

publicMenuRouter.get('/', async (_req, res, next) => {
  try {
    const data = await service.getPublicMenu();
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

/** Admin router: /api/admin/menu/* */
export const adminMenuRouter = Router();
adminMenuRouter.use(requireAdmin);

// Categories
adminMenuRouter.get('/categories', async (_req, res, next) => {
  try {
    res.json({ data: await service.listCategoriesAdmin() });
  } catch (e) {
    next(e);
  }
});

adminMenuRouter.post('/categories', async (req, res, next) => {
  try {
    const body = categoryCreateSchema.parse(req.body);
    res.status(201).json({ data: await service.createCategory(body) });
  } catch (e) {
    next(e);
  }
});

adminMenuRouter.patch('/categories/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const body = categoryUpdateSchema.parse(req.body);
    res.json({ data: await service.updateCategory(id, body) });
  } catch (e) {
    next(e);
  }
});

adminMenuRouter.delete('/categories/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    await service.deleteCategory(id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Menu items
const itemQuerySchema = z.object({ categoryId: z.coerce.number().int().positive().optional() });

adminMenuRouter.get('/items', async (req, res, next) => {
  try {
    const q = itemQuerySchema.parse(req.query);
    res.json({ data: await service.listMenuItemsAdmin(q.categoryId) });
  } catch (e) {
    next(e);
  }
});

adminMenuRouter.post('/items', async (req, res, next) => {
  try {
    const body = menuItemCreateSchema.parse(req.body);
    res.status(201).json({ data: await service.createMenuItem(body) });
  } catch (e) {
    next(e);
  }
});

adminMenuRouter.patch('/items/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const body = menuItemUpdateSchema.parse(req.body);
    res.json({ data: await service.updateMenuItem(id, body) });
  } catch (e) {
    next(e);
  }
});

adminMenuRouter.delete('/items/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const result = await service.deleteMenuItem(id);
    res.json({ data: result, softDeleted: result !== null });
  } catch (e) {
    next(e);
  }
});
