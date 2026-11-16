import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface LocalAdminCredentials {
  email: string;
  username: string;
  fullName: string;
  passwordSalt: string;
  passwordHash: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CRED_FILE = path.join(DATA_DIR, 'admin-credentials.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getDefaultCredentials(): LocalAdminCredentials {
  const email = (process.env.ADMIN_EMAIL || 'admin@rasmalas.id').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'reggae2026';
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    email,
    username: 'admin',
    fullName: 'Studio Admin Rasmalas',
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    updatedAt: new Date().toISOString(),
  };
}

function readCredentials(): LocalAdminCredentials {
  try {
    if (fs.existsSync(CRED_FILE)) {
      const raw = fs.readFileSync(CRED_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<LocalAdminCredentials>;
      if (parsed.email && parsed.passwordSalt && parsed.passwordHash) {
        return {
          email: parsed.email.toLowerCase(),
          username: (parsed.username || 'admin').toLowerCase(),
          fullName: parsed.fullName || 'Studio Admin Rasmalas',
          passwordSalt: parsed.passwordSalt,
          passwordHash: parsed.passwordHash,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Failed to read admin-credentials.json:', err);
  }
  const defaults = getDefaultCredentials();
  writeCredentials(defaults);
  return defaults;
}

function writeCredentials(creds: LocalAdminCredentials): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${CRED_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(creds, null, 2), 'utf-8');
  fs.renameSync(tmpFile, CRED_FILE);
}

export function getLocalAdminInfo(): {
  email: string;
  username: string;
  fullName: string;
} {
  const creds = readCredentials();
  return {
    email: creds.email,
    username: creds.username,
    fullName: creds.fullName,
  };
}

export function verifyLocalAdminLogin(
  loginInput: string,
  password: string
): { ok: boolean; email: string; username: string; fullName: string } {
  const creds = readCredentials();
  const normalized = loginInput.trim().toLowerCase();
  const identifierMatches =
    normalized === creds.email.toLowerCase() ||
    normalized === creds.username.toLowerCase();

  if (!identifierMatches || !password) {
    return {
      ok: false,
      email: creds.email,
      username: creds.username,
      fullName: creds.fullName,
    };
  }

  const candidateHash = hashPassword(password, creds.passwordSalt);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(creds.passwordHash, 'hex');
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
  return {
    ok: matches,
    email: creds.email,
    username: creds.username,
    fullName: creds.fullName,
  };
}

export function updateLocalAdminProfile(updates: {
  username?: string;
  fullName?: string;
  email?: string;
}): { email: string; username: string; fullName: string } {
  const creds = readCredentials();
  if (typeof updates.username === 'string' && updates.username.trim()) {
    creds.username = updates.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
  }
  if (typeof updates.fullName === 'string' && updates.fullName.trim()) {
    creds.fullName = updates.fullName.trim().slice(0, 80);
  }
  if (typeof updates.email === 'string' && updates.email.trim()) {
    creds.email = updates.email.trim().toLowerCase().slice(0, 120);
  }
  creds.updatedAt = new Date().toISOString();
  writeCredentials(creds);
  return {
    email: creds.email,
    username: creds.username,
    fullName: creds.fullName,
  };
}

export function updateLocalAdminPassword(newPassword: string): void {
  const creds = readCredentials();
  const salt = crypto.randomBytes(16).toString('hex');
  creds.passwordSalt = salt;
  creds.passwordHash = hashPassword(newPassword, salt);
  creds.updatedAt = new Date().toISOString();
  writeCredentials(creds);
}
