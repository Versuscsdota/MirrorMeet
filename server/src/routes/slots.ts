import { Router } from 'express';
import { slotDb, auditDb, syncModelAndSlot } from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Resolve uploads directory from env or default system path
const DEFAULT_UPLOADS_DIR = path.resolve('/var/lib/mirrorcrm/uploads');
const UPLOADS_DIRECTORY = process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
  ? process.env.UPLOADS_DIR
  : DEFAULT_UPLOADS_DIR;

if (!fs.existsSync(UPLOADS_DIRECTORY)) {
  fs.mkdirSync(UPLOADS_DIRECTORY, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIRECTORY);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

// Get all slots
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const slots = slotDb.getAll();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Get slot by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const slot = slotDb.getById(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slot' });
  }
});

// Create new slot
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Add registeredBy field to track who registered the slot
    const slotData = {
      ...req.body,
      registeredBy: req.user!.id
    };
    
    const slot = slotDb.create(slotData);
    
    auditDb.create({
      action: 'slot_create',
      entityType: 'slot',
      entityId: slot.id,
      userId: req.user!.id,
      details: slotData,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create slot' });
  }
});

// Update slot
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const slot = slotDb.update(req.params.id, req.body);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    auditDb.create({
      action: 'slot_update',
      entityType: 'slot',
      entityId: slot.id,
      userId: req.user!.id,
      details: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    // If slot has a modelId, sync the status
    if (slot.modelId) {
      syncModelAndSlot(slot.modelId, slot.id);
    }
    
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update slot' });
  }
});

// Delete slot
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const success = slotDb.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    auditDb.create({
      action: 'slot_delete',
      entityType: 'slot',
      entityId: req.params.id,
      userId: req.user!.id,
      details: {},
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

// Upload files for slot
router.post('/:id/files', authenticateToken, upload.array('files'), (req: AuthRequest, res) => {
  try {
    const slot = slotDb.getById(req.params.id);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    const files = (req.files as Express.Multer.File[]).map(f => `/uploads/${f.filename}`);
    const updatedSlot = slotDb.update(req.params.id, {
      files: [...(slot.files || []), ...files]
    });
    
    auditDb.create({
      action: 'slot_files_upload',
      entityType: 'slot',
      entityId: req.params.id,
      userId: req.user!.id,
      details: { files },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json(updatedSlot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Register model from slot
router.post('/:slotId/register-model', authenticateToken, (req: AuthRequest, res) => {
  try {
    const slot = slotDb.getById(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    
    // Create model from slot data
    const { modelId } = req.body;
    
    if (modelId) {
      // Link existing model to slot
      syncModelAndSlot(modelId, req.params.slotId);
      
      auditDb.create({
        action: 'slot_register_model',
        entityType: 'slot',
        entityId: req.params.slotId,
        userId: req.user!.id,
        details: { modelId },
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ success: true, modelId });
    } else {
      res.status(400).json({ error: 'Model ID required' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to register model from slot' });
  }
});

export default router;
