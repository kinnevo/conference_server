import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
const ALGORITHM = 'aes-256-gcm';

if (!process.env.ENCRYPTION_KEY) {
  console.warn('WARNING: ENCRYPTION_KEY not set in environment variables. LLM provider encryption will not work.');
}

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '****';
  return `${apiKey.substring(0, 7)}...****`;
}
