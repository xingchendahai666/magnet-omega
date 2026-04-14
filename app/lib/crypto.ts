/**
 * 加密与哈希工具：InfoHash 计算、Token 生成、数据加密、密码哈希、HMAC 签名
 * 严格基于 Node.js crypto 模块，Vercel Serverless 完全兼容
 */

import crypto from 'crypto';

export function computeInfoHash(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

export function computeSHA256(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function computeMD5(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export function computeBLAKE3(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return crypto.createHash('blake2b512').update(buffer).digest('hex');
}

export function generateRandomToken(length: number = 32): string {
  if (length < 16 || length > 128) throw new Error('Token length must be between 16 and 128');
  return crypto.randomBytes(length).toString('hex');
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateSecureId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString('hex');
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string; iterations: number } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const hash = crypto.pbkdf2Sync(password, actualSalt, iterations, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt, iterations };
}

export function verifyPassword(password: string, hash: string, salt: string, iterations: number = 10000): boolean {
  try {
    const computed = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function encryptData(data: string, key: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted: `${encrypted}:${authTag}`, iv: iv.toString('hex') };
}

export function decryptData(encryptedData: string, key: string, iv: string): string {
  const [encrypted, authTag] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function createHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyHMAC(data: string, secret: string, signature: string): boolean {
  try {
    const expected = createHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function deriveKey(password: string, salt: string, iterations: number = 100000, length: number = 32): string {
  return crypto.pbkdf2Sync(password, salt, iterations, length, 'sha256').toString('hex');
}

export function generateChallenge(): { challenge: string; expected: string } {
  const challenge = crypto.randomBytes(32).toString('hex');
  const expected = computeSHA256(challenge);
  return { challenge, expected };
}

export function verifyChallenge(challenge: string, response: string): boolean {
  return computeSHA256(challenge) === response;
}
