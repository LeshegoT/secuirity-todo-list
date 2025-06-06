import { Router, Request, Response } from 'express';
import speakeasy from 'speakeasy';
import { pool } from '../config/dbconfig.js';
import { validateUuid, validateTotpToken } from '../utils/validation.js';
import type { VerifyRequest, ApiResponse } from '../types/types.js';

const router = Router();

interface VerifyRequestBody extends Request {
  body: VerifyRequest;
}

router.post('/verify', async (req: VerifyRequestBody, res: Response<ApiResponse<{ verified: boolean }>>): Promise<void> => {
  try {
    const { uuid, token } = req.body;

    if (!validateUuid(uuid)) {
      res.status(400).json({ message: 'Invalid UUID format' });
      return;
    }

    if (!validateTotpToken(token)) {
      res.status(400).json({ message: 'Token must be 6 digits' });
      return;
    }

    const result = await pool.query(
      'SELECT id, secret, is_verified FROM users WHERE uuid = $1 AND secret IS NOT NULL',
      [uuid]
    );

    if (!result.rowCount || result.rows.length === 0) {
      res.status(404).json({ message: 'User not found or 2FA not set up' });
      return;
    }

    if (result.rows[0].is_verified) {
      res.status(400).json({ message: 'User already verified' });
      return;
    }

    const { id, secret } = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      await pool.query(
        'UPDATE users SET is_verified = TRUE WHERE id = $1',
        [id]
      );

      res.json({
        data: { verified: true },
        message: '2FA verification successful'
      });
      return;
    }

    res.status(400).json({
      data: { verified: false },
      message: 'Invalid token. Please try again.'
    });

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;