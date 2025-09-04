import { Router } from 'express';
import { modelDb, auditDb, syncModelAndSlot } from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage });

// Get all models
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const models = modelDb.getAll();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get model by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const model = modelDb.getById(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

// Create new model
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const model = modelDb.create(req.body);
    
    auditDb.create({
      action: 'model_create',
      entityType: 'model',
      entityId: model.id,
      userId: req.user!.id,
      details: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create model' });
  }
});

// Update model
router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const model = modelDb.update(req.params.id, req.body);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    auditDb.create({
      action: 'model_update',
      entityType: 'model',
      entityId: model.id,
      userId: req.user!.id,
      details: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update model' });
  }
});

// Delete model
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const success = modelDb.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    auditDb.create({
      action: 'model_delete',
      entityType: 'model',
      entityId: req.params.id,
      userId: req.user!.id,
      details: null,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

// Upload files for model
router.post('/:id/files', authenticateToken, upload.array('files'), (req: AuthRequest, res) => {
  try {
    const model = modelDb.getById(req.params.id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    const files = (req.files as Express.Multer.File[]).map(f => `/uploads/${f.filename}`);
    const updatedModel = modelDb.update(req.params.id, {
      files: [...(model.files || []), ...files]
    });
    
    auditDb.create({
      action: 'model_files_upload',
      entityType: 'model',
      entityId: req.params.id,
      userId: req.user!.id,
      details: { files },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json(updatedModel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Sync model with slot
router.post('/:modelId/sync/:slotId', authenticateToken, (req: AuthRequest, res) => {
  try {
    syncModelAndSlot(req.params.modelId, req.params.slotId);
    
    auditDb.create({
      action: 'model_slot_sync',
      entityType: 'model',
      entityId: req.params.modelId,
      userId: req.user!.id,
      details: { slotId: req.params.slotId },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync model and slot' });
  }
});

export default router;
