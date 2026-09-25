import React, { useState } from 'react';
import type { DecryptedVaultItem } from '../../types/vault';
import { useVault } from '../../contexts/VaultContext';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DecryptedVaultItem | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const { deleteItem } = useVault();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const ok = await deleteItem(item.id);
      if (ok) {
        showToast('Password deleted', 'success');
        onClose();
      } else {
        showToast('Failed to delete item', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${item.website}?`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="text-xs text-red-200/90 leading-relaxed">
            <p className="font-semibold text-red-200 mb-1">
              This action cannot be undone.
            </p>
            <p>
              This password entry for <strong className="text-white">{item.website}</strong> ({item.username}) will be permanently removed from your encrypted vault.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="tactile-btn px-4 py-2 rounded-lg bg-[#17171D] hover:bg-[#1D1D24] text-[#A1A1AA] hover:text-[#F7F7FA] text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="tactile-btn px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-red-600 text-white text-xs font-medium transition-all shadow-md shadow-red-900/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
