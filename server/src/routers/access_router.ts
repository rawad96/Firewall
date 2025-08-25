import { Router, Request, Response } from 'express';
import { authMiddleware } from '../utils/auth';

const router = Router();

// Example protected route to validate token and return profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = (req as any).user;
  return res.json({ user });
});

export default router;


