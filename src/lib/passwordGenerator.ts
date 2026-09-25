import type { GeneratorOptions, PasswordStrength } from '../types/vault';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: 18,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

/**
 * Generate a cryptographically secure password using globalThis.crypto.getRandomValues
 * Never uses Math.random()
 */
export function generatePassword(options: GeneratorOptions = DEFAULT_GENERATOR_OPTIONS): string {
  let charPool = '';
  const guaranteedChars: string[] = [];

  // Helper to pick random char from set using crypto.getRandomValues
  const getRandomChar = (charset: string): string => {
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    return charset[randomBuffer[0] % charset.length];
  };

  if (options.uppercase) {
    charPool += UPPERCASE_CHARS;
    guaranteedChars.push(getRandomChar(UPPERCASE_CHARS));
  }
  if (options.lowercase) {
    charPool += LOWERCASE_CHARS;
    guaranteedChars.push(getRandomChar(LOWERCASE_CHARS));
  }
  if (options.numbers) {
    charPool += NUMBER_CHARS;
    guaranteedChars.push(getRandomChar(NUMBER_CHARS));
  }
  if (options.symbols) {
    charPool += SYMBOL_CHARS;
    guaranteedChars.push(getRandomChar(SYMBOL_CHARS));
  }

  // Fallback if user unchecks all
  if (charPool.length === 0) {
    charPool = LOWERCASE_CHARS + NUMBER_CHARS;
    guaranteedChars.push(getRandomChar(LOWERCASE_CHARS));
  }

  const length = Math.max(12, Math.min(32, options.length));
  const remainingLength = Math.max(0, length - guaranteedChars.length);

  const passwordChars: string[] = [...guaranteedChars];

  // Fill remaining chars with secure random values
  const randomBuffer = new Uint32Array(remainingLength);
  globalThis.crypto.getRandomValues(randomBuffer);
  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(charPool[randomBuffer[i] % charPool.length]);
  }

  // Shuffle array using Fisher-Yates with crypto.getRandomValues
  const shuffleBuffer = new Uint32Array(passwordChars.length);
  globalThis.crypto.getRandomValues(shuffleBuffer);
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = shuffleBuffer[i] % (i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

/**
 * Calculates password strength locally without sending anything to a server
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Weak',
      color: '#EF4444',
      feedback: ['Enter a password'],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);

  const varietiesCount = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;

  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (password.length >= 18) score++;
  if (varietiesCount >= 3) score++;
  if (varietiesCount === 4 && password.length >= 12) score = Math.min(4, score + 1);

  // Common weak patterns
  if (password.length < 8) {
    score = 0;
    feedback.push('Must be at least 8 characters');
  } else if (password.length < 12) {
    feedback.push('12+ characters recommended');
  }

  if (!hasSymbols) feedback.push('Add special symbols');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasUpper || !hasLower) feedback.push('Mix upper and lower case');

  const normalizedScore = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4;

  switch (normalizedScore) {
    case 0:
    case 1:
      return { score: 1, label: 'Weak', color: '#EF4444', feedback };
    case 2:
      return { score: 2, label: 'Fair', color: '#F59E0B', feedback };
    case 3:
      return { score: 3, label: 'Strong', color: '#3B82F6', feedback: feedback.length ? feedback : ['Good password'] };
    case 4:
    default:
      return { score: 4, label: 'Very Strong', color: '#22C55E', feedback: ['Excellent password entropy'] };
  }
}
