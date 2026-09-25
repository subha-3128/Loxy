import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Category, EncryptedVaultPayload, VaultItemRow } from '../types/vault';

const envUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const envAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envAnonKey &&
  envUrl.startsWith('https://') &&
  !envUrl.includes('your-project') &&
  envAnonKey !== 'your-anon-key-here'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(envUrl, envAnonKey)
  : null;

export interface VaultSettingsRecord {
  user_id: string;
  salt: string;
  verification_data: string; // JSON EncryptedVaultPayload
  auto_lock_minutes: number;
}

// ---------------------------------------------------------------------------
// Local Sandbox Storage Helper (zero-knowledge simulation when no DB keys provided)
// ---------------------------------------------------------------------------
const LOCAL_STORAGE_PREFIX = 'loxy_local_';

function getLocalKey(key: string, userId: string): string {
  return `${LOCAL_STORAGE_PREFIX}${userId}_${key}`;
}

export const dbService = {
  isConfigured: isSupabaseConfigured,

  /**
   * Fetch vault settings (salt & verification payload)
   */
  async getVaultSettings(userId: string): Promise<VaultSettingsRecord | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('vault_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vault settings:', error.message);
        return null;
      }
      return data;
    } else {
      // Local sandbox fallback
      const saved = localStorage.getItem(getLocalKey('settings', userId));
      return saved ? JSON.parse(saved) : null;
    }
  },

  /**
   * Save or update vault settings (master salt + verification token)
   */
  async saveVaultSettings(
    userId: string,
    salt: string,
    verification: EncryptedVaultPayload,
    autoLockMinutes: number = 15
  ): Promise<boolean> {
    const record: VaultSettingsRecord = {
      user_id: userId,
      salt,
      verification_data: JSON.stringify(verification),
      auto_lock_minutes: autoLockMinutes,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('vault_settings')
        .upsert(record);

      if (error) {
        console.error('Error saving vault settings:', error.message);
        return false;
      }
      return true;
    } else {
      localStorage.setItem(getLocalKey('settings', userId), JSON.stringify(record));
      return true;
    }
  },

  /**
   * Fetch all encrypted vault items for user
   */
  async getVaultItems(userId: string): Promise<VaultItemRow[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vault items:', error.message);
        return [];
      }
      return data || [];
    } else {
      const raw = localStorage.getItem(getLocalKey('items', userId));
      return raw ? JSON.parse(raw) : [];
    }
  },

  /**
   * Create new encrypted vault item
   */
  async createVaultItem(
    userId: string,
    encryptedData: string,
    category: Category,
    isFavorite: boolean
  ): Promise<VaultItemRow | null> {
    const now = new Date().toISOString();
    const newId = globalThis.crypto.randomUUID();

    const newRecord: VaultItemRow = {
      id: newId,
      user_id: userId,
      encrypted_data: encryptedData,
      category,
      is_favorite: isFavorite,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('vault_items')
        .insert({
          user_id: userId,
          encrypted_data: encryptedData,
          category,
          is_favorite: isFavorite,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating vault item in Supabase:', error.message);
        return null;
      }
      return data;
    } else {
      const items = await this.getVaultItems(userId);
      const updated = [newRecord, ...items];
      localStorage.setItem(getLocalKey('items', userId), JSON.stringify(updated));
      return newRecord;
    }
  },

  /**
   * Update encrypted vault item
   */
  async updateVaultItem(
    userId: string,
    itemId: string,
    encryptedData: string,
    category: Category,
    isFavorite: boolean
  ): Promise<boolean> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('vault_items')
        .update({
          encrypted_data: encryptedData,
          category,
          is_favorite: isFavorite,
          updated_at: now,
        })
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating vault item:', error.message);
        return false;
      }
      return true;
    } else {
      const items = await this.getVaultItems(userId);
      const index = items.findIndex(i => i.id === itemId);
      if (index === -1) return false;

      items[index] = {
        ...items[index],
        encrypted_data: encryptedData,
        category,
        is_favorite: isFavorite,
        updated_at: now,
      };

      localStorage.setItem(getLocalKey('items', userId), JSON.stringify(items));
      return true;
    }
  },

  /**
   * Delete vault item
   */
  async deleteVaultItem(userId: string, itemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('vault_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting vault item:', error.message);
        return false;
      }
      return true;
    } else {
      const items = await this.getVaultItems(userId);
      const filtered = items.filter(i => i.id !== itemId);
      localStorage.setItem(getLocalKey('items', userId), JSON.stringify(filtered));
      return true;
    }
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(userId: string, itemId: string, isFavorite: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('vault_items')
        .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('user_id', userId);

      return !error;
    } else {
      const items = await this.getVaultItems(userId);
      const index = items.findIndex(i => i.id === itemId);
      if (index === -1) return false;
      items[index].is_favorite = isFavorite;
      localStorage.setItem(getLocalKey('items', userId), JSON.stringify(items));
      return true;
    }
  },
};

// ---------------------------------------------------------------------------
// Authentication Service
// ---------------------------------------------------------------------------
export const authService = {
  async signInWithGoogle() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    } else {
      // In local dev/sandbox mode without configured Supabase OAuth credentials,
      // simulate developer sign-in
      return this.signInDemoUser('alex.developer@loxy.vault', 'Alex Vance');
    }
  },

  signInDemoUser(email = 'alex.developer@loxy.vault', name = 'Alex Vance') {
    const demoUser: User = {
      id: 'demo-user-loxy-001',
      app_metadata: {},
      user_metadata: {
        full_name: name,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
    };
    localStorage.setItem('loxy_demo_user', JSON.stringify(demoUser));
    return demoUser;
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('loxy_demo_user');
  },

  async getCurrentUser(): Promise<User | null> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return data.user;
    }
    const demo = localStorage.getItem('loxy_demo_user');
    return demo ? JSON.parse(demo) : null;
  },
};
