import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Language, translations } from '../../data/translations';

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;
  const t = translations[lang];

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-50 flex items-center justify-center gap-2 rounded-xl bg-amber-500/95 px-4 py-2 text-xs font-bold text-zinc-950 shadow-xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 shrink-0 stroke-[2.5]" />
      <span>{t.offlineMode}</span>
    </div>
  );
};
