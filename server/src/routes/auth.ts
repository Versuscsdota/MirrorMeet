import { Router } from 'express';
import { userDb, auditDb } from '../db/database';
import { generateToken, AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = userDb.getByUsername(username);
  if (!user || !userDb.verifyPassword(username, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    role: user.role
  });

  // Log authentication
  auditDb.create({
    action: 'user_login',
    entityType: 'user',
    entityId: user.id,
    userId: user.id,
    details: { username },
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
