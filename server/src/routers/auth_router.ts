import { Router, Request, Response } from 'express';
import { createUser, getUserByEmailWithHash } from '../controllers/users_controller';
import * as bcrypt from 'bcryptjs';
import { signToken } from '../utils/auth';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, fullName, phone } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const existing = await getUserByEmailWithHash(email);
    if (existing) return res.status(409).json({ error: 'Email already in use' });
    const user = await createUser(email, password, fullName, phone);
    return res.status(201).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const user = await getUserByEmailWithHash(email);
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: user.id!, email: user.email, role: user.role || 'user' });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;


