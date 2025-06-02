import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
const { pool } = require('../../db');

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ message: 'Invalid login credentials' });
    return ;
  }

  const { email, password } = parse.data;

  try {
    const result = await pool.query('SELECT id, name, email, password FROM users WHERE email = $1', [email]);

    const user = result.rows[0];
    const hashedPassword = user?.password ?? '$2b$10$invalidHashStringToTimeEqualize';
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match || !user) {
        res.status(400).json({ message: 'Invalid email or password' });
      return ;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
