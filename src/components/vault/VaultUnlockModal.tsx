import React, { useState, useEffect, useRef } from 'react';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import { Lock, KeyRound, Eye, EyeOff, ShieldAlert, Sparkles, LogOut, Fingerprint } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  isBiometricsAvailable,
  isBiometricEnabled,
  unlockWithBiometric,
  enableBiometric,
} from '../../lib/biometrics';

export const VaultUnlockModal: React.FC = () => {
  const { isConfigured, isUnlocked, unlockVault, setupVault, loading } = useVault();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [enableBioOnSetup, setEnableBioOnSetup] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUnlocked) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);

      if (user) {
        isBiometricsAvailable().then(avail => {
          setCanUseBiometrics(avail);
          setHasBiometrics(avail && isBiometricEnabled(user.id));
        });
      }
    }
  }, [isUnlocked, isConfigured, user]);

  if (isUnlocked) return null;

  const handleBiometricUnlock = async () => {
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const recoveredPassword = await unlockWithBiometric(user.id);
      if (recoveredPassword) {
        const ok = await unlockVault(recoveredPassword);
        if (ok) {
          showToast('Unlocked with Biometrics', 'success');
          return;
        }
      }
      setError('Biometric authentication failed. Please enter your master password.');
    } catch {
      setError('Biometric unlock was cancelled or unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your master password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await unlockVault(password);
      if (success) {
        showToast('Vault unlocked', 'success');
        if (user && canUseBiometrics && !hasBiometrics && enableBioOnSetup) {
          await enableBiometric(user.id, password);
        }
      } else {
        setError('Unable to unlock your vault. Please check your master password.');
      }
    } catch {
      setError('An error occurred during vault decryption.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Master password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await setupVault(password);
      if (user && canUseBiometrics && enableBioOnSetup) {
        await enableBiometric(user.id, password);
      }
      showToast('Vault created and secured', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize vault';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080C]/90 backdrop-blur-md animate-backdrop-fade">
      <div className="w-full max-w-md bg-[#111116] border border-[#27272F] rounded-2xl p-6 sm:p-8 shadow-2xl animate-modal-pop">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#17171D] border border-[#27272F] flex items-center justify-center mb-4 text-[#8B5CF6]">
            {isConfigured ? <Lock className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>

          <h2 className="text-xl font-bold text-[#F7F7FA]">
            {isConfigured ? 'Unlock Your Vault' : 'Create Master Password'}
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs">
            {isConfigured
              ? 'Enter your master password to decrypt your credentials locally.'
              : 'Set a strong master password to initialize your zero-knowledge encryption keys.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-200">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Biometric Quick Unlock (if registered) */}
        {isConfigured && hasBiometrics && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isSubmitting}
              className="tactile-btn w-full h-11 px-4 rounded-xl bg-[#17171D] hover:bg-[#1D1D24] text-[#F7F7FA] border border-[#8B5CF6]/50 font-medium text-xs flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-[#8B5CF6]" />
              <span>Unlock with Touch ID / Biometrics</span>
            </button>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-[#27272F]" />
              <span className="flex-shrink mx-3 text-[10px] text-[#71717A] uppercase tracking-wider">
                or use master password
              </span>
              <div className="flex-grow border-t border-[#27272F]" />
            </div>
          </div>
        )}

        <form onSubmit={isConfigured ? handleUnlock : handleSetup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5" htmlFor="master-pwd-input">
              {isConfigured ? 'Master Password' : 'New Master Password'}
            </label>
            <div className="relative">
              <input
                id="master-pwd-input"
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter master password..."
                className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#17171D] border border-[#27272F] text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F7F7FA] p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isConfigured && (
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5" htmlFor="confirm-pwd-input">
                Confirm Master Password
              </label>
              <input
                id="confirm-pwd-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter master password..."
                className="w-full h-11 px-3.5 rounded-xl bg-[#17171D] border border-[#27272F] text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors"
                autoComplete="new-password"
                required
              />
              <p className="text-[11px] text-[#A1A1AA] mt-2 leading-relaxed bg-[#17171D]/60 p-2.5 rounded-lg border border-[#27272F]/50">
                <strong className="text-purple-400">Important:</strong> Loxy never stores your master password. If you lose it, your vault data cannot be recovered.
              </p>
            </div>
          )}

          {canUseBiometrics && (
            <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer hover:text-white pt-1">
              <input
                type="checkbox"
                checked={enableBioOnSetup}
                onChange={e => setEnableBioOnSetup(e.target.checked)}
                className="accent-purple-500 rounded"
              />
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Enable Touch ID / Biometric unlock on this device
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="tactile-btn w-full h-11 mt-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-purple-900/20"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Deriving keys & decrypting...'
                : isConfigured
                ? 'Unlock Vault'
                : 'Initialize Vault'}
            </span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#27272F] flex justify-between items-center text-xs text-[#71717A]">
          <span>Protected with PBKDF2 & AES-256</span>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#EF4444] transition-colors p-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
