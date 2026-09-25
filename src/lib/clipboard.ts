/**
 * Secure Clipboard Manager
 * Copies sensitive credentials and automatically purges them after 30 seconds.
 */

let clearTimer: ReturnType<typeof setTimeout> | null = null;
let lastCopiedValue: string | null = null;

export async function copySecureCredential(
  value: string,
  timeoutSeconds = 30
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    lastCopiedValue = value;

    if (clearTimer) {
      clearTimeout(clearTimer);
    }

    clearTimer = setTimeout(async () => {
      try {
        // Read clipboard if permission allowed, or overwrite with empty string
        const currentText = await navigator.clipboard.readText().catch(() => null);
        if (currentText === lastCopiedValue || currentText === null) {
          await navigator.clipboard.writeText('');
        }
      } catch {
        // Clipboard access restricted or already overwritten
      } finally {
        lastCopiedValue = null;
        clearTimer = null;
      }
    }, timeoutSeconds * 1000);

    return true;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
