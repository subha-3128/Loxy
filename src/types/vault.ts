export type Category = 
  | 'Social'
  | 'Work'
  | 'College'
  | 'Banking'
  | 'Shopping'
  | 'Development'
  | 'Entertainment'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Development',
  'Work',
  'Social',
  'Banking',
  'Shopping',
  'College',
  'Entertainment',
  'Other'
];

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface EncryptedVaultPayload {
  ciphertext: string;
  iv: string; // Base64 encoded 12-byte initialization vector
  version?: number;
}

// Supabase row structure (sensitive fields strictly encrypted)
export interface VaultItemRow {
  id: string;
  user_id: string;
  encrypted_data: string; // JSON stringified EncryptedVaultPayload
  category: Category;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// Sensitive payload decrypted locally in client memory
export interface SensitiveVaultData {
  website: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

// Complete decrypted in-memory vault item for UI
export interface DecryptedVaultItem extends SensitiveVaultData {
  id: string;
  user_id: string;
  category: Category;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type AutoLockDuration = 5 | 15 | 30 | 0; // minutes, 0 means Never

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0 = very weak, 4 = very strong
  label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string[];
}

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}
