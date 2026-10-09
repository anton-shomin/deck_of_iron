import React, { useState } from 'react';
import { Volume2, VolumeX, History, Globe, Shield, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../platform/usePWAInstall';
import { Language, translations } from '../../data/translations';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isWakeLockOn: boolean;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  soundEnabled,
  onToggleSound,
  isWakeLockOn,
  onOpenHistory,
}) => {
  const t = translations[lang];
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & Tactical Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-950/60 border border-red-500/30">
              ♠
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-sm tracking-wider text-zinc-100">
                  DECK OF IRON
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  PWA
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                {isWakeLockOn ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t.wakeLockActive}
                  </span>
                ) : (
                  <span className="text-zinc-400 flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5 text-zinc-400" />
                    WAKE LOCK
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5">
            {/* Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                title={t.installApp}
                className="flex items-center gap-1 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-red-400/40 transition active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">APP</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                title={t.installOnIOS}
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-2 py-1.5 rounded-lg border border-zinc-700 transition active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px]">iOS</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? t.soundOn : t.soundOff}
              className={`p-1.5 rounded-lg border transition active:scale-95 ${
                soundEnabled
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:text-white'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {/* Language Toggle (RU / EN) */}
            <button
              onClick={onToggleLang}
              title="Переключить язык / Switch Language"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs font-bold transition active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* History Modal Trigger */}
            <button
              onClick={onOpenHistory}
              title={t.historyTitle}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-200 transition active:scale-95"
            >
              <History className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        </div>
      </header>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-5 shadow-2xl text-zinc-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-red-600/20 text-red-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.iosInstallGuideTitle}</h3>
            </div>
            <div className="space-y-2.5 text-xs text-zinc-300 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              <p>{t.iosInstallGuideStep1}</p>
              <p>{t.iosInstallGuideStep2}</p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-bold text-white transition active:scale-98"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
