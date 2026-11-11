'use client';

import { useSyncExternalStore } from 'react';
import type { MessageKey } from '@/constants/i18n';

/** Trạng thái giao diện đăng nhập dùng chung toàn trang: hộp thoại đăng nhập và thông báo nhỏ (toast). */

export type AuthMode = 'login' | 'register' | 'forgot';

interface DialogRequest { id: number; mode: AuthMode; resolve: (changed: boolean) => void }
export interface Toast { id: number; key: MessageKey; values: Record<string, string> }

let dialog: DialogRequest | null = null;
let toast: Toast | null = null;
let seq = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((cb) => cb());
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

/** Mở hộp thoại đăng nhập trên trang hiện tại. Kết quả: true = đã đăng nhập / đăng ký xong, false = đóng. */
export function openAuthDialog(mode: AuthMode = 'login'): Promise<boolean> {
  dialog?.resolve(false);
  return new Promise((resolve) => {
    dialog = { id: ++seq, mode, resolve };
    emit();
  });
}

export function closeAuthDialog(changed: boolean) {
  const current = dialog;
  dialog = null;
  emit();
  current?.resolve(changed);
}

export const useAuthDialog = () => useSyncExternalStore(subscribe, () => dialog, () => null);

/** Câu hỏi của API khi đăng nhập / đăng ký lúc đang là khách. */
export interface GuestChoiceInfo {
  guest: { id: string; name: string; code: string };
  account: { exists: boolean; displayName: string | null; avatarUrl: string | null };
}
export type GuestChoice = 'merge' | 'separate';
interface ChoiceRequest { id: number; info: GuestChoiceInfo; resolve: (choice: GuestChoice | null) => void }
let choice: ChoiceRequest | null = null;

/** Hỏi gộp khách vào tài khoản hay dùng riêng. null = đóng hộp thoại (huỷ đăng nhập). */
export function askGuestChoice(info: GuestChoiceInfo): Promise<GuestChoice | null> {
  choice?.resolve(null);
  return new Promise((resolve) => {
    choice = { id: ++seq, info, resolve };
    emit();
  });
}

export function answerGuestChoice(answer: GuestChoice | null) {
  const current = choice;
  choice = null;
  emit();
  current?.resolve(answer);
}

export const useGuestChoice = () => useSyncExternalStore(subscribe, () => choice, () => null);

export function showToast(key: MessageKey, values: Record<string, string> = {}) {
  toast = { id: ++seq, key, values };
  emit();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast = null; emit(); }, 5000);
}

export function hideToast() { toast = null; emit(); }

export const useToast = () => useSyncExternalStore(subscribe, () => toast, () => null);
