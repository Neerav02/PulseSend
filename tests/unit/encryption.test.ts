import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../server/src/utils/encryption';

describe('AES-256-GCM Encryption Engine', () => {
  it('correctly encrypts and decrypts secrets with authentication tags', () => {
    const rawSecret = 'xoxb-984729184712-slack-bot-token-secret-12345';

    const encrypted = encrypt(rawSecret);
    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:cipher

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('fails safely or preserves empty strings', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });
});
