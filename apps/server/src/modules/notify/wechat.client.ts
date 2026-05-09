import axios from 'axios';
import { env } from '../../config/env.js';

const WX_BASE = 'https://api.weixin.qq.com';

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

let cache: AccessTokenCache | null = null;

async function fetchAccessToken(): Promise<string> {
  if (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET) {
    throw new Error('WeChat AppID / AppSecret 未配置');
  }
  const now = Date.now();
  if (cache && cache.expiresAt > now + 60_000) return cache.token;

  const res = await axios.get(`${WX_BASE}/cgi-bin/token`, {
    params: {
      grant_type: 'client_credential',
      appid: env.WECHAT_APP_ID,
      secret: env.WECHAT_APP_SECRET,
    },
    timeout: 8000,
  });
  const { access_token, expires_in, errcode, errmsg } = res.data ?? {};
  if (!access_token) {
    throw new Error(`获取 access_token 失败: ${errcode ?? ''} ${errmsg ?? ''}`);
  }
  cache = {
    token: access_token,
    expiresAt: now + Number(expires_in ?? 7200) * 1000,
  };
  return cache.token;
}

export interface TemplateMessageData {
  [key: string]: { value: string; color?: string };
}

export async function sendTemplateMessage(args: {
  toUser: string;
  templateId: string;
  data: TemplateMessageData;
  url?: string;
}): Promise<{ ok: boolean; raw: unknown }> {
  const token = await fetchAccessToken();
  const payload = {
    touser: args.toUser,
    template_id: args.templateId,
    url: args.url,
    data: args.data,
  };
  const res = await axios.post(
    `${WX_BASE}/cgi-bin/message/template/send?access_token=${token}`,
    payload,
    { timeout: 8000 },
  );
  const errcode = res.data?.errcode;
  if (errcode !== 0) {
    return { ok: false, raw: res.data };
  }
  return { ok: true, raw: res.data };
}
