'use client';

import { ZOZO_API_BASE } from './config';
import { getSession } from './session';

export const COMMENT_MAX_LENGTH = 500;

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
}

export interface PublicComment {
  id: string;
  parentId: string | null;
  author: CommentAuthor;
  body: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  editedAt: string | null;
  liked: boolean;
  mine: boolean;
  /** Bình luận của chính mình đang chờ duyệt. */
  pending: boolean;
  /** Còn sửa được tới lúc này (của mình). */
  editableUntil: string | null;
  replies?: PublicComment[];
}

export interface CommentPage {
  items: PublicComment[];
  nextCursor: string | null;
  total: number;
}

export type CommentSort = 'top' | 'new';
export type ReportReason = 'spam' | 'offensive' | 'other';

/** Lỗi API bình luận, giữ nguyên các trường thêm (until, permanent, retryAfter) để hiện "còn x phút". */
export class CommentError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly until: string | null = null,
    readonly permanent = false,
    readonly retryAfter: number | null = null,
  ) {
    super(message);
  }
}

/**
 * `auth`: 'optional' = có phiên thì gửi token (để biết "của mình" / đã thích); 'guest' = chưa có phiên thì tạo khách
 * (viết bình luận không cần đăng nhập).
 */
async function call<T>(path: string, init: { method?: string; body?: unknown; auth: 'optional' | 'guest' }): Promise<T> {
  const s = getSession();
  const token = init.auth === 'guest' ? await s.getToken({ guest: true }) : s.state.player ? await s.getToken().catch(() => null) : null;
  let res: Response;
  try {
    res = await fetch(`${ZOZO_API_BASE}/api/v1${path}`, {
      method: init.method ?? 'GET',
      headers: {
        accept: 'application/json',
        ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
  } catch {
    throw new CommentError(0, 'network', 'Network error');
  }
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new CommentError(
      res.status,
      String(json?.errorCode ?? `http_${res.status}`),
      String(json?.message ?? res.statusText),
      typeof json?.until === 'string' ? json.until : null,
      json?.permanent === true,
      typeof json?.retryAfter === 'number' ? json.retryAfter : null,
    );
  }
  return (json && 'data' in json ? json.data : json) as T;
}

const enc = encodeURIComponent;

export const commentsApi = {
  list: (slug: string, sort: CommentSort, cursor?: string | null) =>
    call<CommentPage>(`/public/games/${enc(slug)}/comments?sort=${sort}&limit=20${cursor ? `&cursor=${enc(cursor)}` : ''}`, { auth: 'optional' }),
  create: (slug: string, body: string, parentId?: string) =>
    call<PublicComment>(`/public/games/${enc(slug)}/comments`, { method: 'POST', body: { body, ...(parentId ? { parentId } : {}) }, auth: 'guest' }),
  update: (id: string, body: string) => call<PublicComment>(`/public/comments/${id}`, { method: 'PATCH', body: { body }, auth: 'guest' }),
  remove: (id: string) => call<{ ok: true }>(`/public/comments/${id}`, { method: 'DELETE', auth: 'guest' }),
  like: (id: string, on: boolean) => call<{ liked: boolean; likeCount: number }>(`/public/comments/${id}/like`, { method: on ? 'POST' : 'DELETE', auth: 'guest' }),
  report: (id: string, reason: ReportReason) => call<{ ok: true }>(`/public/comments/${id}/report`, { method: 'POST', body: { reason }, auth: 'guest' }),
};
