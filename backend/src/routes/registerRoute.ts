import { Router } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import { z } from 'zod';
const { pool } = require('../../db');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(12),
});

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Invalid registration details' });
    return ;
  }

  const { name, email, password } = parse.data;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount! > 0) {
        res.status(400).json({ message: 'Email already registered' });
        return ;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const temp_secret = speakeasy.generateSecret();

    const result = await pool.query(
      `INSERT INTO users (name, email, password, temp_secret)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, hashedPassword, temp_secret.base32]
    );

    res.json({
      id: result.rows[0].id,
      secret: temp_secret.base32, 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
