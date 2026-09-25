import { describe, it, expect } from 'vitest';
import { generatePassword, evaluatePasswordStrength } from './passwordGenerator';

describe('passwordGenerator', () => {
  it('generates passwords of requested lengths', () => {
    for (let len = 12; len <= 32; len += 4) {
      const pwd = generatePassword({ length: len, uppercase: true, lowercase: true, numbers: true, symbols: true });
      expect(pwd.length).toBe(len);
      const strength = evaluatePasswordStrength(pwd);
      expect(strength.score).toBeGreaterThanOrEqual(3);
    }
  });

  it('respects symbol omission option', () => {
    const noSymbolsPwd = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false });
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(noSymbolsPwd)).toBe(false);
  });

  it('evaluates weak passwords appropriately', () => {
    const weak = evaluatePasswordStrength('12345');
    expect(weak.score).toBeLessThanOrEqual(2);
    expect(weak.label).toBe('Weak');
  });
});
