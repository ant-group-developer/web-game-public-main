'use client';

/**
 * Google Identity Services (nút "Sign in with Google" + One Tap). Script chỉ tải khi trang / hộp thoại đăng nhập mở.
 * Google trả `credential` (ID token) → POST /auth/google/credential.
 */
interface CredentialResponse { credential?: string }
interface GsiButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}
export interface GsiId {
  initialize(config: Record<string, unknown>): void;
  renderButton(parent: HTMLElement, options: GsiButtonOptions): void;
  prompt(): void;
  cancel(): void;
}

declare global {
  interface Window { google?: { accounts?: { id?: GsiId } } }
}

const SRC = 'https://accounts.google.com/gsi/client';
let script: Promise<GsiId> | null = null;
let initializedFor: string | null = null;
let handler: ((credential: string) => void) | null = null;

function load(): Promise<GsiId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  script ??= new Promise<GsiId>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SRC;
    el.async = true;
    el.onload = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error('gsi')));
    el.onerror = () => { script = null; el.remove(); reject(new Error('gsi')); };
    document.head.appendChild(el);
  });
  return script;
}

/** Tải GIS, khởi tạo một lần cho client ID; credential gửi tới handler đăng ký gần nhất. */
export async function setupGoogle(clientId: string, onCredential: (credential: string) => void): Promise<GsiId> {
  const id = await load();
  if (initializedFor !== clientId) {
    id.initialize({
      client_id: clientId,
      callback: (response: CredentialResponse) => { if (response.credential) handler?.(response.credential); },
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      ux_mode: 'popup',
      itp_support: true,
      use_fedcm_for_prompt: true,
    });
    initializedFor = clientId;
  }
  handler = onCredential;
  return id;
}

export function releaseGoogle(onCredential: (credential: string) => void) {
  if (handler === onCredential) handler = null;
  try { window.google?.accounts?.id?.cancel(); } catch { /* GIS chưa tải */ }
}
