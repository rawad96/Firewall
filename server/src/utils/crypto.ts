import crypto from 'crypto';
import {config} from '../config/env';

const DEFAULT_ALGO = 'aes-256-gcm';
const KEY = Buffer.from(config.PASSWORD_ENC_KEY, 'hex');

export const encrypt = (plaintext: string): { cipher: string; iv: string; tag: string } => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(DEFAULT_ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipher: encrypted.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64') };
};

export const decrypt = (cipher: string, iv: string, tag: string): string => {
  const decipher = crypto.createDecipheriv(DEFAULT_ALGO, KEY, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipher, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
};


