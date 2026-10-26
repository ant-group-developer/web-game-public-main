'use client';
import { useState } from 'react';
export function EmbedCode({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const snippet = '<iframe src="' + url + '" title="Apple Worm" width="960" height="720" style="width:100%;aspect-ratio:4/3;height:auto;border:0" allow="autoplay;fullscreen;gamepad" allowfullscreen loading="lazy"></iframe>';
  return <details className="apple-embed-code"><summary>Nhúng Apple Worm vào website của bạn</summary><p>Sao chép mã iframe để người chơi có thể chơi ngay trên trang của bạn.</p><textarea aria-label="Mã nhúng Apple Worm" value={snippet} readOnly rows={5} onFocus={(event) => event.target.select()} /><button type="button" className="play-button" onClick={async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Đã sao chép' : 'Sao chép mã nhúng'}</button><span role="status">{copied ? ' Mã iframe đã được sao chép.' : ' Bạn cũng có thể chọn mã và nhấn Ctrl+C.'}</span></details>;
}
