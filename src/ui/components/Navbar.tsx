import React, { useState } from 'react';
import { Volume2, VolumeX, History, Globe, Smartphone, Menu, X } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#12100E]/90 backdrop-blur-md px-4 py-3 border-b border-[#2B2722]/60">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Wordmark with Ember Wake Lock Dot */}
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-black tracking-wider text-[#F2EFE9] uppercase">
              DECK <span className="text-[#E85324]">OF</span> IRON
            </span>
            {isWakeLockOn && (
              <span className="relative flex h-2.5 w-2.5" title={lang === 'ru' ? 'Экран включен' : 'Wake Lock active'}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85324] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E85324]" />
              </span>
            )}
          </div>

          {/* Menu Control Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-xl bg-[#1C1917] hover:bg-[#24201D] border border-[#2B2722] text-[#F2EFE9] flex items-center justify-center transition active:scale-95"
            aria-label="Menu"
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Menu Overlay / Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-16 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-auto bg-[#181614] border border-[#2B2722] rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2B2722] pb-3">
              <span className="font-display text-lg tracking-wider font-bold text-[#F2EFE9] uppercase">
                {lang === 'ru' ? 'МЕНЮ УПРАВЛЕНИЯ' : 'SETTINGS'}
              </span>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 rounded-lg text-[#9C9388] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-xs font-bold ${
                  soundEnabled
                    ? 'bg-[#24201D] border-[#38322B] text-[#F2EFE9]'
                    : 'bg-[#12100E] border-[#2B2722] text-[#7A7367]'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#E85324]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#7A7367]" />
                )}
                <span>{soundEnabled ? t.soundOn : t.soundOff}</span>
              </button>

              {/* Language Toggle */}
              <button
                onClick={onToggleLang}
                className="p-3 rounded-xl bg-[#24201D] border border-[#38322B] text-[#F2EFE9] flex items-center gap-2.5 transition text-xs font-bold"
              >
                <Globe className="w-4 h-4 text-[#9C9388]" />
                <span>{lang === 'ru' ? 'Русский' : 'English'}</span>
              </button>

              {/* History Button */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenHistory();
                }}
                className="col-span-2 p-3 rounded-xl bg-[#24201D] border border-[#38322B] text-[#F2EFE9] flex items-center justify-between transition text-xs font-bold hover:border-[#E85324]/50"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-[#E85324]" />
                  <span>{t.historyTitle}</span>
                </div>
                <span className="text-xs text-[#9C9388]">›</span>
              </button>

              {/* PWA Install */}
              {!isInstalled && isInstallable && (
                <button
                  onClick={() => {
                    install();
                    setShowMenu(false);
                  }}
                  className="col-span-2 p-3 rounded-xl bg-[#E85324] hover:bg-[#D6471C] text-white flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{t.installApp}</span>
                </button>
              )}

              {!isInstalled && isIOS && (
                <button
                  onClick={() => {
                    setShowIOSGuide(true);
                    setShowMenu(false);
                  }}
                  className="col-span-2 p-3 rounded-xl bg-[#24201D] border border-[#38322B] text-[#F2EFE9] flex items-center justify-between text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#E85324]" />
                    <span>{t.installOnIOS}</span>
                  </div>
                  <span className="text-xs text-[#9C9388]">›</span>
                </button>
              )}
            </div>

            {/* Wake lock status */}
            <div className="pt-2 border-t border-[#2B2722] text-[11px] text-[#9C9388] flex items-center justify-between">
              <span>{lang === 'ru' ? 'Экран включен:' : 'Wake Lock:'}</span>
              <span className={isWakeLockOn ? 'text-emerald-400 font-bold flex items-center gap-1.5' : 'text-[#7A7367]'}>
                {isWakeLockOn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {isWakeLockOn ? (lang === 'ru' ? 'Активен' : 'Active') : (lang === 'ru' ? 'Выключен' : 'Off')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#181614] border border-[#2B2722] p-5 shadow-2xl text-[#F2EFE9]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-[#E85324]/20 text-[#E85324]">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.iosInstallGuideTitle}</h3>
            </div>
            <div className="space-y-2.5 text-xs text-zinc-300 bg-[#12100E] p-3.5 rounded-xl border border-[#2B2722]">
              <p>{t.iosInstallGuideStep1}</p>
              <p>{t.iosInstallGuideStep2}</p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#24201D] hover:bg-[#322D27] py-2.5 text-xs font-bold text-white transition active:scale-98"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
