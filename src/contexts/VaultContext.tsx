import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type {
  AutoLockDuration,
  Category,
  DecryptedVaultItem,
  EncryptedVaultPayload,
  SensitiveVaultData,
} from '../types/vault';
import {
  createVaultVerification,
  decryptSensitiveData,
  deriveKeyFromPassword,
  encryptSensitiveData,
  generateSalt,
  verifyMasterPassword,
} from '../lib/crypto';
import { dbService } from '../lib/supabase';
import type { VaultSettingsRecord } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface VaultContextType {
  isConfigured: boolean;
  isUnlocked: boolean;
  loading: boolean;
  items: DecryptedVaultItem[];
  autoLockMinutes: AutoLockDuration;
  setupVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  addItem: (data: SensitiveVaultData, category: Category, isFavorite?: boolean) => Promise<DecryptedVaultItem | null>;
  updateItem: (id: string, data: SensitiveVaultData, category: Category, isFavorite?: boolean) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  setAutoLockMinutes: (minutes: AutoLockDuration) => void;
  exportEncryptedVault: () => Promise<string>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<AutoLockDuration>(15);

  // Sensitive cryptographic state held strictly in memory
  const masterKeyRef = useRef<CryptoKey | null>(null);
  const vaultSettingsRef = useRef<VaultSettingsRecord | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Wipe in-memory secrets and lock
  const lockVault = useCallback(() => {
    masterKeyRef.current = null;
    setItems([]);
    setIsUnlocked(false);
  }, []);

  // Check vault configuration on user sign-in
  useEffect(() => {
    if (!user) {
      lockVault();
      setIsConfigured(false);
      vaultSettingsRef.current = null;
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadVaultMeta() {
      setLoading(true);
      try {
        const settings = await dbService.getVaultSettings(user!.id);
        if (isMounted) {
          if (settings && settings.salt && settings.verification_data) {
            vaultSettingsRef.current = settings;
            setIsConfigured(true);
            if (settings.auto_lock_minutes !== undefined) {
              setAutoLockMinutesState(settings.auto_lock_minutes as AutoLockDuration);
            }
          } else {
            setIsConfigured(false);
            vaultSettingsRef.current = null;
          }
        }
      } catch (err) {
        console.error('Failed to load vault settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVaultMeta();

    return () => {
      isMounted = false;
    };
  }, [user, lockVault]);

  // Activity tracking for Auto-Lock
  useEffect(() => {
    if (!isUnlocked || autoLockMinutes === 0) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - lastActivityRef.current) / (1000 * 60);
      if (elapsedMinutes >= autoLockMinutes) {
        console.log(`Auto-lock triggered after ${autoLockMinutes} minutes of inactivity.`);
        lockVault();
      }
    }, 15000); // Check every 15 seconds

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isUnlocked, autoLockMinutes, lockVault]);

  /**
   * Setup vault for the first time: generates salt & verification sentinel
   */
  const setupVault = async (masterPassword: string): Promise<void> => {
    if (!user) throw new Error('User must be logged in to initialize vault');
    setLoading(true);
    try {
      const salt = generateSalt();
      const key = await deriveKeyFromPassword(masterPassword, salt);
      const verificationBundle = await createVaultVerification(key, salt);

      const success = await dbService.saveVaultSettings(
        user.id,
        verificationBundle.salt,
        verificationBundle.verification,
        autoLockMinutes
      );

      if (!success) {
        throw new Error('Failed to save vault settings to database');
      }

      vaultSettingsRef.current = {
        user_id: user.id,
        salt: verificationBundle.salt,
        verification_data: JSON.stringify(verificationBundle.verification),
        auto_lock_minutes: autoLockMinutes,
      };

      masterKeyRef.current = key;
      setIsConfigured(true);
      setIsUnlocked(true);
      setItems([]);
      lastActivityRef.current = Date.now();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unlock vault with master password
   */
  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    if (!user || !vaultSettingsRef.current) return false;
    setLoading(true);

    try {
      const verificationPayload: EncryptedVaultPayload = JSON.parse(
        vaultSettingsRef.current.verification_data
      );

      const verifiedKey = await verifyMasterPassword(
        masterPassword,
        vaultSettingsRef.current.salt,
        verificationPayload
      );

      if (!verifiedKey) {
        return false;
      }

      masterKeyRef.current = verifiedKey;
      lastActivityRef.current = Date.now();

      // Fetch encrypted records and decrypt locally
      const rows = await dbService.getVaultItems(user.id);
      const decryptedList: DecryptedVaultItem[] = [];

      for (const row of rows) {
        try {
          const payload: EncryptedVaultPayload = JSON.parse(row.encrypted_data);
          const sensitive = await decryptSensitiveData<SensitiveVaultData>(payload, verifiedKey);
          decryptedList.push({
            id: row.id,
            user_id: row.user_id,
            category: row.category,
            is_favorite: row.is_favorite,
            created_at: row.created_at,
            updated_at: row.updated_at,
            website: sensitive.website,
            username: sensitive.username,
            password: sensitive.password,
            url: sensitive.url,
            notes: sensitive.notes,
          });
        } catch (decryptErr) {
          console.error(`Failed to decrypt item ${row.id}:`, decryptErr);
        }
      }

      setItems(decryptedList);
      setIsUnlocked(true);
      return true;
    } catch (err) {
      console.error('Error unlocking vault:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add new password item (encrypts before database write)
   */
  const addItem = async (
    data: SensitiveVaultData,
    category: Category,
    isFavorite = false
  ): Promise<DecryptedVaultItem | null> => {
    if (!user || !masterKeyRef.current) throw new Error('Vault is locked');

    const encrypted = await encryptSensitiveData(data, masterKeyRef.current);
    const encryptedString = JSON.stringify(encrypted);

    const row = await dbService.createVaultItem(user.id, encryptedString, category, isFavorite);
    if (!row) return null;

    const newItem: DecryptedVaultItem = {
      ...data,
      id: row.id,
      user_id: row.user_id,
      category: row.category,
      is_favorite: row.is_favorite,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    setItems(prev => [newItem, ...prev]);
    lastActivityRef.current = Date.now();
    return newItem;
  };

  /**
   * Update existing password item (encrypts before database write)
   */
  const updateItem = async (
    id: string,
    data: SensitiveVaultData,
    category: Category,
    isFavorite = false
  ): Promise<boolean> => {
    if (!user || !masterKeyRef.current) throw new Error('Vault is locked');

    const encrypted = await encryptSensitiveData(data, masterKeyRef.current);
    const encryptedString = JSON.stringify(encrypted);

    const success = await dbService.updateVaultItem(user.id, id, encryptedString, category, isFavorite);
    if (!success) return false;

    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              ...data,
              category,
              is_favorite: isFavorite,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
    lastActivityRef.current = Date.now();
    return true;
  };

  /**
   * Delete item
   */
  const deleteItem = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const success = await dbService.deleteVaultItem(user.id, id);
    if (success) {
      setItems(prev => prev.filter(i => i.id !== id));
      lastActivityRef.current = Date.now();
    }
    return success;
  };

  /**
   * Toggle favorite
   */
  const toggleFavorite = async (id: string): Promise<boolean> => {
    if (!user) return false;
    const target = items.find(i => i.id === id);
    if (!target) return false;

    const nextVal = !target.is_favorite;
    const success = await dbService.toggleFavorite(user.id, id, nextVal);
    if (success) {
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, is_favorite: nextVal } : item))
      );
      lastActivityRef.current = Date.now();
    }
    return success;
  };

  /**
   * Change Master Password:
   * Re-encrypts all items with the newly derived key and updates vault verification.
   */
  const changeMasterPassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!user || !vaultSettingsRef.current || !masterKeyRef.current) return false;
    setLoading(true);

    try {
      const verificationPayload: EncryptedVaultPayload = JSON.parse(
        vaultSettingsRef.current.verification_data
      );
      const verifiedKey = await verifyMasterPassword(
        oldPassword,
        vaultSettingsRef.current.salt,
        verificationPayload
      );

      if (!verifiedKey) {
        throw new Error('Current master password is incorrect');
      }

      // Generate new salt and new key
      const newSalt = generateSalt();
      const newKey = await deriveKeyFromPassword(newPassword, newSalt);
      const newVerification = await createVaultVerification(newKey, newSalt);

      // Save new settings
      const settingsSaved = await dbService.saveVaultSettings(
        user.id,
        newVerification.salt,
        newVerification.verification,
        autoLockMinutes
      );
      if (!settingsSaved) throw new Error('Failed to update vault settings');

      // Re-encrypt every existing item in memory with new key and write to DB
      for (const item of items) {
        const sensitive: SensitiveVaultData = {
          website: item.website,
          username: item.username,
          password: item.password,
          url: item.url,
          notes: item.notes,
        };
        const reEncrypted = await encryptSensitiveData(sensitive, newKey);
        await dbService.updateVaultItem(
          user.id,
          item.id,
          JSON.stringify(reEncrypted),
          item.category,
          item.is_favorite
        );
      }

      masterKeyRef.current = newKey;
      vaultSettingsRef.current = {
        user_id: user.id,
        salt: newVerification.salt,
        verification_data: JSON.stringify(newVerification.verification),
        auto_lock_minutes: autoLockMinutes,
      };

      lastActivityRef.current = Date.now();
      return true;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change auto-lock duration preference
   */
  const setAutoLockMinutes = (minutes: AutoLockDuration) => {
    setAutoLockMinutesState(minutes);
    if (user && vaultSettingsRef.current) {
      dbService.saveVaultSettings(
        user.id,
        vaultSettingsRef.current.salt,
        JSON.parse(vaultSettingsRef.current.verification_data),
        minutes
      );
    }
  };

  /**
   * Export encrypted vault: dumps zero-plaintext encrypted JSON backup
   */
  const exportEncryptedVault = async (): Promise<string> => {
    if (!user) throw new Error('User not logged in');
    const rows = await dbService.getVaultItems(user.id);
    const backup = {
      app: 'Loxy',
      version: 1,
      exported_at: new Date().toISOString(),
      user_id: user.id,
      items: rows,
    };
    return JSON.stringify(backup, null, 2);
  };

  return (
    <VaultContext.Provider
      value={{
        isConfigured,
        isUnlocked,
        loading,
        items,
        autoLockMinutes,
        setupVault,
        unlockVault,
        lockVault,
        addItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        changeMasterPassword,
        setAutoLockMinutes,
        exportEncryptedVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
