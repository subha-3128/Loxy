import { describe, it, expect, vi } from 'vitest';
import { checkPasswordBreach } from './breachCheck';

describe('breachCheck (HaveIBeenPwned k-Anonymity)', () => {
  it('identifies breached password from API response', async () => {
    // SHA-1 of 'password' starts with 5BAA6
    // Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
    const mockHashSuffix = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';
    const mockApiResponse = `0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${mockHashSuffix}:3861493\r\n00D4F6E8FC6ECC079E1D3245AA0135E30D0:2`;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => mockApiResponse,
    } as Response);

    const count = await checkPasswordBreach('password');
    expect(count).toBe(3861493);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.pwnedpasswords.com/range/5BAA6',
      expect.objectContaining({ headers: { 'Add-Padding': 'true' } })
    );

    fetchSpy.mockRestore();
  });

  it('returns 0 for unbreached password', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => '0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n',
    } as Response);

    const count = await checkPasswordBreach('SuperSecretUnbreachedPassword2026!');
    expect(count).toBe(0);

    fetchSpy.mockRestore();
  });

  it('handles network failure gracefully returning 0', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const count = await checkPasswordBreach('anyPassword');
    expect(count).toBe(0);

    fetchSpy.mockRestore();
  });
});
