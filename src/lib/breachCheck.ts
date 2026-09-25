/**
 * HaveIBeenPwned k-Anonymity Password Breach Checker
 * Uses SHA-1 client-side hashing and only sends the 5-char prefix.
 * Zero plaintext or full hash is ever transmitted.
 */

const breachCache = new Map<string, number>();

async function sha1(text: string): Promise<string> {
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Checks how many times a password appears in known data breaches.
 * Returns breach count (0 if clean or offline).
 */
export async function checkPasswordBreach(password: string): Promise<number> {
  if (!password || password.length === 0) return 0;

  if (breachCache.has(password)) {
    return breachCache.get(password)!;
  }

  try {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Prevents response length side-channel attacks
      },
    });

    if (!response.ok) return 0;

    const data = await response.text();
    const lines = data.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix === suffix) {
        const count = parseInt(countStr, 10) || 0;
        breachCache.set(password, count);
        return count;
      }
    }

    breachCache.set(password, 0);
    return 0;
  } catch (err) {
    // Offline or network error - fail silently
    console.debug('Breach check skipped (offline or network error):', err);
    return 0;
  }
}
