import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page not-found">
      <Gamepad2 size={72} />
      <h1>Không tìm thấy game</h1>
      <Link className="play-button" href="/">Về trang chủ</Link>
    </div>
  );
}
