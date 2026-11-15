import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive 32-byte key from secret
const MASTER_KEY = crypto.createHash('sha256').update(env.ENCRYPTION_SECRET).digest();

/**
 * Encrypts a plaintext string into format: iv:authTag:encrypted (hex)
 */
export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts string from format: iv:authTag:encrypted (hex)
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    // Return original if not encrypted
    return encryptedText;
  }

  const [ivHex, authTagHex, cipherText] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
