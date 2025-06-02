import { Router } from 'express';
import speakeasy from 'speakeasy';
import { z } from 'zod';
const { pool } = require('../../db')

const router = Router();

const validateSchema = z.object({
  userId: z.string(),
  token: z.string(),
});

router.post('/validate', async (req, res) => {
  const parse = validateSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Invalid data' });
    return ;
  }

  const { userId, token } = parse.data;

  try {
    const result = await pool.query('SELECT secret FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
        res.status(404).json({ message: 'User not found' });
        return ;
    }

    const secret = result.rows[0].secret;
    const validated = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    res.json({ validated });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ message: 'Validation failed' });
  }
});

export default router;
