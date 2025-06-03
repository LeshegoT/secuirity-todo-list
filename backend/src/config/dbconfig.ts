import dotenv from 'dotenv';
import pg from 'pg';
import type { DatabaseConfig } from '../types/types';

dotenv.config();

const { Pool } = pg;

const isProduction: boolean = process.env.NODE_ENV === 'production';

// Validate required environment variables
const requiredEnvVars = ['PG_HOST', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Database configuration
const dbConfig: DatabaseConfig = {
  host: process.env.PG_HOST!,
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE!,
  user: process.env.PG_USER!,
  password: process.env.PG_PASSWORD!,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', (): void => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err: Error): void => {
  console.error('PostgreSQL connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', (): void => {
  pool.end((): void => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
