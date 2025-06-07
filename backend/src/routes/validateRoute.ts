import { Router, Request, Response } from 'express';
import speakeasy from 'speakeasy';
import { pool } from '../config/dbconfig.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateTotpToken } from '../utils/validation.js';
import type { ValidateRequest, ApiResponse } from '../types/types.js';
import { getUserId } from '../queries/users.js';

const router = Router();

interface ValidateRequestBody extends Request {
  body: ValidateRequest;
}

router.post('/validate', authenticateToken, async (req: ValidateRequestBody, res: Response<ApiResponse<{ validated: boolean }>>): Promise<void> => {
  try {
    const { token } = req.body;
    const uuid = req.user?.uuid;
    let userId;
    

    if (!uuid) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    else {
     userId = await getUserId(uuid);
      if(!userId){
          res.status(401).json({ message: 'User not authenticated' });
        return;
      }

    }


    if (!validateTotpToken(token)) {
      res.status(400).json({ 
        message: 'Token must be 6 digits' 
      });
      return;
    }


    const result = await pool.query(
      'SELECT secret FROM users WHERE id = $1 AND secret IS NOT NULL', 
      [userId]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({ 
        message: 'User not found or 2FA not set up' 
      });
      return;
    }

    const secret = result.rows[0].secret as string;

 
    const validated = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    res.json({ data: { validated } });

  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ message: 'Validation failed' });
  }
});

export default router;
