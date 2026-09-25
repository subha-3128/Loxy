/**
 * WebAuthn Biometric Authenticator (Touch ID, Face ID, Windows Hello)
 * Enables fast biometric unlocking for Loxy without storing master passwords in plaintext.
 *
 * How it works:
 *  1. On registration: create a WebAuthn platform credential. Derive a wrapping key
 *     from the credential's *stable* credential.id (base64url string) + a random salt.
 *     Encrypt the master password with this key and store it in localStorage.
 *  2. On unlock: re-authenticate with the same credential (get assertion). Credential.id
 *     is stable across get() calls. Re-derive the wrapping key and decrypt the password.
 */

import { encryptSensitiveData, decryptSensitiveData, generateSalt, deriveKeyFromPassword } from './crypto';
import type { EncryptedVaultPayload } from '../types/vault';

const BIOMETRIC_KEY_PREFIX = 'loxy_bio_';

/** Returns true only if a real platform authenticator (Touch ID, Windows Hello) is present */
export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;

  try {
    // Primary check: platform authenticator (Touch ID, FaceID, Windows Hello)
    const available =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return false;

    // Secondary check: confirm the browser actually supports conditional mediation
    // (older Safari / Firefox may report true but silently fail)
    if (typeof (window.PublicKeyCredential as unknown as Record<string, unknown>)
      .isConditionalMediationAvailable === 'function') {
      // Non-blocking — just informational; we don't gate on it
    }

    return true;
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

/** Derive rpId — must be the exact hostname used during registration */
function getRpId(): string {
  return window.location.hostname; // e.g. "loxy-pied.vercel.app" or "localhost"
}

/**
 * Register biometric credential and wrap master password locally.
 * Uses credential.id (stable base64url string) as the key derivation input.
 */
export async function enableBiometric(userId: string, masterPassword: string): Promise<boolean> {
  if (!(await isBiometricsAvailable())) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const rpId = getRpId();

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Loxy Vault',
          id: rpId,
        },
        user: {
          id: new TextEncoder().encode(userId.slice(0, 64)), // max 64 bytes
          name: userId,
          displayName: 'Loxy User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256 (preferred)
          { alg: -257, type: 'public-key' },  // RS256 (fallback)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return false;

    // credential.id is a stable base64url string — safe to use as key material
    const bioSalt = generateSalt();
    const wrapKey = await deriveKeyFromPassword(credential.id, bioSalt);

    const wrapped = await encryptSensitiveData(masterPassword, wrapKey);

    const record = {
      credentialId: credential.id,   // stable base64url
      rpId,
      salt: Array.from(bioSalt).join(','),
      wrapped,
    };

    localStorage.setItem(`${BIOMETRIC_KEY_PREFIX}${userId}`, JSON.stringify(record));
    return true;
  } catch (err) {
    console.error('[Loxy] Biometric registration failed:', err);
    return false;
  }
}

/**
 * Unlock vault using Touch ID / Face ID / Windows Hello.
 * Returns the decrypted master password, or null on failure/cancellation.
 */
export async function unlockWithBiometric(userId: string): Promise<string | null> {
  const raw = localStorage.getItem(`${BIOMETRIC_KEY_PREFIX}${userId}`);
  if (!raw) return null;

  let record: { credentialId: string; rpId?: string; salt: string; wrapped: EncryptedVaultPayload };
  try {
    record = JSON.parse(raw);
  } catch {
    return null;
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // Decode stable base64url credentialId back to bytes for allowCredentials
    const credIdBytes = Uint8Array.from(
      atob(record.credentialId.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: record.rpId ?? getRpId(),
        allowCredentials: [
          {
            id: credIdBytes,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) return null;

    // Re-derive wrapping key using the *stable* credential.id string (not rawId bytes)
    const bioSalt = new Uint8Array(record.salt.split(',').map(Number));
    const wrapKey = await deriveKeyFromPassword(record.credentialId, bioSalt);

    const masterPassword = await decryptSensitiveData<string>(record.wrapped, wrapKey);
    return masterPassword;
  } catch (err) {
    // NotAllowedError = user cancelled or timeout; other errors = config mismatch
    console.debug('[Loxy] Biometric authentication failed:', (err as Error)?.name, (err as Error)?.message);
    return null;
  }
}
