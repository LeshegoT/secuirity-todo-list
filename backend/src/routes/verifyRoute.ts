import { Router } from 'express';
import speakeasy from 'speakeasy';
import { z } from 'zod';
const { pool } = require('../../db');

const router = Router();

const verifySchema = z.object({
  userId: z.string(),
  token: z.string(),
});

router.post('/verify', async (req, res) => {
  const parse = verifySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Invalid data' });
    return;;
  }

  const { userId, token } = parse.data;

  try {
    const result = await pool.query('SELECT temp_secret FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
        res.status(404).json({ message: 'User not found' });
        return; 
    }

    const tempSecret = result.rows[0].temp_secret;

    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) {
      await pool.query('UPDATE users SET secret = temp_secret, temp_secret = NULL WHERE id = $1', [userId]);
    }

    res.json({ verified });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;
