import { Router } from 'express';
import { auditDb } from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get audit logs (admin-only)
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Default superuser has role 'admin' in the system
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filters = {
      from: req.query.from as string,
      to: req.query.to as string,
      action: req.query.action as string,
      userId: req.query.userId as string
    };

    const logs = auditDb.getAll(filters);
    res.json({ items: logs, nextCursor: null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
