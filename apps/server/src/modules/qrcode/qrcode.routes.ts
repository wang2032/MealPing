import { Router } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { requireAdmin } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { Errors } from '../../utils/errors.js';

export const adminQrcodeRouter = Router();
adminQrcodeRouter.use(requireAdmin);

const generateSchema = z.object({
  tables: z
    .array(z.string().trim().min(1).max(20))
    .min(1, '至少需要一个桌号')
    .max(200, '一次最多 200 个'),
  baseUrl: z.string().url().optional(),
  format: z.enum(['png', 'svg']).default('png'),
});

interface QrItem {
  tableNo: string;
  url: string;
  dataUrl: string;
  format: 'png' | 'svg';
}

adminQrcodeRouter.post('/generate', async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body);
    const base = (body.baseUrl ?? env.PUBLIC_BASE_URL).replace(/\/$/, '');
    if (!base) throw Errors.badRequest('未配置 PUBLIC_BASE_URL');

    const items: QrItem[] = [];
    for (const tableNo of body.tables) {
      const url = `${base}/menu?table=${encodeURIComponent(tableNo)}`;
      const dataUrl =
        body.format === 'svg'
          ? `data:image/svg+xml;utf8,${encodeURIComponent(
              await QRCode.toString(url, { type: 'svg', margin: 2, width: 256 }),
            )}`
          : await QRCode.toDataURL(url, { margin: 2, width: 256 });
      items.push({ tableNo, url, dataUrl, format: body.format });
    }
    res.json({ data: items });
  } catch (e) {
    next(e);
  }
});
