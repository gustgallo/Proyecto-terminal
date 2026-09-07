import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

const splitOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),

  // MySQL / GoogieHost
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_NAME: process.env.DB_NAME || 'bmosjhel_PRODISA_SWGRHP-IG',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_CONNECTION_LIMIT: Number(process.env.DB_CONNECTION_LIMIT || 10),
  DB_SSL: parseBoolean(process.env.DB_SSL, false),

  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-change-this-secret-before-production',
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'],
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  CORS_ORIGINS: splitOrigins(
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:4173'
  ),
} as const;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.startsWith('dev-only-')) {
  throw new Error('JWT_SECRET debe configurarse con un valor seguro en producción.');
}

if (env.NODE_ENV === 'production' && (!env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD)) {
  throw new Error('Faltan credenciales MySQL de producción: DB_HOST, DB_USER o DB_PASSWORD.');
}
