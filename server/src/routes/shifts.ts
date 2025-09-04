import express from 'express';
import { shiftDb, auditDb } from '../db/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all shifts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const shifts = shiftDb.getAll();
    res.json({ items: shifts });
  } catch (error) {
    console.error('Failed to get shifts:', error);
    res.status(500).json({ error: 'Failed to get shifts' });
  }
});

// Get shift by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const shift = shiftDb.getById(req.params.id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    res.json(shift);
  } catch (error) {
    console.error('Failed to get shift:', error);
    res.status(500).json({ error: 'Failed to get shift' });
  }
});

// Create new shift
router.post('/', authenticateToken, async (req, res) => {
  try {
    const shiftData = req.body;
    const shift = shiftDb.create(shiftData);
    
    // Log the creation
    auditDb.create({
      action: 'Создана смена',
      entityType: 'shift',
      entityId: shift.id,
      userId: (req as any).user.id,
      details: { model: shift.model, type: shift.type, status: shift.status },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json(shift);
  } catch (error) {
    console.error('Failed to create shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

// Update shift
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const shiftId = req.params.id;
    const updates = req.body;
    
    const originalShift = shiftDb.getById(shiftId);
    if (!originalShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const updatedShift = shiftDb.update(shiftId, updates);
    if (!updatedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Log the update
    const changes = Object.keys(updates).map(key => {
      const oldValue = (originalShift as any)[key];
      const newValue = updates[key];
      return `${key}: ${oldValue} → ${newValue}`;
    }).join(', ');
    
    auditDb.create({
      action: `Обновлена смена: ${changes}`,
      entityType: 'shift',
      entityId: shiftId,
      userId: (req as any).user.id,
      details: { changes: updates },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json(updatedShift);
  } catch (error) {
    console.error('Failed to update shift:', error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

// Delete shift
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const shiftId = req.params.id;
    const shift = shiftDb.getById(shiftId);
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const deleted = shiftDb.delete(shiftId);
    if (!deleted) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Log the deletion
    auditDb.create({
      action: 'Удалена смена',
      entityType: 'shift',
      entityId: shiftId,
      userId: (req as any).user.id,
      details: { model: shift.model, type: shift.type },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

export default router;
