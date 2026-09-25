import React, { useState, useEffect } from 'react';
import type { Category, DecryptedVaultItem, SensitiveVaultData } from '../../types/vault';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import {
  generatePassword,
  evaluatePasswordStrength,
  DEFAULT_GENERATOR_OPTIONS,
} from '../../lib/passwordGenerator';
import {
  Eye,
  EyeOff,
  Wand2,
  RefreshCw,
  Star,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: DecryptedVaultItem | null;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  editingItem,
}) => {
  const { addItem, updateItem } = useVault();
  const { showToast } = useToast();

  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genOptions, setGenOptions] = useState(DEFAULT_GENERATOR_OPTIONS);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing or resetting
  useEffect(() => {
    if (editingItem) {
      setWebsite(editingItem.website);
      setUsername(editingItem.username);
      setPassword(editingItem.password);
      setUrl(editingItem.url || '');
      setNotes(editingItem.notes || '');
      setIsFavorite(editingItem.is_favorite);
    } else {
      setWebsite('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
      setIsFavorite(false);
    }
    setError(null);
    setShowGenerator(false);
  }, [editingItem, isOpen]);

  // Regenerate password when generator opened or options change
  useEffect(() => {
    if (showGenerator) {
      setGeneratedPassword(generatePassword(genOptions));
    }
  }, [showGenerator, genOptions]);

  const strength = evaluatePasswordStrength(password);

  const handleApplyGenerated = () => {
    setPassword(generatedPassword);
    setShowGenerator(false);
    showToast('Generated password applied', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!website.trim()) {
      setError('Please provide a website or app name.');
      return;
    }
    if (!password.trim()) {
      setError('Password cannot be empty.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const sensitiveData: SensitiveVaultData = {
      website: website.trim(),
      username: username.trim(),
      password: password.trim(),
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const itemCategory: Category = editingItem?.category || 'Other';

    try {
      if (editingItem) {
        const ok = await updateItem(editingItem.id, sensitiveData, itemCategory, isFavorite);
        if (ok) {
          showToast('Password updated', 'success');
          onClose();
        } else {
          setError('Failed to update password.');
        }
      } else {
        const created = await addItem(sensitiveData, itemCategory, isFavorite);
        if (created) {
          showToast('Password saved', 'success');
          onClose();
        } else {
          setError('Failed to save password.');
        }
      }
    } catch {
      setError('Encryption or storage error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Password' : 'Add New Password'}
      description="Zero-knowledge encrypted client-side before transmission"
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 flex items-start gap-2 text-xs text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Website Name & Website URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
              Website / App Name *
            </label>
            <input
              type="text"
              required
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="e.g. GitHub, AWS, Netflix"
              className="w-full h-10 px-3 rounded-lg bg-[#17171D] border border-[#27272F] text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/login"
              className="w-full h-10 px-3 rounded-lg bg-[#17171D] border border-[#27272F] text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors text-xs"
            />
          </div>
        </div>

        {/* Row 2: Username or Email */}
        <div>
          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
            Username or Email
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="user@example.com"
            className="w-full h-10 px-3 rounded-lg bg-[#17171D] border border-[#27272F] text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors font-mono text-xs"
          />
        </div>

        {/* Row 3: Password & Generator Toggle */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-[#A1A1AA]">
              Password *
            </label>
            <button
              type="button"
              onClick={() => setShowGenerator(!showGenerator)}
              className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1 font-medium cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{showGenerator ? 'Close Generator' : 'Generate Secure'}</span>
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter or generate password..."
              className="w-full h-10 px-3 pr-10 rounded-lg bg-[#17171D] border border-[#27272F] text-sm text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F7F7FA] p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Meter Bar */}
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#27272F] rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map(step => (
                  <div
                    key={step}
                    className="flex-1 h-full rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        step <= strength.score ? strength.color : 'transparent',
                    }}
                  />
                ))}
              </div>
              <span
                className="text-[11px] font-medium shrink-0"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Password Generator Drawer */}
        {showGenerator && (
          <div className="p-4 rounded-xl bg-[#17171D] border border-[#8B5CF6]/30 space-y-3.5 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F7F7FA] flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Password Generator (Web Crypto)
              </span>
              <button
                type="button"
                onClick={() => setGeneratedPassword(generatePassword(genOptions))}
                className="text-xs text-[#A1A1AA] hover:text-white flex items-center gap-1 p-1"
                title="Regenerate password"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>

            {/* Generated Output Preview */}
            <div className="p-2.5 rounded-lg bg-[#111116] border border-[#27272F] font-mono text-xs text-[#8B5CF6] break-all select-all flex items-center justify-between">
              <span>{generatedPassword}</span>
              <button
                type="button"
                onClick={handleApplyGenerated}
                className="px-2.5 py-1 rounded bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[11px] font-medium shrink-0 ml-2"
              >
                Use Password
              </button>
            </div>

            {/* Options: Length */}
            <div>
              <div className="flex justify-between text-xs text-[#A1A1AA] mb-1">
                <span>Length: {genOptions.length} characters</span>
                <span className="font-mono text-[11px]">12 – 32</span>
              </div>
              <input
                type="range"
                min="12"
                max="32"
                value={genOptions.length}
                onChange={e =>
                  setGenOptions({ ...genOptions, length: parseInt(e.target.value) })
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Options: Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Uppercase', key: 'uppercase' },
                { label: 'Lowercase', key: 'lowercase' },
                { label: 'Numbers', key: 'numbers' },
                { label: 'Symbols', key: 'symbols' },
              ].map(({ label, key }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={genOptions[key as keyof typeof genOptions] as boolean}
                    onChange={e =>
                      setGenOptions({ ...genOptions, [key]: e.target.checked })
                    }
                    className="accent-purple-500 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Row 4: Notes */}
        <div>
          <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
            Notes (Encrypted)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Security questions, recovery email, pin codes..."
            className="w-full px-3 py-2 rounded-lg bg-[#17171D] border border-[#27272F] text-xs text-[#F7F7FA] placeholder-[#71717A] focus:border-[#8B5CF6] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Row 5: Favorite Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#F7F7FA] cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-amber-400 text-amber-400' : 'text-[#71717A]'
              }`}
            />
            <span>Mark as favorite</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272F]">
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn px-4 py-2 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] text-[#A1A1AA] hover:text-[#F7F7FA] text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="tactile-btn px-5 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Encrypting & Saving...' : 'Save Password'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
