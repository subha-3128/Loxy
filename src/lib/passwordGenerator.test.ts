import { generatePassword, evaluatePasswordStrength } from './passwordGenerator';

console.log('Testing Loxy secure password generator...');

for (let len = 12; len <= 32; len += 4) {
  const pwd = generatePassword({ length: len, uppercase: true, lowercase: true, numbers: true, symbols: true });
  console.assert(pwd.length === len, `Expected length ${len}, got ${pwd.length}`);
  const strength = evaluatePasswordStrength(pwd);
  console.assert(strength.score >= 3, `Expected strong password for len ${len}, got score ${strength.score}`);
}

// Test without symbols
const noSymbolsPwd = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false });
console.assert(!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(noSymbolsPwd), 'Expected no symbols');

console.log('✅ All password generator checks passed!');
