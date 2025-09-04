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

  // Check if user is inactive
  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Account is inactive. Please contact administrator.' });
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

router.post('/register', (req, res) => {
  try {
    const { username, password, fullName, phone, email, firstInternshipDate, role, status } = req.body;

    if (!username || !password || !fullName || !phone) {
      return res.status(400).json({ error: 'Required fields missing: username, password, fullName, phone' });
    }

    // Check if username already exists
    const existingUser = userDb.getByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create new user
    const newUser = userDb.create({
      username,
      password,
      fullName,
      phone,
      email,
      firstInternshipDate,
      role: role || 'inactive',
      status: status || 'inactive'
    });

    // Log user creation
    auditDb.create({
      action: 'user_register',
      entityType: 'user',
      entityId: newUser.id,
      userId: newUser.id,
      details: { username, fullName, phone, role: newUser.role },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
