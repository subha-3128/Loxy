import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import { Lock, Search, LogOut, KeyRound, Menu } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
}) => {
  const { user, signOut } = useAuth();
  const { lockVault, autoLockMinutes } = useVault();
  const { showToast } = useToast();

  const handleLock = () => {
    lockVault();
    showToast('Vault locked', 'info');
  };

  return (
    <header className="h-16 border-b border-[#27272F] bg-[#111116]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#A1A1AA] hover:text-[#F7F7FA] hover:bg-[#17171D] rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#17171D] border border-[#27272F] flex items-center justify-center text-[#8B5CF6]">
            <KeyRound className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-wider font-mono uppercase text-[#F7F7FA]">
            LOXY
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-2 sm:mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search passwords, accounts, categories..."
            className="w-full h-9 pl-9 pr-12 rounded-lg bg-[#17171D] border border-[#27272F] text-xs sm:text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#27272F] text-[#A1A1AA] px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Lock Button */}
        <button
          onClick={handleLock}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] border border-[#27272F] text-xs font-medium text-[#A1A1AA] hover:text-[#F7F7FA] transition-colors cursor-pointer"
          title={`Lock vault now (Auto-lock in ${autoLockMinutes ? autoLockMinutes + 'm' : 'Never'})`}
        >
          <Lock className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="hidden md:inline">Lock Vault</span>
        </button>

        {/* User Profile Avatar / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#27272F]">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-[#27272F] object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#17171D] border border-[#27272F] flex items-center justify-center text-xs font-bold text-[#8B5CF6]">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <button
            onClick={() => signOut()}
            className="p-1.5 text-[#71717A] hover:text-[#EF4444] hover:bg-[#17171D] rounded-lg transition-colors cursor-pointer"
            title="Sign out of Loxy"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
