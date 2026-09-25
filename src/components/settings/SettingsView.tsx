import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import type { AutoLockDuration } from '../../types/vault';
import {
  isBiometricsAvailable,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
} from '../../lib/biometrics';
import { parsePasswordCsv } from '../../lib/csvImporter';
import {
  User,
  Shield,
  Lock,
  Download,
  Upload,
  Database,
  KeyRound,
  Check,
  AlertCircle,
  LogOut,
  Fingerprint,
  Smartphone,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';

/* ─── tiny helpers ─────────────────────────────────────── */

function SectionCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="settings-card"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  badge,
  badgeOk,
}: {
  icon: React.ElementType;
  label: string;
  badge?: string;
  badgeOk?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="settings-icon-wrap">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {label}
        </h2>
      </div>
      {badge && (
        <span className={`settings-badge ${badgeOk ? 'settings-badge--ok' : 'settings-badge--neutral'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function RowItem({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {subtitle && (
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */

export const SettingsView: React.FC = () => {
  const { user, signOut, isSupabaseConnected } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    autoLockMinutes,
    setAutoLockMinutes,
    lockVault,
    changeMasterPassword,
    exportEncryptedVault,
    addItem,
  } = useVault();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwFormOpen, setPwFormOpen] = useState(false);

  // Biometrics
  const [canUseBio, setCanUseBio] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioPasswordPrompt, setBioPasswordPrompt] = useState(false);
  const [bioPassword, setBioPassword] = useState('');

  // CSV Import
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (user) {
      isBiometricsAvailable().then(avail => {
        setCanUseBio(avail);
        setBioEnabled(avail && isBiometricEnabled(user.id));
      });
    }
  }, [user]);

  const handleAutoLockChange = (val: number) => {
    setAutoLockMinutes(val as AutoLockDuration);
    showToast(`Auto-lock: ${val === 0 ? 'Never' : val + ' min'}`, 'info');
  };

  const handleToggleBio = async () => {
    if (!user) return;
    if (bioEnabled) {
      disableBiometric(user.id);
      setBioEnabled(false);
      showToast('Biometric unlock disabled', 'info');
    } else {
      setBioPasswordPrompt(true);
    }
  };

  const handleConfirmEnableBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bioPassword) return;
    const ok = await enableBiometric(user.id, bioPassword);
    if (ok) {
      setBioEnabled(true);
      setBioPasswordPrompt(false);
      setBioPassword('');
      showToast('Touch ID / Biometrics enabled!', 'success');
    } else {
      showToast('Biometric registration failed', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) { setPasswordError('Enter your current master password.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      const ok = await changeMasterPassword(oldPassword, newPassword);
      if (ok) {
        showToast('Master password updated & vault re-encrypted', 'success');
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
        setPwFormOpen(false);
      } else {
        setPasswordError('Current password is incorrect.');
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Error changing password');
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

  const handleCsvFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStats(null);
    try {
      const text = await file.text();
      const items = parsePasswordCsv(text);
      if (items.length === 0) { showToast('No credentials found in CSV', 'error'); return; }
      let imported = 0;
      for (const item of items) {
        const added = await addItem(
          { website: item.website, username: item.username, password: item.password, url: item.url, notes: item.notes },
          item.category
        );
        if (added) imported++;
      }
      setImportStats(`${imported} credential${imported !== 1 ? 's' : ''} imported from ${file.name}`);
      showToast(`Imported ${imported} passwords`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to parse CSV', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const autoLockOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 0, label: 'Never' },
  ];

  return (
    <>
      <style>{`
        .settings-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 18px;
          padding: 24px;
          animation: card-spring-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .settings-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.1) 100%);
          border: 1px solid rgba(139,92,246,0.3);
          color: #a78bfa;
        }
        .settings-badge {
          font-size: 11px; font-weight: 600;
          padding: 3px 10px; border-radius: 999px;
          border: 1px solid;
        }
        .settings-badge--ok {
          background: rgba(34,197,94,0.1); color: #4ade80; border-color: rgba(34,197,94,0.3);
        }
        .settings-badge--neutral {
          background: rgba(139,92,246,0.1); color: #a78bfa; border-color: rgba(139,92,246,0.2);
        }
        .settings-row {
          display: flex; align-items: center;
          padding: 14px 16px; border-radius: 12px;
          background: var(--surface-1);
          border: 1px solid var(--card-border);
          transition: border-color 0.2s;
        }
        .settings-row + .settings-row { margin-top: 8px; }
        .settings-row:hover { border-color: rgba(139,92,246,0.25); }
        .settings-input {
          width: 100%; height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          background: var(--surface-2);
          border: 1px solid var(--card-border);
          font-size: 13px; color: var(--text-primary);
          outline: none; transition: border-color 0.2s;
        }
        .settings-input:focus { border-color: #8B5CF6; }
        .settings-input::placeholder { color: var(--text-muted); }
        .settings-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 10px;
          background: #8B5CF6; color: #fff;
          font-size: 13px; font-weight: 600;
          border: none; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .settings-btn-primary:hover { background: #7C3AED; }
        .settings-btn-primary:active { transform: scale(0.97); }
        .settings-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .settings-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          background: var(--surface-1);
          border: 1px solid var(--card-border);
          color: var(--text-secondary);
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
        }
        .settings-btn-ghost:hover { border-color: rgba(139,92,246,0.4); color: var(--text-primary); }
        .settings-btn-ghost:active { transform: scale(0.97); }
        .settings-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
        .settings-btn-danger {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .settings-btn-danger:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); }
        /* Theme picker pills */
        .theme-pill {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; flex: 1; padding: 14px 8px;
          border-radius: 12px; border: 2px solid var(--card-border);
          background: var(--surface-1);
          color: var(--text-muted);
          font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          position: relative; overflow: hidden;
        }
        .theme-pill:hover { border-color: rgba(139,92,246,0.4); color: var(--text-primary); }
        .theme-pill--active {
          border-color: #8B5CF6;
          background: rgba(139,92,246,0.12);
          color: #a78bfa;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.2), inset 0 0 20px rgba(139,92,246,0.07);
        }
        .theme-pill--active::after {
          content: '✓';
          position: absolute; top: 5px; right: 7px;
          font-size: 10px; color: #8B5CF6; font-weight: 700;
        }
        /* Auto-lock segment */
        .lock-seg {
          display: flex; align-items: center; justify-content: center;
          flex: 1; padding: 8px 4px;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          color: var(--text-muted); cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .lock-seg--active {
          background: rgba(139,92,246,0.18); color: #a78bfa;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.25);
        }
        /* Password input wrapper */
        .pw-field-wrap { position: relative; }
        .pw-field-wrap .settings-input { padding-right: 40px; }
        .pw-eye-btn {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          color: var(--text-muted); background: none; border: none;
          cursor: pointer; padding: 4px; line-height: 0;
          transition: color 0.15s;
        }
        .pw-eye-btn:hover { color: var(--text-primary); }
        /* Avatar */
        .settings-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 700;
          background: linear-gradient(135deg, #7C3AED, #8B5CF6);
          color: #fff; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(139,92,246,0.35);
        }
        /* divider */
        .s-divider { height: 1px; background: var(--card-border); margin: 16px 0; }
        /* accordion chevron */
        .pw-accordion-toggle {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 14px 16px;
          border-radius: 12px;
          background: var(--surface-1);
          border: 1px solid var(--card-border);
          cursor: pointer; transition: all 0.15s;
          text-align: left;
        }
        .pw-accordion-toggle:hover { border-color: rgba(139,92,246,0.35); }
        .pw-accordion-body {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s;
        }
        .pw-accordion-body--open { max-height: 320px; opacity: 1; }
        .pw-accordion-body--closed { max-height: 0; opacity: 0; }
      `}</style>

      <div className="space-y-4 max-w-2xl pb-10">

        {/* ── 1. Account ── */}
        <SectionCard delay={0}>
          <SectionHeader icon={User} label="Account" />

          <div className="flex items-center gap-4">
            <div className="settings-avatar">
              {(user?.user_metadata?.full_name || user?.email || 'L')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.user_metadata?.full_name || 'Loxy User'}
              </p>
              <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
            <button onClick={() => signOut()} className="settings-btn-danger">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </SectionCard>

        {/* ── 2. Appearance ── */}
        <SectionCard delay={60}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="settings-icon-wrap"><Sun className="w-4 h-4" /></div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</span>
            </div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)' }}>
              {[
                { id: 'dark', Icon: Moon, title: 'Dark' },
                { id: 'system', Icon: Monitor, title: 'System' },
                { id: 'light', Icon: Sun, title: 'Light' },
              ].map(({ id, Icon: ThemeIcon, title }) => (
                <button
                  key={id}
                  type="button"
                  title={title}
                  onClick={() => { setTheme(id as 'dark' | 'light' | 'system'); showToast(`Theme: ${title}`, 'info'); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  style={theme === id ? {
                    background: 'rgba(139,92,246,0.18)',
                    color: '#a78bfa',
                    boxShadow: '0 0 0 1px rgba(139,92,246,0.25)'
                  } : { color: 'var(--text-muted)' }}
                >
                  <ThemeIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{title}</span>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Security ── */}
        <SectionCard delay={120}>
          <SectionHeader icon={Shield} label="Vault Security" />

          {/* Auto-lock compact row */}
          <div className="settings-row mb-2">
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Auto-lock</p>
            </div>
            <div className="flex gap-1 p-0.5 rounded-lg shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)' }}>
              {autoLockOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAutoLockChange(opt.value)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer"
                  style={autoLockMinutes === opt.value ? {
                    background: 'rgba(139,92,246,0.18)', color: '#a78bfa',
                    boxShadow: '0 0 0 1px rgba(139,92,246,0.25)'
                  } : { color: 'var(--text-muted)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="s-divider" />

          {/* Biometrics */}
          {canUseBio && (
            <>
              <RowItem
                title="Touch ID / Biometric Unlock"
                subtitle="Unlock vault using device biometrics instead of typing your master password."
                right={
                  <button
                    type="button"
                    onClick={handleToggleBio}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bioEnabled
                        ? 'bg-red-950/30 text-red-400 border-red-800/40 hover:bg-red-950/50'
                        : 'bg-[#8B5CF6] text-white border-transparent hover:bg-[#7C3AED]'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5 inline mr-1" />
                    {bioEnabled ? 'Disable' : 'Enable'}
                  </button>
                }
              />
              {bioPasswordPrompt && (
                <form onSubmit={handleConfirmEnableBio} className="flex gap-2 mt-3">
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Verify master password"
                    value={bioPassword}
                    onChange={e => setBioPassword(e.target.value)}
                    className="settings-input flex-1"
                  />
                  <button type="submit" className="settings-btn-primary">Verify</button>
                </form>
              )}
              <div className="s-divider" />
            </>
          )}

          {/* Change Master Password – accordion */}
          <div>
            <button
              type="button"
              className="pw-accordion-toggle"
              onClick={() => { setPwFormOpen(!pwFormOpen); setPasswordError(null); }}
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4" style={{ color: '#a78bfa' }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Change Master Password</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Re-encrypts all vault credentials with a new key</p>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 transition-transform duration-300"
                style={{ color: 'var(--text-muted)', transform: pwFormOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>

            <div className={`pw-accordion-body ${pwFormOpen ? 'pw-accordion-body--open' : 'pw-accordion-body--closed'}`}>
              <form onSubmit={handleChangePassword} className="space-y-2.5 pt-4" autoComplete="off">
                {passwordError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {passwordError}
                  </div>
                )}
                <div className="pw-field-wrap">
                  <input
                    type={showOld ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Current master password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="settings-input"
                  />
                  <button type="button" className="pw-eye-btn" onClick={() => setShowOld(!showOld)}>
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="pw-field-wrap">
                    <input
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="New password (min 8)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="settings-input"
                    />
                    <button type="button" className="pw-eye-btn" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="pw-field-wrap">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="settings-input"
                    />
                    <button type="button" className="pw-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isChangingPassword} className="settings-btn-primary w-full justify-center">
                  <Check className="w-3.5 h-3.5" />
                  {isChangingPassword ? 'Re-encrypting vault…' : 'Update Master Password'}
                </button>
              </form>
            </div>
          </div>

          <div className="s-divider" />

          {/* Lock Now */}
          <RowItem
            title="Lock Vault Now"
            subtitle="Wipes decrypted keys from browser memory immediately."
            right={
              <button
                type="button"
                onClick={() => { lockVault(); showToast('Vault locked', 'info'); }}
                className="settings-btn-ghost"
              >
                <Lock className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                Lock Now
              </button>
            }
          />
        </SectionCard>

        {/* ── 4. Import & Export ── */}
        <SectionCard delay={180}>
          <SectionHeader icon={Database} label="Data & Backup" />

          <RowItem
            title="Import from CSV"
            subtitle="Migrate from Chrome, Bitwarden, 1Password, or LastPass. Encrypted client-side before storage."
            right={
              <>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvFileSelected} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="settings-btn-ghost"
                >
                  <Upload className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                  {isImporting ? 'Importing…' : 'Import CSV'}
                </button>
              </>
            }
          />

          {importStats && (
            <div className="mt-2 flex items-center gap-2 p-3 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
              <Check className="w-3.5 h-3.5" />
              {importStats}
            </div>
          )}

          <div className="s-divider" />

          <RowItem
            title="Export Encrypted Backup"
            subtitle="Download a zero-plaintext JSON backup. Only readable with your master password."
            right={
              <button type="button" onClick={handleExport} className="settings-btn-ghost">
                <Download className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                Export
              </button>
            }
          />
        </SectionCard>

        {/* ── 5. PWA ── */}
        <SectionCard delay={240}>
          <SectionHeader
            icon={Smartphone}
            label="App Install"
          />

        </SectionCard>

        {/* ── 6. Database Status ── */}
        <SectionCard delay={300}>
          <SectionHeader
            icon={Database}
            label="Database Status"
            badge={isSupabaseConnected ? 'Supabase Connected' : 'Local Mode'}
            badgeOk={isSupabaseConnected}
          />

        </SectionCard>

      </div>
    </>
  );
};
