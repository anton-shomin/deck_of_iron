import React, { useState } from 'react';
import { Volume2, VolumeX, History, Globe, Shield, Smartphone, Menu, X } from 'lucide-react';
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
      <header className="sticky top-0 z-40 w-full bg-[#0e0e0e]/95 backdrop-blur-md px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Main Logo from Design */}
          <div className="flex items-center">
            <span className="font-display text-2xl sm:text-3xl font-black tracking-wider text-[#f2efe9]">
              DECK <span className="text-[#e85324]">OF</span> IRON
            </span>
          </div>

          {/* Menu Button from Design */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-xl bg-[#1c1a17] hover:bg-[#25221d] border border-[#2e2a24] text-[#f2efe9] flex items-center justify-center transition active:scale-95"
            aria-label="Menu"
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Menu Drawer / Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start pt-16 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-auto bg-[#181614] border border-[#2e2a24] rounded-2xl p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2e2a24] pb-3">
              <span className="font-display text-lg tracking-wider font-bold text-[#f2efe9]">
                {lang === 'ru' ? 'МЕНЮ УПРАВЛЕНИЯ' : 'SETTINGS'}
              </span>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Sound Toggle */}
              <button
                onClick={() => {
                  onToggleSound();
                }}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-xs font-bold ${
                  soundEnabled
                    ? 'bg-[#26221d] border-[#3d3830] text-[#f2efe9]'
                    : 'bg-[#141210] border-[#221f1a] text-zinc-500'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#e85324]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                )}
                <span>{soundEnabled ? t.soundOn : t.soundOff}</span>
              </button>

              {/* Language Toggle */}
              <button
                onClick={onToggleLang}
                className="p-3 rounded-xl bg-[#26221d] border border-[#3d3830] text-[#f2efe9] flex items-center gap-2.5 transition text-xs font-bold"
              >
                <Globe className="w-4 h-4 text-zinc-400" />
                <span>{lang === 'ru' ? 'Русский' : 'English'}</span>
              </button>

              {/* History Button */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenHistory();
                }}
                className="col-span-2 p-3 rounded-xl bg-[#26221d] border border-[#3d3830] text-[#f2efe9] flex items-center justify-between transition text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-[#e85324]" />
                  <span>{t.historyTitle}</span>
                </div>
                <span className="text-[10px] text-zinc-400">›</span>
              </button>

              {/* PWA Install */}
              {!isInstalled && isInstallable && (
                <button
                  onClick={() => {
                    install();
                    setShowMenu(false);
                  }}
                  className="col-span-2 p-3 rounded-xl bg-[#e85324] text-white flex items-center justify-center gap-2 font-bold text-xs uppercase"
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
                  className="col-span-2 p-3 rounded-xl bg-[#26221d] border border-[#3d3830] text-[#f2efe9] flex items-center justify-between text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#e85324]" />
                    <span>{t.installOnIOS}</span>
                  </div>
                </button>
              )}
            </div>

            {/* Wake lock status */}
            <div className="pt-2 border-t border-[#2e2a24] text-[11px] text-zinc-400 flex items-center justify-between">
              <span>{lang === 'ru' ? 'Экран включен:' : 'Wake Lock:'}</span>
              <span className={isWakeLockOn ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {isWakeLockOn ? (lang === 'ru' ? 'Активен' : 'Active') : (lang === 'ru' ? 'Выключен' : 'Off')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#181614] border border-[#2e2a24] p-5 shadow-2xl text-[#f2efe9]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-[#e85324]/20 text-[#e85324]">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.iosInstallGuideTitle}</h3>
            </div>
            <div className="space-y-2.5 text-xs text-zinc-300 bg-[#100f0d] p-3.5 rounded-xl border border-[#24211d]">
              <p>{t.iosInstallGuideStep1}</p>
              <p>{t.iosInstallGuideStep2}</p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-[#26221d] hover:bg-[#322d27] py-2.5 text-xs font-bold text-white transition active:scale-98"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
