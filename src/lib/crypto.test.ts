import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  deriveKeyFromPassword,
  encryptSensitiveData,
  decryptSensitiveData,
  createVaultVerification,
  verifyMasterPassword,
} from './crypto';

describe('crypto (Zero-Knowledge AES-GCM & PBKDF2)', () => {
  it('generates a 32-byte salt', () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.byteLength).toBe(32);
  });

  it('encrypts and decrypts sensitive data correctly without plaintext leakage', async () => {
    const testPassword = 'CorrectMasterPassword!2026';
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(testPassword, salt);
    expect(key).toBeTruthy();

    const secretPayload = {
      website: 'GitHub',
      username: 'octocat@github.com',
      password: 'superSecretPassword$99',
      url: 'https://github.com',
      notes: '2FA backup codes stored elsewhere',
    };

    const encrypted = await encryptSensitiveData(secretPayload, key);
    expect(encrypted.ciphertext.includes('superSecretPassword')).toBe(false);
    expect(encrypted.iv.length).toBeGreaterThan(0);

    const decrypted = await decryptSensitiveData<typeof secretPayload>(encrypted, key);
    expect(decrypted.password).toBe(secretPayload.password);
    expect(decrypted.website).toBe('GitHub');
  });

  it('validates correct master password and rejects invalid attempts', async () => {
    const testPassword = 'CorrectMasterPassword!2026';
    const wrongPassword = 'WrongPasswordAttempt';
    const salt = generateSalt();
    const key = await deriveKeyFromPassword(testPassword, salt);

    const verificationBundle = await createVaultVerification(key, salt);
    const verifiedKey = await verifyMasterPassword(
      testPassword,
      verificationBundle.salt,
      verificationBundle.verification
    );
    expect(verifiedKey).not.toBeNull();

    const failedKey = await verifyMasterPassword(
      wrongPassword,
      verificationBundle.salt,
      verificationBundle.verification
    );
    expect(failedKey).toBeNull();
  });
});
