import {
  generateSalt,
  deriveKeyFromPassword,
  encryptSensitiveData,
  decryptSensitiveData,
  createVaultVerification,
  verifyMasterPassword,
} from './crypto';

async function runCryptoSelfTest() {
  console.log('Testing Loxy zero-knowledge cryptography...');
  
  const testPassword = 'CorrectMasterPassword!2026';
  const wrongPassword = 'WrongPasswordAttempt';
  const salt = generateSalt();

  // 1. Key derivation
  const key = await deriveKeyFromPassword(testPassword, salt);
  console.assert(key !== null, 'Key derivation failed');

  // 2. Encrypt sensitive payload
  const secretPayload = {
    website: 'GitHub',
    username: 'octocat@github.com',
    password: 'superSecretPassword$99',
    url: 'https://github.com',
    notes: '2FA backup codes stored elsewhere',
  };

  const encrypted = await encryptSensitiveData(secretPayload, key);
  console.assert(!encrypted.ciphertext.includes('superSecretPassword'), 'Plaintext leaked in ciphertext!');
  console.assert(encrypted.iv.length > 0, 'IV is missing');

  // 3. Decrypt with correct key
  const decrypted = await decryptSensitiveData<typeof secretPayload>(encrypted, key);
  console.assert(decrypted.password === secretPayload.password, 'Decrypted password mismatch');
  console.assert(decrypted.website === 'GitHub', 'Decrypted website mismatch');

  // 4. Verification token & password check
  const verificationBundle = await createVaultVerification(key, salt);
  const verifiedKey = await verifyMasterPassword(
    testPassword,
    verificationBundle.salt,
    verificationBundle.verification
  );
  console.assert(verifiedKey !== null, 'Valid password verification failed');

  const failedKey = await verifyMasterPassword(
    wrongPassword,
    verificationBundle.salt,
    verificationBundle.verification
  );
  console.assert(failedKey === null, 'Wrong password did not fail verification!');

  console.log('✅ All Loxy cryptographic self-checks passed!');
}

runCryptoSelfTest().catch(err => {
  console.error('❌ Crypto self-test failed:', err);
  process.exit(1);
});
