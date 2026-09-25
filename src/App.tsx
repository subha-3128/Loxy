import React, { useState, useMemo } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VaultProvider, useVault } from './contexts/VaultContext';
import { ToastProvider } from './components/ui/Toast';
import { LoginView } from './components/auth/LoginView';
import { VaultUnlockModal } from './components/vault/VaultUnlockModal';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import type { MainView } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { PasswordCard } from './components/password/PasswordCard';
import { PasswordModal } from './components/password/PasswordModal';
import { PasswordDetailsModal } from './components/password/PasswordDetailsModal';
import { DeleteConfirmModal } from './components/password/DeleteConfirmModal';
import { SecurityDashboard } from './components/security/SecurityDashboard';
import { SettingsView } from './components/settings/SettingsView';
import type { DecryptedVaultItem } from './types/vault';
import {
  Plus,
  KeyRound,
  Search,
  ArrowUpDown,
  Inbox,
} from 'lucide-react';

const LoxyApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { items } = useVault();

  // Navigation & Filtering State
  const [currentView, setCurrentView] = useState<MainView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('name');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DecryptedVaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<DecryptedVaultItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<DecryptedVaultItem | null>(null);

  // Network Offline / PWA Status State
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter items locally (Zero-knowledge local filtering)
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by view
    if (currentView === 'favorites') {
      result = result.filter(item => item.is_favorite);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item =>
          item.website.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.url && item.url.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.website.localeCompare(b.website);
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return result;
  }, [items, currentView, searchQuery, sortBy]);

  // Handle Edit Action
  const handleEdit = (item: DecryptedVaultItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  // Keyboard shortcut listener for ⌘K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('header input[type="text"]');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#08080C] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#17171D] border border-[#27272F] flex items-center justify-center text-[#8B5CF6] animate-pulse">
          <KeyRound className="w-5 h-5" />
        </div>
        <p className="text-xs text-[#A1A1AA] font-mono">Loading Loxy...</p>
      </div>
    );
  }

  // Not authenticated → Render Login View
  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#08080C] text-[#F7F7FA] flex flex-col relative overflow-x-clip">
      {/* Ambient background depth glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none ambient-glow-pulse" />

      {/* Offline Status Pill Notification */}
      {isOffline && (
        <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 backdrop-blur-md text-amber-300 text-xs font-medium flex items-center gap-2 shadow-lg animate-toast-pop">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Offline Mode • Vault cached locally</span>
        </div>
      )}

      {/* Vault Unlock / Setup Overlay if locked */}
      <VaultUnlockModal />

      {/* Main App Navigation Header */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Content Area with Sidebar & Main View */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pwa-content-pb lg:pb-8 relative z-10">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenAddModal={() => {
            setEditingItem(null);
            setIsAddModalOpen(true);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {/* SECURITY VIEW */}
          {currentView === 'security' && (
            <SecurityDashboard
              onEditItem={handleEdit}
              onViewItem={setViewingItem}
            />
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && <SettingsView />}

          {/* DASHBOARD & FAVORITES VIEWS */}
          {(currentView === 'dashboard' || currentView === 'favorites') && (
            <div className="space-y-6">
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#F7F7FA] tracking-tight">
                    {currentView === 'favorites'
                      ? 'Favorite Passwords'
                      : 'All Passwords'}
                  </h1>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {filteredItems.length} {filteredItems.length === 1 ? 'credential' : 'credentials'} stored
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Sort Toggle */}
                  <button
                    onClick={() => setSortBy(sortBy === 'name' ? 'recent' : 'name')}
                    className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111116] hover:bg-[#17171D] border border-[#27272F] text-xs font-medium text-[#A1A1AA] hover:text-[#F7F7FA] transition-colors cursor-pointer"
                    title="Toggle sort order"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>{sortBy === 'name' ? 'Name (A-Z)' : 'Recently Updated'}</span>
                  </button>

                  {/* Add Password CTA */}
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddModalOpen(true);
                    }}
                    className="tactile-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition-all shadow-md shadow-purple-900/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Password</span>
                  </button>
                </div>
              </div>

              {/* Password Cards Grid */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {filteredItems.map(item => (
                    <PasswordCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={setDeletingItem}
                      onViewDetails={setViewingItem}
                    />
                  ))}
                </div>
              ) : (
                /* Empty States */
                <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#17171D] border border-[#27272F] flex items-center justify-center mx-auto text-[#8B5CF6]">
                    {searchQuery ? <Search className="w-6 h-6" /> : <Inbox className="w-6 h-6" />}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-[#F7F7FA]">
                      {searchQuery
                        ? 'No passwords found'
                        : currentView === 'favorites'
                        ? 'No favorites yet'
                        : 'Your vault is empty'}
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-1.5 leading-relaxed max-w-xs mx-auto">
                      {searchQuery
                        ? `No credentials matched "${searchQuery}". Try a different keyword or category.`
                        : currentView === 'favorites'
                        ? 'Click the star icon on any password in your vault to pin it to your favorites.'
                        : 'Start protecting your accounts by adding your first password with zero-knowledge encryption.'}
                    </p>
                  </div>

                  <div>
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] border border-[#27272F] text-xs font-medium text-[#F7F7FA] transition-colors cursor-pointer"
                      >
                        Clear Search
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition-all shadow-md shadow-purple-900/20 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Password</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Modals */}
      <PasswordModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
      />

      <PasswordDetailsModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
        onEdit={handleEdit}
        onDelete={setDeletingItem}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        item={deletingItem}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VaultProvider>
          <ToastProvider>
            <LoxyApp />
          </ToastProvider>
        </VaultProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
