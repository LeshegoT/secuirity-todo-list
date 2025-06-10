import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { pool } from '../config/dbconfig.js';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  sanitizeString,
} from '../utils/validation.js';
import type { 
  UserCreateInput, 
  RegisterResponse, 
  ApiResponse 
} from '../types/types.js';

const router = Router();

interface RegisterRequest extends Request {
  body: UserCreateInput;
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '10m'; 

function signUuid(uuid: string): string {
  return jwt.sign({ uuid }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

router.post(
  '/register', 
  async (req: RegisterRequest, res: Response<ApiResponse<RegisterResponse>>): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      if (!validateName(name)) {
        res.status(400).json({ message: 'Name must be between 1 and 100 characters' });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({ message: 'Please provide a valid email address' });
        return;
      }

      if (!validatePassword(password)) {
        res.status(400).json({ message: 'Password must be between 12 and 128 characters' });
        return;
      }

      const sanitizedName = sanitizeString(name);
      const sanitizedEmail = sanitizeString(email).toLowerCase();

      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [sanitizedEmail]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const secret = speakeasy.generateSecret({
        name: `2FA App (${sanitizedEmail})`,
        issuer: '2FA App'
      });

      const result = await pool.query(
        `INSERT INTO users (name, email, password, secret, is_verified, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW()) RETURNING uuid`,
        [sanitizedName, sanitizedEmail, hashedPassword, secret.base32]
      );

      const userUuid = result.rows[0]?.uuid;
      if (!userUuid) {
        throw new Error('Failed to create user');
      }

      const jwtToken = signUuid(userUuid);
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

      const responseData: RegisterResponse = {
        uuid: jwtToken,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      };

      res.status(201).json({ data: responseData });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
