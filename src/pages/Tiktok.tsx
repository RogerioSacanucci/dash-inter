import { useEffect } from 'react';
import TiktokPixelManager from '../components/TiktokPixelManager';

export default function Tiktok() {
  useEffect(() => {
    document.title = 'TikTok';
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">TikTok</h1>
        <p className="text-sm text-white/40 mt-0.5">Gerencie pixels, conexões e eventos</p>
      </div>
      <TiktokPixelManager />
    </div>
  );
}
