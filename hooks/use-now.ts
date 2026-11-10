'use client';

import { useSyncExternalStore } from 'react';

const LOADED_AT = Date.now();
const noopSubscribe = () => () => {};

/** Thời điểm mở trang (ms) phía client; server trả null để "x ngày trước" chỉ hiện sau khi hydrate. */
export function useNow() {
  return useSyncExternalStore(noopSubscribe, () => LOADED_AT, () => null);
}
