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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-[#111116]/95 border-t border-[#27272F] backdrop-blur-md px-3 flex items-center justify-around">
      <button
        onClick={() => onSelectView('dashboard')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] ${
          currentView === 'dashboard' ? 'text-[#8B5CF6] font-medium' : 'text-[#71717A]'
        }`}
      >
        <KeyRound className="w-4 h-4" />
        <span>Vault</span>
      </button>

      <button
        onClick={() => onSelectView('favorites')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] ${
          currentView === 'favorites' ? 'text-[#8B5CF6] font-medium' : 'text-[#71717A]'
        }`}
      >
        <Star className="w-4 h-4" />
        <span>Favorites</span>
      </button>

      {/* Floating Center Add Button */}
      <button
        onClick={onOpenAddModal}
        className="w-10 h-10 -mt-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 active:scale-95 transition-transform"
        aria-label="Add new password"
      >
        <Plus className="w-5 h-5" />
      </button>

      <button
        onClick={() => onSelectView('security')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] ${
          currentView === 'security' ? 'text-[#8B5CF6] font-medium' : 'text-[#71717A]'
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>Security</span>
      </button>

      <button
        onClick={() => onSelectView('settings')}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] ${
          currentView === 'settings' ? 'text-[#8B5CF6] font-medium' : 'text-[#71717A]'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>
    </nav>
  );
};
