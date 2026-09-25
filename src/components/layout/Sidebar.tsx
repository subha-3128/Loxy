import React from 'react';
import { useVault } from '../../contexts/VaultContext';
import {
  KeyRound,
  Star,
  ShieldAlert,
  Settings,
  FolderLock,
  Plus,
  Lock,
} from 'lucide-react';

export type MainView = 'dashboard' | 'favorites' | 'security' | 'settings';

interface SidebarProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  onOpenAddModal: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenAddModal,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { items, lockVault } = useVault();

  const totalCount = items.length;
  const favoritesCount = items.filter(i => i.is_favorite).length;

  const handleNav = (view: MainView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="space-y-6">
        {/* Primary Action Button */}
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              onOpenAddModal();
              onCloseMobile();
            }}
            className="tactile-btn w-full h-10 px-3.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-900/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Password</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-3 space-y-1">
          <p className="px-3 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider mb-1">
            Vault
          </p>

          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#17171D] text-[#F7F7FA] border border-[#27272F]'
                : 'text-[#A1A1AA] hover:text-[#F7F7FA] hover:bg-[#17171D]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-[#8B5CF6]" />
              <span>All Passwords</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#27272F]/60 text-[#A1A1AA]">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => handleNav('favorites')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'favorites'
                ? 'bg-[#17171D] text-[#F7F7FA] border border-[#27272F]'
                : 'text-[#A1A1AA] hover:text-[#F7F7FA] hover:bg-[#17171D]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Favorites</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#27272F]/60 text-[#A1A1AA]">
              {favoritesCount}
            </span>
          </button>

          <button
            onClick={() => handleNav('security')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'security'
                ? 'bg-[#17171D] text-[#F7F7FA] border border-[#27272F]'
                : 'text-[#A1A1AA] hover:text-[#F7F7FA] hover:bg-[#17171D]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Security Health</span>
            </div>
          </button>

          <button
            onClick={() => handleNav('settings')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentView === 'settings'
                ? 'bg-[#17171D] text-[#F7F7FA] border border-[#27272F]'
                : 'text-[#A1A1AA] hover:text-[#F7F7FA] hover:bg-[#17171D]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-[#A1A1AA]" />
              <span>Settings</span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Lock Vault Footer */}
      <div className="p-3 border-t border-[#27272F] space-y-2">
        <button
          onClick={() => {
            lockVault();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] text-[#A1A1AA] hover:text-[#F7F7FA] border border-[#27272F] text-xs font-medium transition-colors cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Lock Vault</span>
        </button>
        <p className="text-[10px] text-center text-[#71717A]">
          Loxy • Your keys. Your vault.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className="hidden lg:block w-60 h-[calc(100vh-4rem)] sticky top-16 shrink-0 overflow-y-auto"
        style={{ background: 'var(--bg-surface)', boxShadow: '1px 0 0 0 var(--border)' }}
      >
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--bg-surface)', boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}
      >
        <div className="h-16 border-b border-[#27272F] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono uppercase font-bold text-sm">
            <FolderLock className="w-4 h-4 text-[#8B5CF6]" />
            <span>LOXY VAULT</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="text-xs text-[#A1A1AA] hover:text-white p-1"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto">{content}</div>
      </div>
    </>
  );
};
