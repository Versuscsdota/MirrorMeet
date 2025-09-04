import { Router } from 'express';
import db from '../db/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all addresses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const addresses = db.prepare(`
      SELECT id, address, room, comment, created_at, updated_at
      FROM addresses
      ORDER BY address, room
    `).all();
    
    res.json({
      success: true,
      items: addresses,
      total: addresses.length
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить адреса'
    });
  }
});

// Get address by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = db.prepare(`
      SELECT id, address, room, comment, created_at, updated_at
      FROM addresses
      WHERE id = ?
    `).get(id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Адрес не найден'
      });
    }
    
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось загрузить адрес'
    });
  }
});

// Create new address
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { address, room, comment } = req.body;
    
    // Validation
    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Адрес обязателен для заполнения'
      });
    }
    
    if (!room || !room.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Количество комнат обязательно для заполнения'
      });
    }
    
    // Check if address with same room already exists
    const existingAddress = db.prepare(`
      SELECT id FROM addresses 
      WHERE LOWER(address) = LOWER(?) AND LOWER(room) = LOWER(?)
    `).get(address.trim(), room.toString().trim());
    
    if (existingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Адрес с таким номером комнаты уже существует'
      });
    }
    
    // Create address
    const result = db.prepare(`
      INSERT INTO addresses (address, room, comment, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).run(address.trim(), room.toString().trim(), comment || null);
    
    const newAddress = db.prepare(`
      SELECT id, address, room, comment, created_at, updated_at
      FROM addresses
      WHERE id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      data: newAddress,
      message: 'Адрес успешно создан'
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось создать адрес'
    });
  }
});

// Update address
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { address, room, comment } = req.body;
    
    // Validation
    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Адрес обязателен для заполнения'
      });
    }
    
    if (!room || !room.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Количество комнат обязательно для заполнения'
      });
    }
    
    // Check if address exists
    const existingAddress = db.prepare('SELECT id FROM addresses WHERE id = ?').get(id);
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Адрес не найден'
      });
    }
    
    // Check if another address with same room already exists
    const duplicateAddress = db.prepare(`
      SELECT id FROM addresses 
      WHERE LOWER(address) = LOWER(?) AND LOWER(room) = LOWER(?) AND id != ?
    `).get(address.trim(), room.toString().trim(), id);
    
    if (duplicateAddress) {
      return res.status(400).json({
        success: false,
        message: 'Адрес с таким номером комнаты уже существует'
      });
    }
    
    // Update address
    db.prepare(`
      UPDATE addresses 
      SET address = ?, room = ?, comment = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(address.trim(), room.toString().trim(), comment || null, id);
    
    const updatedAddress = db.prepare(`
      SELECT id, address, room, comment, created_at, updated_at
      FROM addresses
      WHERE id = ?
    `).get(id);
    
    res.json({
      success: true,
      data: updatedAddress,
      message: 'Адрес успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось обновить адрес'
    });
  }
});

// Delete address
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if address exists
    const existingAddress = db.prepare('SELECT id, address, room FROM addresses WHERE id = ?').get(id) as { id: string; address: string; room: string } | undefined;
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Адрес не найден'
      });
    }
    
    // Check if address is used in any shifts
    const shiftsUsingAddress = db.prepare(`
      SELECT COUNT(*) as count FROM shifts WHERE address = ? AND room = ?
    `).get(existingAddress.address, existingAddress.room) as { count: number };
    
    if (shiftsUsingAddress.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя удалить адрес, который используется в сменах'
      });
    }
    
    // Delete address
    db.prepare('DELETE FROM addresses WHERE id = ?').run(id);
    
    res.json({
      success: true,
      message: 'Адрес успешно удален'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось удалить адрес'
    });
  }
});

export default router;
