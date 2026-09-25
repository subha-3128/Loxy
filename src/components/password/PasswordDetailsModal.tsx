import React, { useState } from 'react';
import type { DecryptedVaultItem } from '../../types/vault';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Globe,
  FileText,
} from 'lucide-react';

import { copySecureCredential } from '../../lib/clipboard';

interface PasswordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DecryptedVaultItem | null;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

export const PasswordDetailsModal: React.FC<PasswordDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
}) => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  if (!item) return null;

  const handleCopy = async (text: string, field: 'username' | 'password') => {
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
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.website}
      description="Decrypted Vault Record"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* URL / Website */}
        {item.url && (
          <div className="p-3 rounded-lg bg-[#17171D] border border-[#27272F] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA] truncate">
              <Globe className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <span className="truncate">{item.url}</span>
            </div>
            <a
              href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-1 shrink-0 p-1"
            >
              <span>Visit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Username Row */}
        <div className="p-3 rounded-lg bg-[#17171D] border border-[#27272F]">
          <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider block mb-1">
            Username / Email
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-mono text-[#F7F7FA] select-all truncate">
              {item.username || '—'}
            </span>
            {item.username && (
              <button
                onClick={() => handleCopy(item.username, 'username')}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F7F7FA] hover:bg-[#1D1D24] transition-colors"
                title="Copy username"
              >
                {copiedField === 'username' ? (
                  <Check className="w-4 h-4 text-[#22C55E]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Password Row */}
        <div className="p-3 rounded-lg bg-[#17171D] border border-[#27272F]">
          <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider block mb-1">
            Password
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-mono text-[#F7F7FA] select-all truncate">
              {showPassword ? item.password : '••••••••••••••••'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F7F7FA] hover:bg-[#1D1D24] transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy(item.password, 'password')}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#F7F7FA] hover:bg-[#1D1D24] transition-colors"
                title="Copy password"
              >
                {copiedField === 'password' ? (
                  <Check className="w-4 h-4 text-[#22C55E]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="p-3 rounded-lg bg-[#17171D] border border-[#27272F] text-xs">
          <span className="text-[11px] text-[#71717A] flex items-center gap-1 mb-1">
            <Calendar className="w-3.5 h-3.5" /> Updated
          </span>
          <span className="text-[#A1A1AA]">{formatDate(item.updated_at)}</span>
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="p-3 rounded-lg bg-[#17171D] border border-[#27272F]">
            <span className="text-[11px] font-medium text-[#71717A] flex items-center gap-1 mb-1.5 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Encrypted Notes
            </span>
            <p className="text-xs text-[#F7F7FA] whitespace-pre-wrap leading-relaxed">
              {item.notes}
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#27272F]">
          <button
            onClick={() => {
              onClose();
              onDelete(item);
            }}
            className="tactile-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="tactile-btn px-3.5 py-1.5 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] text-xs font-medium text-[#A1A1AA] hover:text-[#F7F7FA] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="tactile-btn flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-medium text-white transition-all shadow-md shadow-purple-900/20 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
