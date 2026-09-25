import React from 'react';
import { KeyRound, Star, Plus, ShieldCheck, Settings } from 'lucide-react';
import type { MainView } from './Sidebar';

interface MobileNavProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  onOpenAddModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  onSelectView,
  onOpenAddModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#111116]/95 border-t border-[#27272F] backdrop-blur-xl px-4 flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
      <button
        onClick={() => onSelectView('dashboard')}
        className={`tactile-btn flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] cursor-pointer transition-colors ${
          currentView === 'dashboard'
            ? 'text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10'
            : 'text-[#71717A] hover:text-[#A1A1AA]'
        }`}
      >
        <KeyRound className="w-4 h-4" />
        <span>Vault</span>
      </button>

      <button
        onClick={() => onSelectView('favorites')}
        className={`tactile-btn flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] cursor-pointer transition-colors ${
          currentView === 'favorites'
            ? 'text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10'
            : 'text-[#71717A] hover:text-[#A1A1AA]'
        }`}
      >
        <Star className="w-4 h-4" />
        <span>Favorites</span>
      </button>

      {/* Floating Elevated Center Add Button */}
      <button
        onClick={onOpenAddModal}
        className="tactile-btn w-12 h-12 -mt-6 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center shadow-xl shadow-purple-600/40 ring-4 ring-[#111116] cursor-pointer"
        aria-label="Add new password"
      >
        <Plus className="w-5 h-5" />
      </button>

      <button
        onClick={() => onSelectView('security')}
        className={`tactile-btn flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] cursor-pointer transition-colors ${
          currentView === 'security'
            ? 'text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10'
            : 'text-[#71717A] hover:text-[#A1A1AA]'
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>Security</span>
      </button>

      <button
        onClick={() => onSelectView('settings')}
        className={`tactile-btn flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[11px] cursor-pointer transition-colors ${
          currentView === 'settings'
            ? 'text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10'
            : 'text-[#71717A] hover:text-[#A1A1AA]'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>
    </nav>
  );
};
