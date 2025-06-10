import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { pool } from '../config/dbconfig.js';
import { validateEmail, validateTotpToken, sanitizeString } from '../utils/validation.js';
import type { 
  LoginRequest, 
  LoginResponse, 
  User,
  UserResponse,
  ApiResponse 
} from '../types/types.js';

const router = Router();

interface LoginRequestBody extends Request {
  body: LoginRequest;
}

router.post('/login', async (req: LoginRequestBody, res: Response<LoginResponse>): Promise<void> => {
  try {
    const { email, password, totpToken } = req.body;

    // Input validation
    if (!validateEmail(email)) {
      res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 1) {
      res.status(400).json({ 
        message: 'Password is required' 
      });
      return;
    }

    const sanitizedEmail = sanitizeString(email).toLowerCase();

    const result = await pool.query(
      'SELECT id, uuid, name, email, password, secret FROM users WHERE email = $1', 
      [sanitizedEmail]
    );

    const user = result.rows[0] as User | undefined;
    
    const hashedPassword = user?.password ?? '$2b$12$invalidHashStringToTimeEqualize';
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match || !user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }


    if (user.secret) {
      if (!totpToken) {
        res.status(200).json({ 
          requiresTwoFactor: true, 
          message: 'Please provide your 2FA token' 
        });
        return;
      }

  
      if (!validateTotpToken(totpToken)) {
        res.status(400).json({ 
          message: 'Invalid 2FA token format' 
        });
        return;
      }

      const validTotp = speakeasy.totp.verify({
        secret: user.secret,
        encoding: 'base32',
        token: totpToken,
        window: 2,
      });

      if (!validTotp) {
        res.status(401).json({ message: 'Invalid 2FA token' });
        return;
      }
    }

 
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { uuid: user.uuid, name: user.name, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h', algorithm: 'HS256'}
    );
    
    res.json({ 
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
