import React, { useState } from 'react';
import type { DecryptedVaultItem } from '../../types/vault';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Star,
  MoreVertical,
  KeyRound,
  Edit2,
  Trash2,
  Globe,
} from 'lucide-react';

import { copySecureCredential } from '../../lib/clipboard';

interface PasswordCardProps {
  item: DecryptedVaultItem;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
  onViewDetails: (item: DecryptedVaultItem) => void;
}

export const PasswordCard: React.FC<PasswordCardProps> = ({
  item,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const { toggleFavorite } = useVault();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = async (text: string, field: 'username' | 'password', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (field === 'password') {
        await copySecureCredential(text, 30);
        showToast('Password copied (clears in 30s)', 'success');
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Username copied', 'success');
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(item.id);
  };

  // Derive domain for favicon
  let domain = '';
  if (item.url) {
    try {
      const urlObj = new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`);
      domain = urlObj.hostname;
    } catch {
      domain = '';
    }
  }

  const faviconUrl = domain && !imgError
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  return (
    <div
      onClick={() => onViewDetails(item)}
      className="group bg-[#111116] hover:bg-[#17171D] border border-[#27272F] hover:border-[#3A3A46] rounded-xl p-4 sm:p-5 transition-all duration-150 cursor-pointer relative shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Favicon & Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#17171D] group-hover:bg-[#1D1D24] border border-[#27272F] flex items-center justify-center shrink-0 overflow-hidden">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt={item.website}
                className="w-5 h-5 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="font-bold text-sm text-[#8B5CF6]">
                {item.website.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#F7F7FA] truncate">
                {item.website}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1D1D24] text-[#A1A1AA] border border-[#27272F] shrink-0">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] truncate mt-0.5 font-mono">
              {item.username}
            </p>
          </div>
        </div>

        {/* Right: Favorite & Menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleFavoriteToggle}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-amber-400 hover:bg-[#1D1D24] transition-colors"
            title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
          >
            <Star
              className={`w-4 h-4 ${
                item.is_favorite ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F7F7FA] hover:bg-[#1D1D24] transition-colors"
              aria-label="Options menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-36 bg-[#17171D] border border-[#27272F] rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onViewDetails(item);
                    }}
                    className="w-full px-3 py-2 text-left text-[#F7F7FA] hover:bg-[#1D1D24] flex items-center gap-2"
                  >
                    <span>View details</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(item);
                    }}
                    className="w-full px-3 py-2 text-left text-[#F7F7FA] hover:bg-[#1D1D24] flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Edit</span>
                  </button>
                  {item.url && (
                    <a
                      href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowMenu(false)}
                      className="w-full px-3 py-2 text-left text-[#F7F7FA] hover:bg-[#1D1D24] flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#A1A1AA]" />
                      <span>Open site</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(item);
                    }}
                    className="w-full px-3 py-2 text-left text-[#EF4444] hover:bg-[#1D1D24] flex items-center gap-2 border-t border-[#27272F]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Password Masked Row & Quick Copy Actions */}
      <div className="mt-4 pt-3 border-t border-[#27272F]/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[#A1A1AA] truncate">
          {showPassword ? (
            <span className="text-[#F7F7FA] select-all bg-[#17171D] px-2 py-0.5 rounded border border-[#27272F]">
              {item.password}
            </span>
          ) : (
            <span className="tracking-widest text-[#71717A] text-sm font-bold">
              ••••••••••••
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F7F7FA] hover:bg-[#1D1D24] transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={e => handleCopy(item.username, 'username', e)}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F7F7FA] hover:bg-[#1D1D24] transition-colors flex items-center gap-1 text-[11px]"
            title="Copy username"
            aria-label="Copy username"
          >
            {copiedField === 'username' ? (
              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={e => handleCopy(item.password, 'password', e)}
            className="px-2.5 py-1 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] border border-[#27272F] text-xs font-medium text-[#F7F7FA] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy password"
            aria-label="Copy password"
          >
            {copiedField === 'password' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                <span className="text-[11px] text-[#22C55E]">Copied</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
