import 'server-only';

/**
 * Dữ liệu API đọc thành công gần nhất, giữ trong bộ nhớ của tiến trình Next.
 * Khi cache trang bị xoá (admin vừa sửa) mà đúng lúc đó API lỗi / mạng chập chờn,
 * trang dùng lại dữ liệu này thay vì báo lỗi hoặc hiện trang trống.
 * Mất khi khởi động lại container; lúc đó trang lại lấy từ API như bình thường.
 */
const store = new Map<string, unknown>();

export function remember<T>(key: string, value: T): T {
  store.set(key, value);
  return value;
}

export function recall<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}
