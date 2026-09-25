import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import type { AutoLockDuration } from '../../types/vault';
import {
  User,
  Shield,
  Lock,
  Download,
  Database,
  KeyRound,
  Check,
  AlertCircle,
  LogOut,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, signOut, isSupabaseConnected } = useAuth();
  const {
    autoLockMinutes,
    setAutoLockMinutes,
    lockVault,
    changeMasterPassword,
    exportEncryptedVault,
  } = useVault();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value) as AutoLockDuration;
    setAutoLockMinutes(val);
    showToast(`Auto-lock set to ${val === 0 ? 'Never' : val + ' minutes'}`, 'info');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setPasswordError('Please enter your current master password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordError(null);
    setIsChangingPassword(true);

    try {
      const ok = await changeMasterPassword(oldPassword, newPassword);
      if (ok) {
        showToast('Master password changed and vault re-encrypted', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Failed to change password. Current password may be incorrect.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing master password';
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportEncryptedVault();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loxy-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Encrypted vault exported', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Account Section */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-sm font-semibold text-[#F7F7FA]">Account</h2>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#17171D] hover:bg-red-950/40 border border-[#27272F] hover:border-red-800 text-xs font-medium text-[#EF4444] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[#17171D] border border-[#27272F]">
            <span className="text-[11px] text-[#71717A] uppercase tracking-wider block mb-1">
              Email Address
            </span>
            <span className="text-xs font-mono text-[#F7F7FA]">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17171D] border border-[#27272F]">
            <span className="text-[11px] text-[#71717A] uppercase tracking-wider block mb-1">
              Display Name
            </span>
            <span className="text-xs font-medium text-[#F7F7FA]">
              {user?.user_metadata?.full_name || 'Loxy User'}
            </span>
          </div>
        </div>
      </div>

      {/* Vault Security Settings */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-sm font-semibold text-[#F7F7FA]">Vault Security</h2>
        </div>

        {/* Auto Lock Duration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#17171D] border border-[#27272F]">
          <div>
            <h3 className="text-xs font-semibold text-[#F7F7FA]">Auto-Lock Timer</h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Automatically lock and wipe decrypted vault memory when idle.
            </p>
          </div>
          <select
            value={autoLockMinutes}
            onChange={handleAutoLockChange}
            className="h-9 px-3 rounded-lg bg-[#111116] border border-[#27272F] text-xs text-[#F7F7FA] focus:border-[#8B5CF6] focus:outline-none transition-colors"
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes (Default)</option>
            <option value={30}>30 minutes</option>
            <option value={0}>Never (Not recommended)</option>
          </select>
        </div>

        {/* Quick Lock Action */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#17171D] border border-[#27272F]">
          <div>
            <h3 className="text-xs font-semibold text-[#F7F7FA]">Immediate Lock</h3>
            <p className="text-[11px] text-[#71717A] mt-0.5">
              Clear encryption keys from browser memory immediately.
            </p>
          </div>
          <button
            onClick={() => {
              lockVault();
              showToast('Vault locked', 'info');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111116] hover:bg-[#1D1D24] border border-[#27272F] text-xs font-medium text-[#F7F7FA] transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Lock Now</span>
          </button>
        </div>

        {/* Change Master Password Accordion / Form */}
        <div className="p-4 rounded-xl bg-[#17171D] border border-[#27272F] space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="text-xs font-semibold text-[#F7F7FA]">Change Master Password</h3>
          </div>
          <p className="text-[11px] text-[#71717A]">
            Re-encrypts all vault credentials with a newly generated salt and key.
          </p>

          {passwordError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
            <input
              type="password"
              placeholder="Current master password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#111116] border border-[#27272F] text-xs text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                placeholder="New master password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#111116] border border-[#27272F] text-xs text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm new master password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#111116] border border-[#27272F] text-xs text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Re-encrypting vault...' : 'Update Master Password'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Database / Supabase Status */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-sm font-semibold text-[#F7F7FA]">Database Backend</h2>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
            }`}
          >
            {isSupabaseConnected ? 'Connected to Supabase' : 'Local Encrypted Sandbox'}
          </span>
        </div>

        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          {isSupabaseConnected
            ? 'Loxy is connected to your remote Supabase PostgreSQL database with Row Level Security. All records are stored strictly in authenticated ciphertext.'
            : 'Running in Local Encrypted Sandbox mode. All records are stored client-side in encrypted form using AES-GCM 256. To connect to your Supabase instance, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'}
        </p>

        <div className="p-3.5 rounded-xl bg-[#17171D] border border-[#27272F] text-xs font-mono text-[#A1A1AA] space-y-1">
          <div>SQL schema file: <span className="text-[#8B5CF6]">supabase/schema.sql</span></div>
          <div>Encryption: <span className="text-[#22C55E]">Web Crypto AES-GCM (256-bit) + PBKDF2</span></div>
        </div>
      </div>

      {/* Backup & Export */}
      <div className="bg-[#111116] border border-[#27272F] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-sm font-semibold text-[#F7F7FA]">Encrypted Vault Backup</h2>
        </div>

        <p className="text-xs text-[#A1A1AA] leading-relaxed">
          Download a zero-plaintext encrypted JSON backup of your vault items. The file contains only ciphertexts and IVs and cannot be read without your master password.
        </p>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] border border-[#27272F] text-xs font-medium text-[#F7F7FA] transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#8B5CF6]" />
          <span>Export Encrypted Vault (.json)</span>
        </button>
      </div>
    </div>
  );
};
