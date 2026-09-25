import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVault } from '../../contexts/VaultContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../ui/Toast';
import { Lock, Search, LogOut, Sun, Moon, X } from 'lucide-react';
import logoImg from '../../assets/logo.png';


interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  const { user, signOut } = useAuth();
  const { lockVault, autoLockMinutes } = useVault();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const handleLock = () => {
    lockVault();
    showToast('Vault locked', 'info');
  };

  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || 'U';

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: 'var(--nav-bg, rgba(17,17,22,0.92))',
        borderColor: 'var(--card-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* ── Main row ── */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 h-14">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-xl overflow-hidden border flex items-center justify-center"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <img src={logoImg} alt="Loxy" className="w-full h-full object-cover" />
          </div>
          <span
            className="font-bold text-[15px] tracking-widest font-mono uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            LOXY
          </span>
        </div>

        {/* Desktop search — hidden on mobile */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4 relative">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search vault…"
            className="w-full h-9 pl-9 pr-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--surface-1)',
              border: '1.5px solid var(--card-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#8B5CF6')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--card-border)')}
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Mobile search toggle */}
          <button
            onClick={() => { setMobileSearchOpen(!mobileSearchOpen); if (mobileSearchOpen) onSearchChange(''); }}
            className="sm:hidden nav-icon-btn"
            aria-label="Toggle search"
          >
            {mobileSearchOpen
              ? <X className="w-4 h-4" />
              : <Search className="w-4 h-4" />
            }
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-icon-btn"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {isDark
              ? <Sun className="w-4 h-4" style={{ color: '#fbbf24' }} />
              : <Moon className="w-4 h-4" style={{ color: '#7c3aed' }} />
            }
          </button>

          {/* Lock */}
          <button
            onClick={handleLock}
            className="nav-icon-btn"
            title={`Lock vault (auto-lock: ${autoLockMinutes ? autoLockMinutes + 'm' : 'off'})`}
            aria-label="Lock vault"
          >
            <Lock className="w-4 h-4" style={{ color: '#a78bfa' }} />
          </button>

          {/* Divider */}
          <div
            className="w-px h-5 mx-0.5 hidden sm:block"
            style={{ background: 'var(--card-border)' }}
          />

          {/* Avatar + signout */}
          <div className="flex items-center gap-1">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border"
                style={{ borderColor: 'var(--card-border)' }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: 'linear-gradient(135deg,#7C3AED,#a78bfa)',
                  color: '#fff',
                }}
              >
                {userInitial}
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="nav-icon-btn"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile search row — slides down when open ── */}
      <div
        className="sm:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: mobileSearchOpen ? '56px' : '0px',
          opacity: mobileSearchOpen ? 1 : 0,
        }}
      >
        <div className="px-4 pb-3 pt-0.5 relative">
          <Search
            className="w-4 h-4 absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            ref={mobileSearchRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search vault…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm focus:outline-none"
            style={{
              background: 'var(--surface-1)',
              border: '1.5px solid #8B5CF6',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <style>{`
        .nav-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1.5px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          color: var(--text-muted);
        }
        .nav-icon-btn:hover {
          background: var(--surface-1);
          border-color: var(--card-border);
          color: var(--text-primary);
        }
        .nav-icon-btn:active {
          transform: scale(0.92);
        }
      `}</style>
    </header>
  );
};
