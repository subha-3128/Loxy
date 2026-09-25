/**
 * WebAuthn Biometric Authenticator (Touch ID, Face ID, Windows Hello)
 * Enables fast biometric unlocking for Loxy without storing master passwords in plaintext.
 */

import { encryptSensitiveData, decryptSensitiveData, generateSalt, deriveKeyFromPassword } from './crypto';
import type { EncryptedVaultPayload } from '../types/vault';

const BIOMETRIC_KEY_PREFIX = 'loxy_bio_';

export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isBiometricEnabled(userId: string): boolean {
  return Boolean(localStorage.getItem(`${BIOMETRIC_KEY_PREFIX}${userId}`));
}

export function disableBiometric(userId: string): void {
  localStorage.removeItem(`${BIOMETRIC_KEY_PREFIX}${userId}`);
}

/**
 * Register biometric credential and wrap master password locally
 */
export async function enableBiometric(userId: string, masterPassword: string): Promise<boolean> {
  if (!(await isBiometricsAvailable())) return false;

  try {
    const challenge = new Uint8Array(32);
    globalThis.crypto.getRandomValues(challenge);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Loxy Vault', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'Loxy User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return false;

    // Derive wrapping key from credential rawId + device salt
    const bioSalt = generateSalt();
    const rawIdBytes = new Uint8Array(credential.rawId);
    const wrapKey = await deriveKeyFromPassword(
      Array.from(rawIdBytes).join(','),
      bioSalt
    );

    // Encrypt the master password with the biometric wrapping key
    const wrapped = await encryptSensitiveData(masterPassword, wrapKey);

    const record = {
      credentialId: credential.id,
      salt: Array.from(bioSalt).join(','),
      wrapped,
    };

    localStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${userId}`, JSON.stringify(record));
    return true;
  } catch (err) {
    console.error('Biometric registration failed:', err);
    return false;
  }
}

/**
 * Unlock vault using Touch ID / Face ID
 */
export async function unlockWithBiometric(userId: string): Promise<string | null> {
  const raw = localStorage.getItem(`${BIOMETRIC_KEY_PREFIX}${userId}`);
  if (!raw) return null;

  try {
    const record = JSON.parse(raw) as {
      credentialId: string;
      salt: string;
      wrapped: EncryptedVaultPayload;
    };

    const challenge = new Uint8Array(32);
    globalThis.crypto.getRandomValues(challenge);

    // Prompt user for biometric verification
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: Uint8Array.from(window.atob(record.credentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) return null;

    // Recover master password using rawId and stored salt
    const rawIdBytes = new Uint8Array(assertion.rawId);
    const bioSalt = new Uint8Array(record.salt.split(',').map(Number));

    const wrapKey = await deriveKeyFromPassword(
      Array.from(rawIdBytes).join(','),
      bioSalt
    );

    const masterPassword = await decryptSensitiveData<string>(record.wrapped, wrapKey);
    return masterPassword;
  } catch (err) {
    console.debug('Biometric authentication failed or cancelled:', err);
    return null;
  }
}
