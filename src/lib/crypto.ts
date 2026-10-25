import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ANON_SECRET = process.env.ANON_SECRET || 'mito_zero_knowledge_privacy_secret_2026';

/**
 * Generates an irreversible, deterministic anonymized user ID.
 * This decouples user profiles (Name/Email) from meal logs in the database.
 */
export function getAnonUserId(userId: string): string {
  if (!userId) return '';
  return createHmac('sha256', ANON_SECRET)
    .update(userId)
    .digest('hex');
}

/**
 * Encrypts sensitive text (e.g. meal description) using AES-256-GCM.
 */
export function encryptText(text: string): string {
  if (!text) return '';
  try {
    const iv = randomBytes(12);
    const key = createHmac('sha256', ANON_SECRET).update('meal_encryption').digest();
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

/**
 * Decrypts AES-256-GCM encrypted text.
 */
export function decryptText(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  // If not encrypted in IV:Tag:Cipher format, return as is
  if (!encryptedPayload.includes(':')) return encryptedPayload;
  
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return encryptedPayload;
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const key = createHmac('sha256', ANON_SECRET).update('meal_encryption').digest();
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return original text if decryption fails (e.g. legacy plain text)
    return encryptedPayload;
  }
}
