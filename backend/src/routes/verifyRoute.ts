import { Router, Request, Response } from 'express';
import speakeasy from 'speakeasy';
import { pool } from '../config/dbconfig.js';
import { validateUserId, validateTotpToken } from '../utils/validation.js';
import type { VerifyRequest, ApiResponse } from '../types/types.js';

const router = Router();

interface VerifyRequestBody extends Request {
  body: VerifyRequest;
}

router.post('/verify', async (req: VerifyRequestBody, res: Response<ApiResponse<{ verified: boolean }>>): Promise<void> => {
  try {
    const { userId, token } = req.body;

    // Input validation
    if (!validateUserId(userId)) {
      res.status(400).json({ 
        message: 'Invalid user ID format' 
      });
      return;
    }
    

    if (!validateTotpToken(token)) {
      res.status(400).json({ 
        message: 'Token must be 6 digits' 
      });
      return;
    }

    // Get user's temporary secret
    const result = await pool.query(
      'SELECT temp_secret FROM users WHERE id = $1 AND temp_secret IS NOT NULL', 
      [userId]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({ 
        message: 'User not found or already verified' 
      });
      return;
    }

    const tempSecret = result.rows[0].temp_secret as string;

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow some time drift
    });

    if (verified) {
      // Move temp_secret to secret and clear temp_secret
      await pool.query(
        'UPDATE users SET secret = temp_secret, temp_secret = NULL WHERE id = $1', 
        [userId]
      );
      
      res.json({ 
        data: { verified: true },
        message: '2FA setup completed successfully' 
      });
      return;
    }

    res.json({ 
      data: { verified: false },
      message: 'Invalid token. Please try again.' 
    });

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;
