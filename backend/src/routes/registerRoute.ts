import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { pool } from '../config/dbconfig.js';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  sanitizeString,
  ValidationError 
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

router.post('/register', async (req: RegisterRequest, res: Response<ApiResponse<RegisterResponse>>): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Input validation with custom error messages
    if (!validateName(name)) {
      res.status(400).json({ 
        message: 'Name must be between 1 and 100 characters' 
      });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({ 
        message: 'Password must be between 12 and 128 characters' 
      });
      return;
    }

    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = sanitizeString(email).toLowerCase();

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', 
      [sanitizedEmail]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate 2FA secret
    const tempSecret = speakeasy.generateSecret({
      name: `2FA App (${sanitizedEmail})`,
      issuer: '2FA App'
    });

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password, temp_secret, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [sanitizedName, sanitizedEmail, hashedPassword, tempSecret.base32]
    );

    if (!result.rows[0]?.id) {
      throw new Error('Failed to create user');
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(tempSecret.otpauth_url || '');

    const responseData: RegisterResponse = {
      id: result.rows[0].id,
      secret: tempSecret.base32 || '',
      qrCode: qrCodeUrl,
      manualEntryKey: tempSecret.base32 || ''
    };

    res.status(201).json({ data: responseData });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;