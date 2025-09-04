import express from 'express';
import * as bcrypt from 'bcryptjs';
import { userDb, roleDb, auditDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = userDb.getAll();
    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = userDb.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (registration)
router.post('/', async (req, res) => {
  try {
    const { username, password, fullName, phone, email, firstInternshipDate, avatar } = req.body;

    if (!username || !password || !fullName || !phone) {
      return res.status(400).json({ error: 'Username, password, fullName, and phone are required' });
    }

    // Check if username already exists
    const existingUser = userDb.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const userData = {
      username,
      password,
      fullName,
      phone,
      email,
      firstInternshipDate,
      avatar,
      role: 'inactive',
      status: 'inactive'
    };

    const newUser = userDb.create(userData);
    
    // Log the registration
    auditDb.create({
      action: 'create',
      entityType: 'user',
      entityId: newUser.id,
      userId: newUser.id,
      details: { username, fullName, role: 'inactive' },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Verify role exists
    const roleData = roleDb.getByName(role);
    if (!roleData) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updatedUser = userDb.updateRole(userId, role);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the role change
    auditDb.create({
      action: 'update_role',
      entityType: 'user',
      entityId: userId,
      userId: (req as any).user.id,
      details: { newRole: role, previousRole: updatedUser.role },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const user = userDb.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = userDb.update(userId, { status });
    
    // Log the status change
    auditDb.create({
      action: 'update_status',
      entityType: 'user',
      entityId: userId,
      userId: (req as any).user.id,
      details: { newStatus: status, previousStatus: user.status },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password, ...safeUser } = updatedUser!;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user profile and role (admin only)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Handle password update for root user only
    let passwordUpdated = false;
    if (updates.password && (req as any).user.username === 'root') {
      const newPassword = updates.password;
      delete updates.password;
      
      if (newPassword.trim()) {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        const user = userDb.getById(userId);
        if (user) {
          // Update password using userDb method
          const updateResult = userDb.update(userId, { password: hashedPassword });
          passwordUpdated = true;
          
          // Log password change
          auditDb.create({
            action: 'update_password',
            entityType: 'user',
            entityId: userId,
            userId: (req as any).user.id,
            details: { changedBy: 'root' },
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
      }
    } else {
      delete updates.password;
    }
    
    // Remove other sensitive fields
    delete updates.id;

    // Handle role update separately if provided
    let roleUpdated = false;
    if (updates.role) {
      const newRole = updates.role;
      delete updates.role;
      
      // Verify role is valid
      const validRoles = ['admin', 'producer', 'curator', 'interviewer', 'operator', 'inactive'];
      if (validRoles.includes(newRole)) {
        const user = userDb.getById(userId);
        if (user) {
          const updatedWithRole = userDb.updateRole(userId, newRole);
          if (updatedWithRole) {
            roleUpdated = true;
            // Log the role change
            auditDb.create({
              action: 'update_role',
              entityType: 'user',
              entityId: userId,
              userId: (req as any).user.id,
              details: { newRole, previousRole: user.role },
              ip: req.ip,
              userAgent: req.get('User-Agent')
            });
          }
        }
      }
    }

    const updatedUser = userDb.update(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the profile update
    auditDb.create({
      action: 'update_profile',
      entityType: 'user',
      entityId: userId,
      userId: (req as any).user.id,
      details: { ...updates, roleUpdated },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting root user
    const user = userDb.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.username === 'root') {
      return res.status(403).json({ error: 'Cannot delete root user' });
    }

    const deleted = userDb.delete(userId);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the deletion
    auditDb.create({
      action: 'delete',
      entityType: 'user',
      entityId: userId,
      userId: (req as any).user.id,
      details: { deletedUser: user.username },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
