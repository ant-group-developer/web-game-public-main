import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return <div className="empty-state not-found"><Gamepad2 size={70} /><span className="eyebrow">404 · A little off track</span><h1>This game is playing hide and seek.</h1><p>Let’s get you back to the playground.</p><Link className="primary-button" href="/">Back to all games</Link></div>;
}
