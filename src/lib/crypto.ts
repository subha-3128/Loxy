import type { EncryptedVaultPayload, SensitiveVaultData } from '../types/vault';

// Web Crypto PBKDF2 & AES-GCM primitives
const PBKDF2_ITERATIONS = 100_000;
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12; // 96 bits recommended for AES-GCM
const SALT_LENGTH_BYTES = 32;
export const KEY_SENTINEL = 'LOXY_VAULT_KEY_VALID_V1';

// Base64 Helpers
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH_BYTES);
  globalThis.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Derive an AES-GCM 256-bit encryption key from a master password and salt using PBKDF2
 */
export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt sensitive vault data using AES-GCM with a fresh random 12-byte IV
 */
export async function encryptSensitiveData(
  data: SensitiveVaultData | string,
  key: CryptoKey
): Promise<EncryptedVaultPayload> {
  const encoder = new TextEncoder();
  const plainText = typeof data === 'string' ? data : JSON.stringify(data);
  const encoded = encoder.encode(plainText);

  const iv = new Uint8Array(IV_LENGTH_BYTES);
  globalThis.crypto.getRandomValues(iv);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    version: 1,
  };
}

/**
 * Decrypt sensitive vault data using AES-GCM
 */
export async function decryptSensitiveData<T = SensitiveVaultData>(
  payload: EncryptedVaultPayload,
  key: CryptoKey
): Promise<T> {
  const ivBuffer = base64ToArrayBuffer(payload.iv);
  const encryptedBuffer = base64ToArrayBuffer(payload.ciphertext);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    key,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(decryptedText) as T;
  } catch {
    return decryptedText as unknown as T;
  }
}

/**
 * Creates vault master verification bundle:
 * Encrypts a known sentinel token with the derived key.
 * Used to verify if a user's password is correct during vault unlock.
 */
export async function createVaultVerification(key: CryptoKey, salt: Uint8Array) {
  const verificationPayload = await encryptSensitiveData(KEY_SENTINEL, key);
  return {
    salt: arrayBufferToBase64(salt),
    verification: verificationPayload,
  };
}

/**
 * Verifies if the entered master password correctly decrypts the vault sentinel.
 */
export async function verifyMasterPassword(
  password: string,
  saltBase64: string,
  verification: EncryptedVaultPayload
): Promise<CryptoKey | null> {
  try {
    const saltBuffer = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const derivedKey = await deriveKeyFromPassword(password, saltBuffer);
    const decrypted = await decryptSensitiveData<string>(verification, derivedKey);
    if (decrypted === KEY_SENTINEL) {
      return derivedKey;
    }
    return null;
  } catch {
    // Decryption failed due to authentication tag mismatch or invalid password
    return null;
  }
}
