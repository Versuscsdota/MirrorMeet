import express from 'express';
import { roleDb, auditDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = roleDb.getAll();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get role by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const role = roleDb.getById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Create new role (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, displayName, permissions } = req.body;

    if (!name || !displayName || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Name, displayName, and permissions array are required' });
    }

    // Check if role name already exists
    const existingRole = roleDb.getByName(name);
    if (existingRole) {
      return res.status(400).json({ error: 'Role name already exists' });
    }

    const roleData = {
      name,
      displayName,
      permissions
    };

    const newRole = roleDb.create(roleData);
    
    // Log the role creation
    auditDb.create({
      action: 'create',
      entityType: 'role' as any,
      entityId: newRole.id,
      userId: (req as any).user.id,
      details: { name, displayName, permissions },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json(newRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update role (admin only)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const roleId = req.params.id;
    const updates = req.body;

    // Check if user is root for role management
    const currentUser = (req as any).user;
    if (currentUser.username !== 'root') {
      return res.status(403).json({ error: 'Only root user can manage roles' });
    }

    const role = roleDb.getById(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const updatedRole = roleDb.update(roleId, updates);
    if (!updatedRole) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Log the role update
    auditDb.create({
      action: 'update',
      entityType: 'role' as any,
      entityId: roleId,
      userId: (req as any).user.id,
      details: updates,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete role (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const roleId = req.params.id;
    
    const role = roleDb.getById(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Don't allow deleting system roles
    if (['admin', 'inactive'].includes(role.name)) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    const deleted = roleDb.delete(roleId);
    if (!deleted) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Log the role deletion
    auditDb.create({
      action: 'delete',
      entityType: 'role' as any,
      entityId: roleId,
      userId: (req as any).user.id,
      details: { deletedRole: role.name },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Get available permissions list
router.get('/permissions/available', authenticateToken, async (req, res) => {
  try {
    const availablePermissions = [
      'users.create',
      'users.read', 
      'users.update',
      'users.delete',
      'models.create',
      'models.read',
      'models.update', 
      'models.delete',
      'slots.create',
      'slots.read',
      'slots.update',
      'slots.delete',
      'roles.create',
      'roles.read',
      'roles.update',
      'roles.delete',
      'analytics.read',
      'analytics.update',
      'audit.read'
    ];
    
    res.json(availablePermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

export default router;
