import { Router, Request, Response } from 'express';
import { authMiddleware } from '../utils/auth';
import { getUserById } from '../controllers/users_controller';

const router = Router();

// Example protected route to validate token and return profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get complete user information from database
    const userData = await getUserById(user.sub);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;


